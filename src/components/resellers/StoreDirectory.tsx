import { getPublicStores } from "@/lib/resellers";
import StoresMap from "@/components/resellers/StoresMap";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { MapPin } from "lucide-react";

/**
 * Répertoire des points de vente partenaires (carte + liste + état vide).
 * Utilisé en bas de la page d'accueil. Server Component : charge les stores publiés.
 */
export async function StoreDirectory() {
  const stores = await getPublicStores();

  return (
    <section className="bg-[var(--color-bg-secondary)] border-t border-[var(--color-border-default)]">
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <SectionHeader
          align="left"
          eyebrow="Où nous trouver"
          title="Nos points de vente partenaires"
          subtitle="Retrouvez nos produits dans les boutiques et showrooms partenaires."
          eyebrowKey="stores.eyebrow"
          titleKey="stores.title"
          subtitleKey="stores.subtitle"
        />
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            {stores.length > 0 ? (
              <StoresMap stores={stores} />
            ) : (
              <div className="h-[360px] md:h-[440px] w-full rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-card)] flex flex-col items-center justify-center text-center px-6">
                <MapPin className="w-10 h-10 text-[var(--color-accent-amber)] mb-3" />
                <p className="font-display text-lg font-bold text-[var(--color-text-primary)]">
                  Devenez le premier point de vente partenaire
                </p>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)] max-w-sm">
                  Aucun point de vente pour le moment. C&apos;est l&apos;occasion idéale d&apos;être le premier à
                  exposer nos produits.
                </p>
                <a href="/revendeurs" className="mt-4">
                  <Button variant="primary" size="sm">Devenir partenaire</Button>
                </a>
              </div>
            )}
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-[var(--color-text-primary)] mb-3">
              {stores.length > 0 ? `${stores.length} point${stores.length > 1 ? "s" : ""} de vente` : "Aucun point de vente"}
            </h3>
            {stores.length === 0 ? (
              <p className="text-sm text-[var(--color-text-secondary)]">
                La carte affichera les boutiques partenaires dès qu&apos;elles seront agréées.
              </p>
            ) : (
              <ul className="space-y-3">
                {stores.map((s) => (
                  <li key={s.id} className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-3">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">{s.name}</p>
                    {s.city && <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">{s.city}{s.address ? ` — ${s.address}` : ""}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
