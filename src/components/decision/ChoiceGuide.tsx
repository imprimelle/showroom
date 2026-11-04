"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  RotateCcw,
  Check,
  MapPin,
  Home,
  Layers,
  Sparkles,
  Sofa,
  PiggyBank,
  Coins,
  Gem,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { EditableText } from "@/components/admin/content/EditableText";
import { getMinPrice, cn } from "@/lib/utils";
import { resolveFamily } from "@/lib/categories";
import type { ShowcaseProduct } from "@/lib/products";

type Placement = "exterieur" | "interieur" | "les-deux";
type Universe = "enseigne" | "mobilier";

interface Option {
  id: string;
  label: string;
  hint: string;
  Icon: LucideIcon;
}

const PLACEMENTS: Option[] = [
  { id: "exterieur", label: "Extérieur", hint: "Vitrine, façade", Icon: MapPin },
  { id: "interieur", label: "Intérieur", hint: "Boutique, salon", Icon: Home },
  { id: "les-deux", label: "Les deux", hint: "Je ne sais pas", Icon: Layers },
];

const UNIVERSES: Option[] = [
  { id: "enseigne", label: "Enseignes & Signalétique", hint: "Être vu et identifié", Icon: Sparkles },
  { id: "mobilier", label: "Mobilier & Décorations", hint: "Embellir un espace", Icon: Sofa },
];

const BUDGETS: Option[] = [
  { id: "eco", label: "Économique", hint: "moins de 150 000 F", Icon: PiggyBank },
  { id: "standard", label: "Standard", hint: "150 000 – 350 000 F", Icon: Coins },
  { id: "premium", label: "Premium", hint: "plus de 350 000 F", Icon: Gem },
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
    cn(
      "flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl border-2 text-left transition-all duration-150",
      active
        ? "border-[var(--color-text-primary)] bg-[var(--color-text-primary)] text-white shadow-md"
        : "border-[var(--color-border-default)] bg-[var(--color-surface-card)] hover:border-[var(--color-text-primary)] hover:shadow-sm"
    );

  const questionTitles = [
    "Où sera installé votre produit ?",
    "Que recherchez-vous ?",
    "Quel est votre budget ?",
  ];

  const renderOption = (opt: Option, active: boolean, onClick: () => void) => (
    <button key={opt.id} type="button" onClick={onClick} className={optionClass(active)}>
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
          active
            ? "bg-white/15 text-white"
            : "bg-[var(--color-accent-amber-soft)] text-[var(--color-accent-amber)]"
        )}
      >
        <opt.Icon className="h-5 w-5" />
      </span>
      <span className="flex min-w-0 flex-col items-start">
        <span className={cn("font-semibold", active ? "text-white" : "text-[var(--color-text-primary)]")}>
          {opt.label}
        </span>
        <span className={cn("text-xs", active ? "text-white/75" : "text-[var(--color-text-tertiary)]")}>
          {opt.hint}
        </span>
      </span>
      {active && <Check className="ml-auto h-5 w-5 shrink-0 text-white" />}
    </button>
  );

  return (
    <section className="bg-[var(--color-bg-secondary)] border-y border-[var(--color-border-default)] py-12 md:py-16">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <SectionHeader
          eyebrow="Conseil personnalisé"
          title="Besoin d&apos;un conseil ?"
          subtitle="3 questions, des produits sur mesure"
          eyebrowKey="home.guide.eyebrow"
          titleKey="home.guide.title"
          subtitleKey="home.guide.subtitle"
        />

        {/* Progress */}
        {!isResult && (
          <div className="mb-8">
            <p className="text-center text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
              Question {step + 1} / {totalSteps}
            </p>
            <div className="mt-2 flex gap-1.5">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-all duration-300",
                    i === step
                      ? "bg-[var(--color-text-primary)]"
                      : i < step
                        ? "bg-[var(--color-accent-amber)]"
                        : "bg-[var(--color-border-strong)]"
                  )}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 1 — Emplacement */}
        {step === 0 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] text-center">
              <EditableText contentKey="home.guide.q1" defaultValue={questionTitles[0]} />
            </h3>
            <div className="space-y-2.5">
              {PLACEMENTS.map((p) =>
                renderOption(p, placement === p.id, () => {
                  setPlacement(p.id as Placement);
                  setStep(1);
                })
              )}
            </div>
          </div>
        )}

        {/* Step 2 — Univers */}
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] text-center">
              <EditableText contentKey="home.guide.q2" defaultValue={questionTitles[1]} />
            </h3>
            <div className="space-y-2.5">
              {UNIVERSES.map((u) =>
                renderOption(u, universe === u.id, () => {
                  setUniverse(u.id as Universe);
                  setStep(2);
                })
              )}
            </div>
            <button
              onClick={() => setStep(0)}
              className="w-full text-center text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <EditableText contentKey="home.guide.back" defaultValue="← Revenir" />
            </button>
          </div>
        )}

        {/* Step 3 — Budget */}
        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] text-center">
              <EditableText contentKey="home.guide.q3" defaultValue={questionTitles[2]} />
            </h3>
            <div className="space-y-2.5">
              {BUDGETS.map((b) =>
                renderOption(b, budget === b.id, () => {
                  setBudget(b.id as "eco" | "standard" | "premium");
                  setStep(3);
                })
              )}
            </div>
            <button
              onClick={() => setStep(1)}
              className="w-full text-center text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <EditableText contentKey="home.guide.back" defaultValue="← Revenir" />
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
                {matches.length > 0 ? (
                  <EditableText contentKey="home.guide.result_found" defaultValue="Sélectionnés selon vos réponses" />
                ) : (
                  <EditableText contentKey="home.guide.result_empty" defaultValue="Nous fabriquons aussi sur mesure." />
                )}
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
                <EditableText contentKey="home.guide.cta" defaultValue="Voir toute la sélection" /> <ArrowRight className="w-4 h-4" />
              </Link>
              <button onClick={reset} className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-strong)] px-6 py-3 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors">
                <RotateCcw className="w-4 h-4" /> <EditableText contentKey="home.guide.reset" defaultValue="Recommencer" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
