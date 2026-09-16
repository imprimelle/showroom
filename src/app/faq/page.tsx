const faqSections = [
  {
    title: "Général",
    icon: "ℹ️",
    items: [
      { q: "Quels sont vos délais de fabrication ?", a: "7 à 10 jours ouvrés selon le produit et la complexité." },
      { q: "Livrez-vous partout en Côte d'Ivoire ?", a: "Oui, nous livrons dans tout le pays. L'installation est incluse à Abidjan." },
      { q: "Quels sont les modes de paiement ?", a: "Paiement à la livraison en espèces ou par mobile money (Orange Money, Wave)." },
      { q: "Proposez-vous une garantie ?", a: "Oui, tous nos produits sont garantis 2 ans." },
      { q: "Comment suivre ma commande ?", a: "Rendez-vous sur la page Suivi et entrez votre numéro de téléphone." },
    ],
  },
  {
    title: "Enseignes & Signalétique",
    icon: "💡",
    items: [
      { q: "Quelle enseigne choisir : caisson, dibond ou lettres 3D ?", a: "Le caisson lumineux est rétroéclairé et visible de loin, le dibond est économique pour une façade sobre, les lettres 3D offrent un rendu premium. Notre comparateur vous aide à trancher." },
      { q: "Une enseigne extérieure résiste-t-elle aux intempéries ?", a: "Oui, nos enseignes extérieures sont conçues pour résister au soleil et à la pluie en Côte d'Ivoire." },
      { q: "Puis-je personnaliser mon enseigne ?", a: "Absolument. Toutes nos enseignes sont fabriquées sur mesure : logo, dimensions, couleurs et éclairage." },
    ],
  },
  {
    title: "Mobilier & Décorations",
    icon: "🛋️",
    items: [
      { q: "La table lumineuse est-elle personnalisable ?", a: "Oui, dimensions, forme et finitions sont sur mesure. Envoyez-nous votre projet sur WhatsApp pour un devis." },
      { q: "Quel entretien pour une table lumineuse ?", a: "Un simple chiffon doux et sec suffit. Les LED intégrées ont une longue durée de vie." },
      { q: "Le mobilier lumineux convient-il à un usage professionnel ?", a: "Oui, nos tables lumineuses équipent aussi bien des salons, restaurants que des halls d'hôtels et d'entreprises." },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-2">
        Foire aux questions
      </h1>
      <p className="text-sm text-[var(--color-text-secondary)] mb-8">
        Tout ce que vous devez savoir sur nos produits et nos services
      </p>

      <div className="space-y-8">
        {faqSections.map((section) => (
          <div key={section.title}>
            <h2 className="font-display text-lg font-bold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
              <span>{section.icon}</span> {section.title}
            </h2>
            <div className="space-y-3">
              {section.items.map((faq, i) => (
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
        ))}
      </div>
    </div>
  );
}
