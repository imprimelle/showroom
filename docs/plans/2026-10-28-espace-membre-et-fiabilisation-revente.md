# Plan — Fiabilisation du réseau de revente & Espace membre

> **Contexte** : audit du parcours affilié/revendeur du showroom (28/10/2026). 10 écarts identifiés + demande d'un **espace membre** unifié pour les **clients**, les **points de vente** et les **affiliés**.
> **Goal** : rendre le réseau de revente fonctionnel de bout en bout (attribution, commissions, géolocalisation, notifications) et ajouter une zone membre authentifiée à 3 rôles.
> **Stack** : Next.js 16 App Router + TypeScript + Tailwind v4 + Zustand + Zod + Supabase (service-role) + `jose` (JWT) + WhatsApp bridge (`WHATSAPP_QUEUE_URL`).
> **Projet** : `/workspace/showroom/` · Déploiement : build local → tar standalone → SCP VPS → `docker compose up -d --force-recreate showroom`.

---

## 1. Problèmes résolus (référence aux 10 écarts de l'audit)

| # | Écart | Résolu par |
|---|---|---|
| 1 | Les points de vente ne peuvent jamais générer de commission | Phase 2 |
| 2 | `lat`/`lng` jamais collecté ni éditable → stores invisibles sur la carte | Phase 3 |
| 3 | Commission `earned` seulement via FedaPay (COD/talk_first jamais acquises) | Phase 2 |
| 4 | Aucun retour au candidat après approbation/rejet | Phase 4 |
| 5 | Dashboard affilié non authentifié + codes prédictibles | Phase 5 |
| 6 | Stats affilié non filtrées par statut de commande | Phase 1 |
| 7 | Clics `showcase_affiliate_clicks` collectés mais invisibles | Phase 6 |
| 8 | Seuil de versement `DEFAULT_PAYOUT_MIN_FCFA` mort + pas de versement | Phase 6 |
| 9 | Admin commissions : total « En attente » inclut les `cancelled` | Phase 1 |
| 10 | `ref_code` généré peut être vide (nom sans alphanumériques) | Phase 1 |

---

## 2. Décisions d'architecture (à valider)

### D1 — Authentification de l'espace membre : **OTP par téléphone (WhatsApp)** *(recommandé)*
- Identifiant universel = **téléphone normalisé** (`normalizePhone`, déjà dans `lib/utils.ts`), cohérent avec un checkout **phone-only** et le suivi `/suivi` existant.
- Flux : `POST /api/member/request-otp` (rate-limit 5/15 min/IP) → OTP 6 chiffres → WhatsApp via `WHATSAPP_QUEUE_URL` → `POST /api/member/verify-otp` → JWT `jose` cookie httpOnly `member_token` (24 h), **même pattern que l'admin**.
- **Alternatives** : magic link (même canal), ou email/password (rejeté : email non collecté au checkout ni sur les formulaires affilié/store).
- **Dépendance à valider** : le bridge WhatsApp doit pouvoir **envoyer vers un destinataire arbitraire** (aujourd'hui il ne reçoit que des notifications internes `new_order`/`new_reseller_application`). Si non supporté : repli SMS (nécessite un provider) ou OTP email (nécessite de collecter l'email). → *Question ouverte Q1.*

### D2 — Modèle d'attribution des points de vente : **un code `ref_code` pour les stores aussi** *(recommandé)*
- Généraliser `resolveAffiliateByRef` → `resolveResellerByRef` (accepte `type ∈ {affiliate, store}`, statut `active`). Un store reçoit un `ref_code` à l'approbation (lien `?ref=` et/ou un code promo dédié), et touche une commission (taux store par défaut **12 %**, configurable dans `showcase_settings.data.affiliation.rates`).
- **Alternative** : stores sans attribution digitale, uniquement B2B « remise 25–35 % » gérée hors site. → *Question ouverte Q2* (le tableau comparatif affiche « 12–15 % » pour les showrooms, « remise 25–35 % » pour le B2B — à trancher).

### D3 — Rôles dérivés, identité unique
- Un membre peut cumuler plusieurs rôles (`client`, `affiliate`, `store`). Rôles **dérivés** des liens : `showcase_orders.member_id` (client), `showcase_resellers.member_id` (affilié/store).
- **Liaison par téléphone normalisé** : au signup → backfill `member_id` sur les commandes + revendeurs dont le téléphone matche ; à la création de commande → set `member_id` si un membre existe ; à l'approbation revendeur → set `member_id`.

### D4 — Le dashboard affilié devient privé
- `/affilies/[code]` (accès par code, public) est **déprécié** → redirige vers `/compte/connexion`. Le lien de partage `?ref=CODE` reste public (attribution), seul le **dashboard** devient authentifié. Résout l'écart #5.

---

## 3. Modèle de données (migration Supabase)

Nouveau fichier `scripts/migration-members.sql` (idempotent, appliqué via Management API / `supabase-sql --file`) :

```sql
-- Identité membre (téléphone normalisé = clé)
create table if not exists showroom_members (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  name text,
  email text,
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

-- OTP (un code actif par téléphone, consommé après usage)
create table if not exists showroom_otp (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  code_hash text not null,          -- sha256(phone:code:SECRET)
  expires_at timestamptz not null,  -- 10 min
  attempts int not null default 0,  -- max 5
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_showroom_otp_phone on showroom_otp(phone, created_at desc);

-- Lien membre (commande / revendeur)
alter table showcase_orders add column if not exists member_id uuid references showroom_members(id) on delete set null;
alter table showcase_resellers add column if not exists member_id uuid references showroom_members(id) on delete set null;

-- (ref_code existe déjà sur showcase_resellers — on l'utilise désormais pour type='store' aussi)
```

> Aucune RLS Supabase-auth : l'espace membre suit le **pattern admin** (service-role + JWT `jose` + middleware Next.js). Les routes `/api/member/*` filtrent par `member_id` extrait du JWT.

---

## 4. Phases & tâches

### Phase 1 — Correctifs backend rapides (écarts 6, 9, 10) — *faible risque, déployable immédiatement*

**T1.1 — Filtrer les stats affilié par statut de commande**
- `Modify: src/lib/resellers.ts` → `getAffiliateStats()` : n'agréger `revenue_fcfa` et `order_count` que sur les commandes dont `status ∉ {cancelled, failed}` (les buckets `pending/earned/paid` restent basés sur `commission_status`, inchangés).
- Vérif : commande annulée attribuée → le CA/ventes du dashboard affilié n'augmente pas.

**T1.2 — Corriger le total « En attente » des commissions admin**
- `Modify: src/app/admin/commissions/page.tsx` : l'agrégat `totals.pending_fcfa` ne doit compter que `commission_status IN (pending, null)` (exclure `cancelled`).
- Vérif : une commission annulée n'apparaît plus dans le montant « En attente ».

**T1.3 — Garde contre un `ref_code` vide à l'approbation**
- `Modify: src/app/admin/revendeurs/ResellersListClient.tsx` (fonction `approve`) : si le code dérivé du nom est vide, générer `REF-<6 hex>` en repli. Idem dans la génération `promo_code`.
- Vérif : approbation d'un affilié dont le nom est « Ééé » → code non vide, attribution fonctionnelle.

*Déploiement : build + tar + SCP + recreate (procédure standard).*

---

### Phase 2 — Attribution & commissions (écarts 1, 3) — *risque moyen*

**T2.1 — Généraliser la résolution à tous les revendeurs actifs**
- `Modify: src/lib/resellers.ts` : ajouter `resolveResellerByRef()` (type ∈ affiliate/store, status active) ; garder `resolveAffiliateByRef` comme alias pour ne rien casser.
- `Modify: src/app/api/orders/route.ts` : utiliser `resolveResellerByRef` pour `ref_code`, et `resolveAffiliateByPromo`/`resolveResellerByPromo` pour `promo_code`. La commission s'applique aussi aux stores (taux store via `commissionRateFor` étendu).

**T2.2 — Taux de commission des stores + config**
- `Modify: src/lib/resellers.ts` : ajouter `DEFAULT_STORE_COMMISSION_RATE = 12` ; `commissionRateFor(level, type, configured)`.
- `Modify: src/app/admin/revendeurs/ResellersListClient.tsx` : à l'approbation d'un **store**, générer un `ref_code` (même règle T1.3) et initialiser `commission_rate` à 12 si absent.

**T2.3 — Commission `earned` sur les paiements hors FedaPay**
- `Modify: src/app/api/admin/orders/[id]/status/route.ts` (ou un hook dédié) : quand l'admin passe une commande `status → delivered/paid`, basculer `commission_status pending → earned` (garder `.eq("commission_status","pending")` idempotent, comme le fait le return FedaPay).
- Vérif : commande COD marquée livrée → commission acquise sans action manuelle sur `/admin/commissions`.

---

### Phase 3 — Géolocalisation des points de vente (écart 2)

**T3.1 — Géocodage serveur best-effort**
- `Create: src/lib/geocode.ts` : `geocodeAddress(address, city, country)` → `{lat,lng} | null` via **Nominatim OSM** (`https://nominatim.openstreetmap.org/search`, `User-Agent` requis, cache en mémoire court). Rate-limit doux, timeout 4 s, `null` si échec (jamais bloquant).
- `Modify: src/app/api/resellers/apply/route.ts` : après insert, tenter un géocodage et `update lat/lng` (best-effort).

**T3.2 — Champs lat/lng + « Géolocaliser » dans l'admin**
- `Modify: src/app/admin/revendeurs/ResellersListClient.tsx` (modale d'édition store) : ajouter `lat`/`lng` (numériques) + bouton « Géolocaliser depuis l'adresse » (appelle `/api/admin/resellers/[id]/geocode`).
- `Create: src/app/api/admin/resellers/[id]/geocode/route.ts` : géocode + PATCH lat/lng.
- Vérif : un store approuvé + adresse renseignée + « Géolocaliser » → apparaît sur la carte publique.

**T3.3 — (si Phase 5) géoloc en self-service côté espace membre store** → voir T5.5.

---

### Phase 4 — Notification au candidat (écart 4)

**T4.1 — Retour WhatsApp après approbation/rejet**
- `Modify: src/app/api/admin/resellers/[id]/route.ts` : après un PATCH `status` (active/rejected), envoyer (fire-and-forget) un message via `WHATSAPP_QUEUE_URL` `{type:"reseller_decision", phone, name, decision, ref_code, promo_code, dashboard_url}`.
- Vérif : approbation d'un affilié → message WhatsApp reçu avec son lien + code (même dépendance que D1 — *Q1*).

---

### Phase 5 — Espace membre (3 rôles) — *nouvelle feature majeure*

**T5.1 — Socle auth OTP**
- `Create: src/lib/member/auth.ts` : `signMemberToken()`, `verifyMemberToken()`, `hashOtp()`, `generateOtp()` (miroir de `src/lib/admin/auth.ts`).
- `Create: src/lib/member/otp.ts` : `sendOtp(phone, code)` via `WHATSAPP_QUEUE_URL` + rate-limit mémoire.
- `Create: src/app/api/member/request-otp/route.ts` et `.../verify-otp/route.ts` : Zod, rate-limit, insert/consomme `showroom_otp`, upsert `showroom_members`, pose `member_token`.
- `Create: src/app/api/member/logout/route.ts`.

**T5.2 — Middleware + backfill de liaison**
- `Modify: src/middleware.ts` : protéger `/compte/:path*` et `/api/member/:path*` (hors request/verify) via `verifyMemberToken`.
- `Create: src/lib/member/link.ts` : `linkByPhone(admin, phone)` → backfill `member_id` sur commandes + revendeurs ; appelé au verify-otp.
- `Modify: src/app/api/orders/route.ts` : poser `member_id` si un membre existe pour `customer_phone`.

**T5.3 — Pages compte (client)**
- `Create: src/app/compte/layout.tsx`, `page.tsx` (hub), `connexion/page.tsx` (form phone + OTP), `commandes/page.tsx` (+ `CommandesClient.tsx`) : liste des commandes du membre (statut, total, lien suivi, re-commander).
- `Create: src/app/api/member/orders/route.ts` (GET, filtré par `member_id`).

**T5.4 — Espace affilié authentifié**
- `Create: src/app/compte/affiliation/page.tsx` (+ client) : reprend le contenu de `AffiliateDashboardClient` mais alimenté par `GET /api/member/affiliation` (filtré `member_id`, plus par code public).
- `Modify: src/app/affilies/[code]/page.tsx` : rediriger vers `/compte/connexion?next=/compte/affiliation`.
- Résout #5 (plus d'accès par code prédictible).

**T5.5 — Espace point de vente authentifié**
- `Create: src/app/compte/boutique/page.tsx` (+ client) : profil (nom, contact, adresse, site, social), **géoloc self-service** (réutilise T3.1 → prévisualisation carte `StoresMap`), statut de publication (lecture), lien `?ref=`.
- `Create: src/app/api/member/store/route.ts` (GET/PATCH profil store du membre).
- Vérif : un store se connecte par OTP, met à jour son adresse → lat/lng mis à jour → carte publique reflète le changement.

**T5.6 — Nav & entrée**
- `Modify: src/components/layout/TopNav.tsx` : entrée « Compte » (icône) dans le burger + header ; `src/components/layout/Footer.tsx` : lien « Espace membre ».
- `Modify: src/app/confirmation/page.tsx` : CTA « Créer mon espace » post-commande.

---

### Phase 6 — Portée & versement (écarts 7, 8)

**T6.1 — Exposer les clics**
- `Modify: src/app/api/member/affiliation/route.ts` : inclure `clicks` (count sur `showcase_affiliate_clicks` par `ref_code`).
- `Modify: src/app/admin/revendeurs/page.tsx` : charger les clics par revendeur (jointure `ref_code`) et les afficher dans `ResellersListClient` (colonne « Clics »).

**T6.2 — Versement par affilié**
- `Modify: src/app/admin/commissions/page.tsx` : ajouter une vue **agrégée par revendeur** (somme `earned`, seuil `DEFAULT_PAYOUT_MIN_FCFA` lu depuis `showcase_settings.data.affiliation`), bouton « Tout marquer versé » (PATCH batch) + export CSV.

---

## 5. Risques & compromis

- **Dépendance WhatsApp sortant (Q1)** : tout le socle OTP/notif repose sur la capacité du bridge à émettre vers un numéro arbitraire. À valider **avant** la Phase 4/5. L'abstraction `sendOtp`/`sendMessage` isole le canal pour un repli SMS/email.
- **Géocodage Nominatim** : gratuit mais rate-limité et imprécis hors des grandes villes ; `null` = fallback (l'admin pourra toujours saisir lat/lng à la main, T3.2). Pas de coût.
- **Migration de `/affilies/[code]` → `/compte`** : cassure des liens dashboard existants déjà partagés par des affiliés → redirection + message d'explication (pas de 404 brut).
- **Un membre multi-rôles** : un même téléphone peut être client + affilié + store → le hub `/compte` doit afficher les sections selon les rôles dérivés (pas de role fixe stocké).
- **RLS absente côté membres** : assumé (pattern admin service-role). Si le besoin d'exposition anon apparaît plus tard, ajouter une RLS propre.

## 6. Questions ouvertes / décisions à valider

- **Q1** — Le bridge WhatsApp (`WHATSAPP_QUEUE_URL`) peut-il envoyer un OTP/message vers un **numéro client arbitraire** ? Sinon, quel repli (SMS provider, OTP email) ?
- **Q2** — Les **points de vente** doivent-ils recevoir une **commission digitale** via `?ref=` (reco D2, taux 12 %), ou rester en B2B « remise 25–35 % » géré hors site ? (impacte T2.1/T2.2).
- **Q3** — Priorisation : confirmer l'ordre des phases (suggéré : 1 → 2 → 3 → 4 → 5 → 6), ou traiter la Phase 5 (espace membre) en premier ?
- **Q4** — Le **publish** (`is_published`) des stores reste-t-il admin-only (reco), ou les stores peuvent-ils se publier/dépublier eux-mêmes ?

---

## 7. Ordre d'exécution suggéré & vérification finale

1. Phases 1 (rapide) puis 2 → déployer et vérifier l'attribution store + `earned` COD.
2. Phases 3 et 4 (géoloc + notif) → déployer.
3. Phase 5 (espace membre) en sous-livraisons : auth → client → affilié → store → nav.
4. Phase 6 (portée + versement).

**Vérification de bout en bout** : créer un affilié + un store de test → approuver → (store) géolocaliser → visiter `/?ref=…` → passer une commande (en ligne puis en COD) → vérifier attribution + `earned`/`paid` dans `/admin/commissions` → se connecter en OTP dans `/compte` et voir commandes / affiliation / boutique.

*Chaque phase suit la règle projet : commit + push → build local → tar standalone → SCP → `docker compose up -d --force-recreate showroom` → vérif HTTP 200 + BUILD_ID.*
