import Link from "next/link";

/**
 * Comparateur statique des principaux types d'enseignes.
 * Données produit (prix, délai, usage) constatées en base le 16/09/2026.
 * Composant serveur (aucun state) — liens vers les sous-catégories filtrées.
 */

const COLUMNS = [
  { id: "caisson-lumineux", name: "Caisson lumineux", icon: "💡" },
  { id: "enseigne-dibond", name: "Enseigne dibond", icon: "🏢" },
  { id: "lettres-3d", name: "Lettres 3D", icon: "🔤" },
  { id: "enseigne-neon", name: "Enseigne néon", icon: "✨" },
];

const ROWS: { label: string; values: string[] }[] = [
  { label: "Prix dès", values: ["180 000 F", "50 000 F", "379 000 F", "129 000 F"] },
  { label: "Lumineux", values: ["✅ Oui", "❌ Non", "✅ Oui", "✅ Oui"] },
  { label: "Usage", values: ["Extérieur", "Int. & ext.", "Extérieur", "Intérieur"] },
  { label: "Délai", values: ["7-10 j", "3-7 j", "10-14 j", "5-7 j"] },
  { label: "Idéal pour", values: ["Vitrine visible de loin", "Façade sobre, plaque pro", "Logo premium en relief", "Déco & ambiance"] },
];

export function Comparator() {
  return (
    <section className="mb-8">
      <h2 className="font-display text-xl md:text-2xl font-bold text-[var(--color-text-primary)] mb-1">
        Comparer nos enseignes
      </h2>
      <p className="text-sm text-[var(--color-text-secondary)] mb-4">
        Un doute entre deux types ? Ce tableau vous aide à choisir.
      </p>

      <div className="overflow-x-auto rounded-2xl border border-[var(--color-border-default)]">
        <table className="w-full min-w-[640px] text-sm border-collapse">
          <thead>
            <tr className="bg-[var(--color-bg-secondary)]">
              <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-tertiary)] align-bottom">
                Critère
              </th>
              {COLUMNS.map((c) => (
                <th key={c.id} className="px-3 py-3 text-center align-bottom">
                  <Link
                    href={`/collection?family=enseignes-signaletique&category=${c.id}`}
                    className="flex flex-col items-center gap-1 font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-accent-blue)] transition-colors"
                  >
                    <span className="text-xl">{c.icon}</span>
                    <span className="text-xs leading-tight">{c.name}</span>
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, i) => (
              <tr key={row.label} className={i % 2 === 0 ? "bg-[var(--color-surface-card)]" : "bg-[var(--color-bg-primary)]"}>
                <td className="px-4 py-3 font-medium text-[var(--color-text-secondary)]">{row.label}</td>
                {row.values.map((v, j) => (
                  <td key={j} className="px-3 py-3 text-center text-[var(--color-text-primary)]">
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
