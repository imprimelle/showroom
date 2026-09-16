"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { getMinPrice } from "@/lib/utils";
import { resolveFamily } from "@/lib/categories";
import type { ShowcaseProduct } from "@/lib/products";

type Placement = "exterieur" | "interieur" | "les-deux";
type Universe = "enseigne" | "mobilier";

const PLACEMENTS: { id: Placement; label: string; hint: string }[] = [
  { id: "exterieur", label: "Extérieur", hint: "Vitrine, façade, devanture" },
  { id: "interieur", label: "Intérieur", hint: "Boutique, salon, bureau" },
  { id: "les-deux", label: "Les deux", hint: "Je ne sais pas encore" },
];

const UNIVERSES: { id: Universe; label: string; hint: string }[] = [
  { id: "enseigne", label: "Enseignes & Signalétique", hint: "Être vu et identifié" },
  { id: "mobilier", label: "Mobilier & Décorations", hint: "Embellir un espace" },
];

const BUDGETS: { id: "eco" | "standard" | "premium"; label: string; hint: string }[] = [
  { id: "eco", label: "Économique", hint: "moins de 150 000 F" },
  { id: "standard", label: "Standard", hint: "150 000 à 350 000 F" },
  { id: "premium", label: "Premium", hint: "plus de 350 000 F" },
];

const budgetBucket = (price: number | null): "eco" | "standard" | "premium" => {
  if (price == null) return "premium"; // "sur devis" → haut de gamme
  if (price < 150000) return "eco";
  if (price <= 350000) return "standard";
  return "premium";
};

interface ChoiceGuideProps {
  products: ShowcaseProduct[];
}

export function ChoiceGuide({ products }: ChoiceGuideProps) {
  const [step, setStep] = useState(0);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [universe, setUniverse] = useState<Universe | null>(null);
  const [budget, setBudget] = useState<"eco" | "standard" | "premium" | null>(null);

  const totalSteps = 3;
  const isResult = step === totalSteps;

  const reset = () => {
    setStep(0);
    setPlacement(null);
    setUniverse(null);
    setBudget(null);
  };

  // Filtrage de la recommandation
  const familyId = universe === "enseigne" ? "enseignes-signaletique" : universe === "mobilier" ? "mobilier-decorations" : undefined;

  const matches = !isResult
    ? []
    : products.filter((p) => {
        const fam = resolveFamily(p.showcase?.family, p.showcase?.category);
        if (familyId && fam !== familyId) return false;
        if (placement === "exterieur" && p.showcase?.usage !== "extérieur") return false;
        if (placement === "interieur" && p.showcase?.usage !== "intérieur") return false;
        if (budget && budgetBucket(getMinPrice(p.variants)) !== budget) return false;
        return true;
      });

  const recommended = [...matches]
    .sort((a, b) => (b.showcase?.popularity || 0) - (a.showcase?.popularity || 0))
    .slice(0, 3);

  const ctaParams = new URLSearchParams();
  if (familyId) ctaParams.set("family", familyId);
  if (placement && placement !== "les-deux") ctaParams.set("usage", placement);
  const ctaHref = `/collection${ctaParams.toString() ? `?${ctaParams.toString()}` : ""}`;

  const optionClass = (active: boolean) =>
    `flex flex-col items-start gap-0.5 w-full px-4 py-3 rounded-2xl border text-left transition-colors ${
      active
        ? "border-[var(--color-text-primary)] bg-[var(--color-bg-tertiary)]"
        : "border-[var(--color-border-default)] bg-[var(--color-surface-card)] hover:border-[var(--color-border-strong)]"
    }`;

  const questionTitles = [
    "Où sera installé votre produit ?",
    "Que recherchez-vous ?",
    "Quel est votre budget ?",
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 py-16 md:py-24">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
            Besoin d&apos;un conseil ?
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] mt-2">
            Répondez à 3 questions pour trouver le produit qu&apos;il vous faut
          </p>
        </div>

        {/* Progress */}
        {!isResult && (
          <div className="flex gap-1.5 justify-center mb-8">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? "w-8 bg-[var(--color-text-primary)]" : i < step ? "w-3 bg-[var(--color-text-primary)]/60" : "w-3 bg-[var(--color-border-default)]"
                }`}
              />
            ))}
          </div>
        )}

        {/* Step 1 — Emplacement */}
        {step === 0 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] text-center">{questionTitles[0]}</h3>
            <div className="space-y-2.5">
              {PLACEMENTS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setPlacement(p.id);
                    setStep(1);
                  }}
                  className={optionClass(placement === p.id)}
                >
                  <span className="font-medium text-[var(--color-text-primary)]">{p.label}</span>
                  <span className="text-xs text-[var(--color-text-tertiary)]">{p.hint}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 — Univers */}
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] text-center">{questionTitles[1]}</h3>
            <div className="space-y-2.5">
              {UNIVERSES.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    setUniverse(u.id);
                    setStep(2);
                  }}
                  className={optionClass(universe === u.id)}
                >
                  <span className="font-medium text-[var(--color-text-primary)]">{u.label}</span>
                  <span className="text-xs text-[var(--color-text-tertiary)]">{u.hint}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(0)} className="w-full text-center text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors">
              ← Revenir
            </button>
          </div>
        )}

        {/* Step 3 — Budget */}
        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] text-center">{questionTitles[2]}</h3>
            <div className="space-y-2.5">
              {BUDGETS.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setBudget(b.id);
                    setStep(3);
                  }}
                  className={optionClass(budget === b.id)}
                >
                  <span className="font-medium text-[var(--color-text-primary)]">{b.label}</span>
                  <span className="text-xs text-[var(--color-text-tertiary)]">{b.hint}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(1)} className="w-full text-center text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors">
              ← Revenir
            </button>
          </div>
        )}

        {/* Result */}
        {isResult && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                {matches.length > 0 ? `Voici ${matches.length} produit${matches.length > 1 ? "s" : ""} pour vous` : "Aucun résultat exact"}
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                {matches.length > 0 ? "Sélectionnés selon vos réponses" : "Essayez d'élargir vos critères — nous fabriquons aussi sur mesure."}
              </p>
            </div>

            {recommended.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8">
                {recommended.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link href={ctaHref} className="inline-flex items-center gap-2 rounded-full bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] font-semibold px-8 py-3 text-base hover:bg-[#2A2A2A] transition-colors">
                Voir toute la sélection <ArrowRight className="w-4 h-4" />
              </Link>
              <button onClick={reset} className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-strong)] px-6 py-3 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors">
                <RotateCcw className="w-4 h-4" /> Recommencer
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
