"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Users, Check, Minus, Plus, Clock, MapPin, Shield, Info, X, Rotate3d } from "lucide-react";
import { useFormatPrice } from "@/stores/currency";
import { GroupageShareSection } from "./GroupageShareSection";
import { computeDepositBalance } from "@/lib/groupage";
import { cn } from "@/lib/utils";
import type { RefObject } from "react";
import type { ProductParameter, GroupageInfo } from "@/types";

interface GroupageCardProps {
  productName: string;
  slug: string;
  originalPrice: number;
  groupPrice: number;
  reductionPercent: number;
  reductionFcfa: number;
  placesTaken: number;
  maxPlaces: number;
  remaining: number;
  /** Montant de départ (acompte). null = paiement total. */
  depositFcfa: number | null;
  /** Jours restants avant complétion automatique (bloc réassurance « Délai max »). */
  maxDelayDays: number;
  /** Durée de vie max configurée (jours) — affichage mobile « ~ X jrs ». */
  maxDurationDays: number;
  /** Contenu de la modale d'infos groupage (global). */
  info: GroupageInfo;
  parameters: ProductParameter[];
  includedOptionIds: string[];
  hiddenOptionIds: string[];
  allowAdditionalOptions: boolean;
  selectedOptions: Record<string, string[]>;
  onToggleOption: (param: ProductParameter, optionId: string) => void;
  /** Nombre de places choisies par le client. */
  quantity: number;
  onQuantityChange: (q: number) => void;
  sharesCount: number;
  onShared: () => void;
  onJoin: () => void;
  /** Clic sur « cette pépite ✨ » : scroll vers la vue 360° (ou les photos). */
  onPepiteClick?: () => void;
  /** Ref sur le groupe « quantité + rejoindre + réassurance » (pour la barre sticky). */
  joinGroupRef?: RefObject<HTMLDivElement | null>;
}

/**
 * Grande carte groupage (expanded) : prix de base réduit + options + jauge + partage
 * marketing + quantité + « Rejoindre le groupage » + bloc réassurance en bas.
 */
export function GroupageCard({
  productName,
  slug,
  originalPrice,
  groupPrice,
  reductionPercent,
  reductionFcfa,
  placesTaken,
  maxPlaces,
  remaining,
  depositFcfa,
  maxDelayDays,
  maxDurationDays,
  info,
  parameters,
  includedOptionIds,
  hiddenOptionIds,
  allowAdditionalOptions,
  selectedOptions,
  onToggleOption,
  quantity,
  onQuantityChange,
  sharesCount,
  onShared,
  onJoin,
  onPepiteClick,
  joinGroupRef,
}: GroupageCardProps) {
  const formatPrice = useFormatPrice();
  const [infoOpen, setInfoOpen] = useState(false);
  const pct = Math.min(100, (placesTaken / maxPlaces) * 100);

  // « Cette pépite ✨ » : l'animation arc-en-ciel reste tant que le bouton n'a pas été
  // cliqué au moins une fois dans la session pour ce produit.
  const PEPITE_KEY = `showroom_pepite_clicked_${slug}`;
  const [pepiteClicked, setPepiteClicked] = useState<boolean>(() => {
    try {
      return typeof sessionStorage !== "undefined" && sessionStorage.getItem(PEPITE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const handlePepiteClick = () => {
    setPepiteClicked(true);
    try {
      sessionStorage.setItem(PEPITE_KEY, "1");
    } catch {
      /* ignore */
    }
    onPepiteClick?.();
  };

  const sectionStyles = [
    "border-[var(--color-accent-amber)] bg-[var(--color-accent-amber-soft)]",
    "border-[var(--color-accent-blue)] bg-[var(--color-info-soft)]",
    "border-[var(--color-success)] bg-[var(--color-success-soft)]",
    "border-[var(--color-error)] bg-[var(--color-error-soft)]",
  ];

  // Total unitaire = prix de base réduit + options ajoutées (plein tarif ; incluses = 0).
  const additionalTotal = parameters.reduce((sum, param) => {
    const ids = selectedOptions[param.id] || [];
    return (
      sum +
      ids.reduce((s, id) => {
        const opt = param.options.find((o) => o.id === id);
        if (!opt || includedOptionIds.includes(id)) return s;
        return s + (opt.price ?? 0);
      }, 0)
    );
  }, 0);
  // Valeur catalogue des options incluses gratuitement (comptée dans le prix barré + l'économie).
  const includedTotal = parameters.reduce((sum, param) => {
    return (
      sum +
      param.options
        .filter((o) => includedOptionIds.includes(o.id))
        .reduce((s, o) => s + (o.price ?? 0), 0)
    );
  }, 0);
  const total = groupPrice + additionalTotal;
  // Prix barré « normal » : variante + toutes les options (incluses + ajoutées).
  const originalTotal = originalPrice + includedTotal + additionalTotal;
  const { deposit, balance } = computeDepositBalance(total, depositFcfa);
  const lineTotal = total * quantity;

  // Options affichées : masquées exclues ; les supplémentaires ne sont listées que si autorisées.
  const visibleOptions = parameters
    .flatMap((param) => param.options.map((opt) => ({ param, opt })))
    .filter(({ opt }) => !hiddenOptionIds.includes(opt.id))
    .filter(({ opt }) => includedOptionIds.includes(opt.id) || allowAdditionalOptions);

  return (
    <>
    <div className="overflow-hidden rounded-2xl border-2 border-[var(--color-accent-amber)] bg-[var(--color-cream)]">
      <div className="p-4">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setInfoOpen(true)}
              aria-label="En savoir plus sur le groupage"
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent-amber)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-primary)]"
            >
              <Users className="h-3.5 w-3.5" /> Groupage
            </button>
            <motion.button
              type="button"
              onClick={() => setInfoOpen(true)}
              aria-label="En savoir plus sur le groupage"
              initial={{ opacity: 0, scale: 0.6, y: -6 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, amount: 0.8 }}
              transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.25 }}
              className="inline-flex h-6 items-center gap-1.5 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-card)] px-2.5 text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
            >
              <Info className="h-3.5 w-3.5" />
              <span className="text-[11px] font-semibold leading-none">Plus d&apos;infos</span>
            </motion.button>
          </div>
          {reductionPercent > 0 && (
            <span className="text-sm font-bold text-[var(--color-success)]">−{reductionPercent}%</span>
          )}
        </div>

        {/* Prix de base */}
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-[var(--color-text-tertiary)] line-through">
              {formatPrice(originalTotal)}
            </span>
            <span className="font-mono text-2xl font-bold text-[var(--color-text-primary)]">
              {formatPrice(total)}
            </span>
          </div>
          {additionalTotal > 0 && (
            <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
              dont options : +{formatPrice(additionalTotal)}
            </p>
          )}
          {reductionFcfa + includedTotal > 0 && (
            <p className="mt-0.5 text-xs font-semibold text-[var(--color-success)]">
              Économisez {formatPrice(reductionFcfa + includedTotal)}
            </p>
          )}
        </div>

        {/* Bouton « Voir le produit en 360° » (au-dessus des options) */}
        <div className="mt-3">
          <button
            type="button"
            onClick={handlePepiteClick}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors",
              pepiteClicked
                ? "bg-[var(--color-accent-amber-soft)] text-[var(--color-accent-amber)]"
                : "pepite-rainbow"
            )}
          >
            <Rotate3d className="h-4 w-4" />
            Voir le produit en 360°
          </button>
        </div>

        {/* Options : incluses (0 FCFA, « Inclus ») + ajoutables (plein tarif) */}
        {visibleOptions.length > 0 && (
          <div className="mt-3 border-t border-[var(--color-border-default)] pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
              Options
            </p>
            <div className="mt-2 space-y-1.5">
              {visibleOptions.map(({ param, opt }) => {
                  const isIncluded = includedOptionIds.includes(opt.id);
                  const isSelected = isIncluded || selectedOptions[param.id]?.includes(opt.id);
                  if (isIncluded) {
                    return (
                      <div
                        key={opt.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-3 py-2"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <Check className="h-3.5 w-3.5 shrink-0 text-[var(--color-accent-amber)]" />
                          <span className="text-xs leading-snug text-[var(--color-text-secondary)]">
                            {opt.label}
                          </span>
                        </span>
                        <span className="shrink-0 text-[10px] font-semibold text-[var(--color-success)]">
                          Inclus
                        </span>
                      </div>
                    );
                  }
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onToggleOption(param, opt.id)}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition-all",
                        isSelected
                          ? "border-[var(--color-text-primary)] bg-[var(--color-bg-tertiary)]"
                          : "border-[var(--color-border-default)] bg-[var(--color-surface-card)] hover:bg-[var(--color-bg-tertiary)]"
                      )}
                    >
                      <span className="min-w-0 text-xs leading-snug text-[var(--color-text-primary)]">
                        {opt.label}
                      </span>
                      {opt.price != null && opt.price > 0 && (
                        <span className="shrink-0 text-[10px] font-semibold text-[var(--color-accent-amber)]">
                          +{formatPrice(opt.price)}
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {/* Jauge */}
        <div className="mt-3">
          <p className="mb-1.5 text-sm font-semibold leading-snug text-[var(--color-text-primary)]">
            Il nous manque{" "}
            <span className="font-bold text-[var(--color-accent-amber)]">{remaining}</span>{" "}
            commande{remaining > 1 ? "s" : ""} pour livrer le groupage
          </p>

          {/* Barre (fond multicolore + reflet va-et-vient) */}
          <div className="relative h-3.5 overflow-hidden rounded-full bg-[var(--color-border-strong)]">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                background: "linear-gradient(90deg, #FFA500, #F97316, #F59E0B, #22C55E, #0EA5E9)",
              }}
            />
            <span className="groupage-sheen absolute inset-y-0 left-0 w-1/4 rounded-full bg-white/50 blur-[3px]" />
          </div>

          {/* Graduation : 0 — places prises — total */}
          <div className="relative mt-2 h-5 text-[10px] leading-none">
            <div className="absolute inset-x-0 top-0 flex justify-between">
              {[0, 25, 50, 75, 100].map((t) => (
                <span key={t} className="h-1.5 w-px bg-[var(--color-border-strong)]" />
              ))}
            </div>
            <span className="absolute left-0 top-2 font-medium text-[var(--color-text-tertiary)]">0</span>
            <span
              className="absolute top-2 -translate-x-1/2 font-bold text-[var(--color-accent-amber)]"
              style={{ left: `${pct}%` }}
            >
              {placesTaken}
            </span>
            <span className="absolute right-0 top-2 font-medium text-[var(--color-text-tertiary)]">{maxPlaces}</span>
          </div>
        </div>

        {/* Paiement : montant de départ / solde (sans mention « paiement total » si pas d'acompte) */}
        {depositFcfa != null && (
          <p className="mt-2 text-[11px] leading-relaxed text-[var(--color-text-secondary)]">
            <span className="font-semibold text-[var(--color-text-primary)]">{formatPrice(deposit)}</span> maintenant ·{" "}
            <span className="font-semibold text-[var(--color-text-primary)]">{formatPrice(balance)}</span> à la livraison
          </p>
        )}

        {/* Partage (CTA marketing) */}
        <div className="mt-3">
          <GroupageShareSection
            productName={productName}
            slug={slug}
            groupPriceFcfa={groupPrice}
            reductionFcfa={reductionFcfa}
            sharesCount={sharesCount}
            onShared={onShared}
          />
        </div>

        {/* Groupe « Rejoindre le groupage » : quantité + bouton + réassurance (contour + ombre) */}
        <div
          ref={joinGroupRef}
          className="mt-4 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-3 shadow-md"
        >
          {/* Quantité */}
          <div className="flex items-center justify-between rounded-full border border-[var(--color-border-strong)] pl-4 pr-1 py-1">
            <span className="text-sm font-medium text-[var(--color-text-primary)]">Quantité</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                aria-label="Diminuer la quantité"
                className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-tertiary)] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-[1.5rem] text-center text-base font-semibold text-[var(--color-text-primary)]">{quantity}</span>
              <button
                type="button"
                onClick={() => onQuantityChange(quantity + 1)}
                aria-label="Augmenter la quantité"
                className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-tertiary)]"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Bouton rejoindre */}
          <motion.button
            type="button"
            onClick={onJoin}
            initial={{ scale: 1 }}
            whileInView={{ scale: [1, 1.06, 1, 1.04, 1] }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.9, ease: "easeInOut", delay: 0.15 }}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-success)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#15803D]"
          >
            <Users className="h-4 w-4" />
            Rejoindre le groupage
            <span className="text-[7px] font-bold leading-none" aria-hidden="true">•</span>
            <span className="font-mono font-bold">{formatPrice(lineTotal)}</span>
          </motion.button>

          {/* Réassurance */}
          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[var(--color-border-default)] pt-3">
            <div className="flex items-center gap-2 min-w-0">
              <Clock className="h-4 w-4 shrink-0 text-[var(--color-accent-amber)]" />
              <div className="min-w-0">
                <p className="truncate text-[10px] leading-none text-[var(--color-text-tertiary)]">Délai max</p>
                <p className="truncate text-[12px] font-medium leading-tight text-[var(--color-text-primary)]">
                  <span className="sm:hidden">~ {maxDurationDays} jrs</span>
                  <span className="hidden sm:inline">moins de {maxDelayDays} jour{maxDelayDays > 1 ? "s" : ""}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="h-4 w-4 shrink-0 text-[var(--color-accent-amber)]" />
              <div className="min-w-0">
                <p className="truncate text-[10px] leading-none text-[var(--color-text-tertiary)]">Fabrication</p>
                <p className="truncate text-[12px] font-medium leading-tight text-[var(--color-text-primary)]">local</p>
              </div>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <Shield className="h-4 w-4 shrink-0 text-[var(--color-accent-amber)]" />
              <div className="min-w-0">
                <p className="truncate text-[10px] leading-none text-[var(--color-text-tertiary)]">Garantie</p>
                <p className="truncate text-[12px] font-medium leading-tight text-[var(--color-text-primary)]">2 ans</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Modale « Comment fonctionne le groupage ? » */}
      <AnimatePresence>
        {infoOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] bg-black/40"
              onClick={() => setInfoOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              className="fixed inset-x-0 bottom-0 z-[71] max-h-[75vh] overflow-y-auto rounded-t-2xl bg-[var(--color-surface-card)] px-5 pt-4 pb-6"
            >
              <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-[var(--color-border-strong)]" />
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-lg font-semibold text-[var(--color-text-primary)]">
                  {info.title}
                </h3>
                <button
                  type="button"
                  onClick={() => setInfoOpen(false)}
                  aria-label="Fermer"
                  className="h-9 w-9 rounded-full flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-3 text-sm">
                {info.sections.map((s, i) => (
                  <div
                    key={i}
                    className={`rounded-xl border-l-4 ${sectionStyles[i % sectionStyles.length]} p-3`}
                  >
                    <p className="font-semibold text-[var(--color-text-primary)]">{s.title}</p>
                    <p className="text-[var(--color-text-secondary)]">{s.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
