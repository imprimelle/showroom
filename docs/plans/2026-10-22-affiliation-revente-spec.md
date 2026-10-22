# Affiliation & Réseau de Revente — Étude & Spécification

> Date : 2026-10-22 · Périmètre : `imprimelle.com` (showroom Next.js 16 + Supabase)
> Statut : **Étude / spécification** (aucun code écrit — à valider avant implémentation)

---

## 1. Objectif

Mettre en place un **réseau tiers** à deux canaux complémentaires :

1. **Affiliation (digital)** — apporteurs d'affaires en ligne (influenceurs, créateurs,
   micro-influenceurs). Attribution par lien unique `?ref=CODE` et/ou code promo
   personnalisé. Commission à la performance, 0 coût fixe.
2. **Point de vente agréé (physique)** — showrooms, magasins de déco, architectes.
   Modèles : Showroom Exposeur (dépôt-exposition), Achat-Revente B2B, Corner dédié.

Livrables fonctionnels attendus :
- **Page revendeur publique** expliquant les deux options.
- **Carte** des points de vente partenaires (état vide → « Devenez le premier »).
- **Système d'affiliation** : lien unique + code promo + attribution + commission + suivi.
- **Back-office admin** : gestion des revendeurs, points de vente, commissions.

---

## 2. État des lieux (existant)

### 2.1 Stack & conventions (vérifiées dans le code)

| Élément | Valeur |
|---|---|
| Framework | Next.js **16** App Router, React 19, TypeScript |
| UI | Tailwind CSS **v4** (variables CSS `--color-*`), Framer Motion (LazyMotion), gsap |
| État | Zustand (`persist` → localStorage), TanStack Query |
| Validation | Zod **v4** (`error.issues`, pas `error.errors`) |
| Données | Supabase (PostgREST), tables `products`, `showcase_orders`, `showcase_settings`, `showcase_content`, `showcase_reviews`, `showcase_groupages` |
| Auth admin | PIN + JWT `jose` (cookie `admin_token`), middleware protège `/admin` + `/api/admin/*` (sauf login/logout) |
| Paiement | FedaPay (mobile money / Wave / carte), COD, `talk_first` |
| Devise | FCFA (XOF) en base, conversion d'affichage auto par pays |
| Analytics | `track()` → Umami / PostHog / Meta (consentement `marketing`/`analytics`) |
| Carte existante | `AfricaMapSection` = **SVG custom + gsap** (aucune lib carto) |
| Déploiement | Build local standalone → tar → SCP → `docker compose up -d --force-recreate showroom` |
| Contenu éditable | `showcase_content` (key/value) + `EditableText` inline ; `showcase_settings.data` (JSONB) |

### 2.2 Flux de commande actuel (point d'ancrage de l'affiliation)

```
panier (Zustand/localStorage) → /checkout → POST /api/orders
   ├─ validation serveur des prix (anti-falsification) : variante + options + groupage
   ├─ vérif frais de port, éligibilité paiement
   ├─ INSERT showcase_orders (status "new")
   ├─ pont facture (best-effort) + notification WhatsApp (fire-and-forget)
   └─ renvoie { payment_url } (FedaPay) | { whatsapp_url } (talk_first) | { order_id } (cod)
```

- Le **total est recalculé côté serveur** : `total_amount === sum(items[].subtotal_fcfa)`.
  → Toute remise (code promo affilié) devra s'insérer **dans ce contrôle**, pas à côté.
- Le checkout envoie `{ customer, items, total_amount, payment_method, shipping_country, shipping_fee_fcfa }`
  (voir `src/app/checkout/page.tsx` ligne ~142 et `src/schemas/order.ts`).

### 2.3 Tables Supabase existantes (synthèse)

- `products` : + `slug`, `is_published`, `showcase` (JSONB : variants, payment, groupage…).
- `showcase_orders` : colonnes client, `items` (JSONB), `total_amount`, `status`,
  `payment_method/status/reference`, `shipping_country/fee`, `total_with_shipping`,
  `groupage_id`, `deposit_fcfa`, `balance_fcfa`, `ip_address`, `user_agent`.
- `showcase_settings` : 1 ligne `id=1`, JSONB `data` (contact, meta, hero, home, catalog,
  shipping, payment_methods, product_parameters, faq_pills, idea_deco, social_proof, …).
- `showcase_content` : `key` → `value` (textes édités inline).

### 2.4 Constats déterminants pour la conception

1. **Pas de lib cartographique** → il faudra soit ajouter Leaflet (recommandé), soit réutiliser
   le pattern SVG custom (limité pour zoom/adresses réelles).
2. **Pas de notion de TVA** (prix FCFA « TTC implicites »). L'assiette « Hors Taxes » de la
   commission = **montant des articles (hors frais de livraison)**, soit `total_amount` déjà
   HT de fait. Frais de port = `shipping_fee_fcfa`, à exclure.
3. **Le code promo** touche le cœur anti-falsification du checkout : à traiter avec soin
   (revalidation serveur + recalcul du total + persistance du montant de remise).
4. **L'admin est déjà multi-pages** (`/admin/prix`, `/admin/avis`, `/admin/groupages`…) →
   ajouter `/admin/revendeurs` suit le pattern existant (nav `AdminNav.tsx` + page + API).
5. **Le contenu éditable inline** (`EditableText` + `showcase_content`) est le mécanisme à
   utiliser pour les textes de la page revendeur (cohérent avec tout le site).

---

## 3. Périmètre fonctionnel

### 3.1 Page revendeur publique — `/revendeurs`

- Hero + intro.
- **Deux options** côte à côte :
  - **Devenir Affilié** (digital) : lien unique + code promo, commissions 8–15 %, tableau de suivi.
  - **Point de vente agréé** (physique) : 3 modèles (Showroom Exposeur / Achat-Revente B2B / Corner).
- **Tableau comparatif** (investissement, commission, cible, livraison).
- **Carte des points de vente partenaires** + liste à côté.
  - État vide : bandeau **« Devenez le premier point de vente partenaire »** + CTA.
- **Formulaire de candidature** (les deux parcours) : type + coordonnées + message.
- Lien dans la nav (TopNav `links`) et le footer.

### 3.2 Affiliation — mécanique d'attribution

1. Un affilié reçoit un **code ref** unique (ex. `SOPHIE`) + un **code promo** (ex. `SOPHIE5`,
   `-5%`) + un **lien** `https://imprimelle.com/?ref=SOPHIE`.
2. Premier clic sur un lien `?ref=` → on **mémorise** le code côté visiteur (cookie 1st-party
   30 jours + `localStorage`).
3. Le code ref est **relu au checkout** et transmis dans le payload (`ref_code`).
4. `POST /api/orders` **résout** le code → affilié actif, **fige** le taux de commission au
   moment de la commande, calcule la commission = taux × `total_amount` (hors livraison).
5. Le code promo (`promo_code`) est validé serveur, applique une remise, le total est recalculé
   et la remise est persistée.
6. La commission passe en cycle de vie `pending → earned → paid` (déclenchée par le statut
   de commande **payé/livré**, pas à la création).

### 3.3 Espace affilié (dashboard léger)

- V1 : page publique `/affilies/[code]` (ou `/affilies?ref=CODE`) protégée par code : le
  suivi du CA généré, du nombre de ventes, des commissions en attente/versées, et le **lien
  de partage** à copier (avec bouton copier + partage WhatsApp).
- (Option V2 : login email/mot de passe dédié — hors V1 si l'utilisateur veut aller vite.)

### 3.4 Back-office admin — `/admin/revendeurs`

- Liste des revendeurs (filtrée par type affiliate/store, statut).
- CRUD : approbation, code ref, code promo, taux de commission, niveau, coordonnées.
- Pour les **points de vente** : nom, ville, adresse, téléphone, **lat/lng**, modèle de
  partenariat (A/B/C), statut publié/masqué (contrôle de la carte publique).
- Vue **commissions** : lignes par commande attribuée (affilié, commande, CA, taux, montant,
  statut), filtre par période, total par affilié, action « marquer payé ».

### 3.5 Grille de commission

| Niveau | Taux | Condition d'accès |
|---|---|---|
| Standard | 8 % | tout affilié inscrit |
| Performance | 10 % | ≥ 3 ventes OU ≥ 1 000 000 FCFA CA / mois |
| VIP / Partenaire | 12–15 % | prescripteurs réguliers (décision manuelle admin) |

Points de vente (physique) :
- Showroom Exposeur : 12–15 % par commande.
- Achat-Revente B2B : remise 25–35 % sur PPC (gérée hors commission — à traiter en « remise
  grossiste » ou devis, pas dans le moteur d'affiliation).

---

## 4. Modèle de données (proposition)

> Conventions : préfixe `showcase_`, UUID, `created_at`/`updated_at`, JSONB pour le souple.
> Migrations via **Management API** (`scripts/supabase_query.py`, cf. skill showroom § Supabase).

### 4.1 `showcase_resellers` — table unique des revendeurs

| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `type` | text | `'affiliate'` \| `'store'` |
| `status` | text | `'pending'` \| `'active'` \| `'suspended'` \| `'rejected'` |
| `name` | text | nom de la personne / du commerce |
| `contact_name` | text | |
| `email` | text | |
| `phone` | text | |
| `ref_code` | text UNIQUE | slug du lien `?ref=` (affilié uniquement) |
| `promo_code` | text UNIQUE | code promo (affilié) |
| `promo_discount_percent` | numeric | ex. 5 |
| `commission_rate` | numeric | taux figeable par défaut (8) |
| `level` | text | `'standard'`\|`'performance'`\|`'vip'` (recalculable) |
| `store_model` | text | `'showroom'`\|`'b2b'`\|`'corner'` (store uniquement) |
| `city` / `country` / `address` | text | |
| `lat` / `lng` | numeric | store uniquement (carte) |
| `website` / `social` | text | |
| `is_published` | bool | contrôle d'affichage carte publique |
| `notes` | text | notes internes admin |
| `created_at` / `updated_at` | timestamptz | |

RLS : `SELECT` anon → uniquement les stores `is_published` (via vue/API filtrée) ;
écritures service-role uniquement. (L'API publique ne doit pas exposer les affiliés ni
les données perso.)

### 4.2 Colonnes ajoutées à `showcase_orders`

| Colonne | Type | Notes |
|---|---|---|
| `reseller_id` | uuid null | FK → showcase_resellers (attribué à la commande) |
| `ref_code` | text null | code d'affiliation utilisé (traçabilité) |
| `promo_code` | text null | code promo appliqué |
| `promo_discount_fcfa` | int null | montant de remise figé |
| `commission_rate` | numeric null | taux figé au moment de la commande |
| `commission_fcfa` | int null | montant de commission (HT hors livraison) |
| `commission_status` | text null | `'pending'`\|`'earned'`\|`'paid'`\|`'cancelled'` |

### 4.3 `showcase_affiliate_clicks` — tracking des clics (optionnel, stats)

| Colonne | Type |
|---|---|
| `id` | uuid PK |
| `ref_code` | text |
| `landing_path` | text |
| `ip` / `user_agent` | text |
| `created_at` | timestamptz |

(Utile pour mesurer la portée par affilié ; peut être omis en V1.)

### 4.4 `showcase_commissions` — lignes de commission (cycle de vie)

Alternative à des colonnes seules sur `showcase_orders` si on veut un suivi de **paiement**
agrégé (date de versement, référence, mode). En V1, les colonnes sur `showcase_orders`
+ une vue admin suffisent ; la table dédiée est recommandée dès qu'on automatise le paiement.

---

## 5. API routes (nouvelles)

| Route | Méthode | Accès | Rôle |
|---|---|---|---|
| `POST /api/resellers/apply` | POST | anon (rate-limit) | candidature affilié / point de vente |
| `GET /api/resellers/stores` | GET | anon | liste points de vente publiés (carte) |
| `GET /api/affiliates/[code]` | GET | public | mini-dashboard affilié (stats agrégées) |
| `GET /api/admin/resellers` | GET | admin | liste + filtres |
| `POST /api/admin/resellers` | POST | admin | création manuelle |
| `GET/PUT/DELETE /api/admin/resellers/[id]` | — | admin | lecture/édition/suppression |
| `GET /api/admin/commissions` | GET | admin | lignes de commission + agrégats |
| `PATCH /api/admin/commissions/[orderId]` | PATCH | admin | changer statut (paid/cancelled) |

- Toutes les routes `/api/admin/*` sont **déjà protégées** par le middleware (JWT) — rien à
  changer côté auth.
- `POST /api/resellers/apply` doit être **rate-limité** (pattern existant dans `orders/route.ts` :
  map en mémoire IP → 3/5 min) + validation Zod + anti-spam.
- `GET /api/resellers/stores` renvoie **uniquement** `is_published=true` et les champs publics
  (nom, ville, adresse, lat, lng, modèle) — jamais email/phone perso/notes.

---

## 6. Attribution & anti-fraude (points de vigilance)

- **Cookie 1st-party** `showroom_ref` (30 j, `SameSite=Lax`, `Secure`) + `localStorage` en
  repli. Posé par un petit composant client qui lit `?ref=` au chargement.
- **Résolution serveur à la commande** : le code ref doit exister, être `active`, type
  `affiliate`. Sinon → commande acceptée mais **sans** attribution (pas de blocage client).
- **Anti self-referral** : pas de commission si `reseller.email` == `customer.email` (option).
- **Figer le taux** au moment de la commande (une montée de niveau ultérieure ne doit pas
  rétro-agir sur les commandes passées).
- **Commission conditionnée** : `commission_status = pending` à la création ; passe à
  `earned` quand la commande est **payée** (FedaPay `approved`/`transferred`, ou COD confirmé) ;
  `cancelled` si commande annulée/remboursée. Ne jamais verser sur `new`.
- **Le code promo est revalidé serveur** (jamais confiance au client) : taux fixe par affilié,
  plafonnement éventuel, un seul code promo par commande.

---

## 7. Carte des points de vente

**Recommandation : Leaflet** (tuiles OSM, sans clé API, gratuit), chargé dynamiquement
(`next/dynamic` + `ssr:false`) pour éviter le SSR. Usage direct de `leaflet` (pas
`react-leaflet`, qui peut poser des soucis de peer-deps React 19 — même logique que le
recadreur canvas sans `react-easy-crop`).

- Le point de vente stocke `lat`/`lng` (saisie admin). Géocodage d'aide côté admin via
  **Nominatim** (OSM, gratuit) au moment de l'édition (optionnel, bouton « Géocoder l'adresse »).
- **État vide** : si `GET /api/resellers/stores` renvoie `[]` → bandeau « Devenez le premier
  point de vente partenaire » + CTA candidature.
- Fallback sans JS / sans réseau : liste textuelle des points de vente sous la carte.

---

## 8. Décisions à trancher (recommandation par défaut en gras)

1. **Paiement des commissions** : manuel en V1 (admin marque « payé » + note de versement
   Wave/Orange/virement) — **recommandé**. Automatisation = hors V1.
2. **Seuil de versement** : ex. **25 000 FCFA** minimum avant paiement (ou « dès le 1er CA »).
3. **Durée d'attribution cookie** : **30 jours** (standard).
4. **Modèle d'attribution** : **last-click** (le dernier `?ref=` cliqué gagne) — plus simple.
5. **Code promo** : remise **configurable par affilié** (défaut 5 %) — **recommandé**, avec
   possibilité de désactiver (pas de code promo pour certains affiliés).
6. **Approbation des candidatures** : **validation manuelle** par l'admin (envoi du lien ref
   après validation) — évite la fraude et reste cohérent avec le réseau « agréé ».
7. **Espace affilié** : **code d'accès (ref_code) en V1**, login email/mot de passe en V2.
8. **Remise B2B (25–35 %)** : **hors moteur d'affiliation** — gérée en devis/grille grossiste
   (ne pas mélanger « commission » et « remise d'achat de stock »).
9. **Notification nouvelle candidature** : **WhatsApp** (réutiliser `WHATSAPP_QUEUE_URL`) ou
   email. À confirmer.

---

## 9. Plan d'implémentation (phases)

### Phase 0 — Fondations données
1. Migration SQL : `showcase_resellers`, colonnes `showcase_orders.*`, (option) `showcase_affiliate_clicks`.
2. Types TS (`src/types/index.ts`) : `Reseller`, `ResellerType`, `ResellerStatus`, etc.

### Phase 1 — Affiliation (digital)
3. Composant client `ReferralCapture` (lit `?ref=`, pose cookie/localStorage).
4. `POST /api/orders` : accepter `ref_code` + `promo_code`, résoudre, figer taux, calculer
   commission + remise, persister. Adapter `createOrderSchema` + le checkout (champ promo).
5. Routes admin `/api/admin/resellers*` + page `/admin/revendeurs`.

### Phase 2 — Page revendeur + carte
6. Page `/revendeurs` (2 options + comparatif + formulaire candidature).
7. `GET /api/resellers/stores` + composant carte Leaflet + état vide + liste.
8. `POST /api/resellers/apply`.

### Phase 3 — Suivi & finitions
9. Mini-dashboard affilié `/affilies/[code]`.
10. Vue commissions admin + statut « payé ».
11. Notifications candidature/commande (WhatsApp).
12. Analytics : événements `affiliate_click`, `affiliate_conversion` via `track()`.

### Phase 4 — Industrialisation (option)
- Recours au niveau (Performance/VIP) automatisé (job).
- Login affilié, paiements automatisés, table `showcase_commissions` dédiée.

---

## 10. Risques & points d'attention

- **Ne pas casser l'anti-falsification du checkout** : la remise promo doit être revalidée
  côté serveur et le total recalculé dans `POST /api/orders`, pas côté client seulement.
- **Exposition de données** : l'API publique des points de vente ne doit renvoyer que les
  champs publics ; les affiliés et données perso restent derrière l'admin (RLS + service-role).
- **Leaflet + SSR** : chargement `ssr:false` obligatoire (pas de `window` au build).
- **Déploiement** : chaque phase suit la checklist (commit → build → tar → scp → compose →
  vérif HTTP 200 + changement live). `npm install leaflet` avant build.
- **Zod v4** (`error.issues`) et **Next 16** (`params`/`searchParams` = Promises) — rappels
  de la skill showroom.
