const faqs = [
  { q: "Quels sont vos délais de fabrication ?", a: "7 à 10 jours ouvrés selon le type d'enseigne et la complexité." },
  { q: "Livrez-vous partout en Côte d'Ivoire ?", a: "Oui, nous livrons dans tout le pays. L'installation est incluse à Abidjan." },
  { q: "Quels sont les modes de paiement ?", a: "Paiement à la livraison en espèces ou par mobile money (Orange Money, Wave)." },
  { q: "Proposez-vous une garantie ?", a: "Oui, tous nos produits sont garantis 2 ans." },
  { q: "Puis-je personnaliser mon enseigne ?", a: "Absolument. Toutes nos enseignes sont fabriquées sur mesure selon vos besoins." },
  { q: "Comment suivre ma commande ?", a: "Rendez-vous sur la page Suivi et entrez votre numéro de téléphone." },
];

export default function FAQPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-2">Foire aux questions</h1>
      <p className="text-sm text-[var(--color-text-secondary)] mb-8">Tout ce que vous devez savoir sur nos enseignes lumineuses</p>
      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <details key={i} className="group rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)]">
            <summary className="flex items-center justify-between px-4 py-3 cursor-pointer text-sm font-medium text-[var(--color-text-primary)] select-none">
              {faq.q}
              <span className="text-[var(--color-text-tertiary)] group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="px-4 pb-4 text-sm text-[var(--color-text-secondary)] leading-relaxed">{faq.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
