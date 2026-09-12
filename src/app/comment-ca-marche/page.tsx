const steps = [
  { num: "1", title: "Choisissez votre enseigne", desc: "Parcourez notre catalogue de caissons, lettres 3D, totems et néons. Sélectionnez la taille et les options qui vous conviennent." },
  { num: "2", title: "Passez commande en 2 minutes", desc: "Remplissez simplement votre nom, téléphone, ville et adresse. Pas de compte à créer, pas de paiement en ligne." },
  { num: "3", title: "Nous vous appelons", desc: "Notre équipe vous contacte sous 24h pour confirmer les détails, le délai et répondre à vos questions." },
  { num: "4", title: "Fabrication et livraison", desc: "Votre enseigne est fabriquée en 7-10 jours dans notre atelier à Abidjan, puis livrée et installée." },
];

export default function CommentCaMarchePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-2">Comment ça marche</h1>
      <p className="text-sm text-[var(--color-text-secondary)] mb-8">Commandez votre enseigne lumineuse en 4 étapes simples</p>
      <div className="relative">
        {steps.map((step, i) => (
          <div key={i} className="flex gap-4 mb-8">
            <div className="w-10 h-10 rounded-full bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] flex items-center justify-center text-lg font-bold font-display shrink-0">
              {step.num}
            </div>
            <div>
              <h3 className="font-semibold text-[var(--color-text-primary)]">{step.title}</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
