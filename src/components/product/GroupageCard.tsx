"use client";
import { Users, Check, Minus, Plus, Clock, MapPin, Shield } from "lucide-react";
import { useFormatPrice } from "@/stores/currency";
import { GroupageShareSection } from "./GroupageShareSection";
import { computeDepositBalance } from "@/lib/groupage";
import { cn } from "@/lib/utils";
import type { RefObject } from "react";
import type { ProductParameter } from "@/types";

interface GroupageCardProps {
  productName: string;
  slug: string;
  variantName: string | null;
  originalPrice: number;
  groupPrice: number;
  reductionPercent: number;
  reductionFcfa: number;
  placesTaken: number;
  maxPlaces: number;
  remaining: number;
  /** Montant de départ (acompte). null = paiement total. */
  depositFcfa: number | null;
  /** Délai de livraison (bloc réassurance). */
  deliveryTime: string | null;
  parameters: ProductParameter[];
  includedOptionIds: string[];
  selectedOptions: Record<string, string[]>;
  onToggleOption: (param: ProductParameter, optionId: string) => void;
  /** Nombre de places choisies par le client. */
  quantity: number;
  onQuantityChange: (q: number) => void;
  sharesCount: number;
  onShared: () => void;
  onJoin: () => void;
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
  variantName,
  originalPrice,
  groupPrice,
  reductionPercent,
  reductionFcfa,
  placesTaken,
  maxPlaces,
  remaining,
  depositFcfa,
  deliveryTime,
  parameters,
  includedOptionIds,
  selectedOptions,
  onToggleOption,
  quantity,
  onQuantityChange,
  sharesCount,
  onShared,
  onJoin,
  joinGroupRef,
}: GroupageCardProps) {
  const formatPrice = useFormatPrice();
  const pct = Math.min(100, (placesTaken / maxPlaces) * 100);

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
  const total = groupPrice + additionalTotal;
  const { deposit, balance } = computeDepositBalance(total, depositFcfa);
  const lineTotal = total * quantity;

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-[var(--color-accent-amber)] bg-[var(--color-cream)]">
      <div className="p-4">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent-amber)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-primary)]">
            <Users className="h-3.5 w-3.5" /> Groupage
          </span>
          {reductionPercent > 0 && (
            <span className="text-sm font-bold text-[var(--color-success)]">−{reductionPercent}%</span>
          )}
        </div>

        {/* Prix de base */}
        <div className="mt-3">
          {variantName && <p className="text-xs text-[var(--color-text-secondary)]">{variantName}</p>}
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-[var(--color-text-tertiary)] line-through">
              {formatPrice(originalPrice)}
            </span>
            <span className="font-mono text-2xl font-bold text-[var(--color-text-primary)]">
              {formatPrice(groupPrice)}
            </span>
          </div>
          {reductionFcfa > 0 && (
            <p className="mt-0.5 text-xs font-semibold text-[var(--color-success)]">
              Économisez {formatPrice(reductionFcfa)}
            </p>
          )}
        </div>

        {/* Options : incluses (0 FCFA, « Inclus ») + ajoutables (plein tarif) */}
        {parameters.length > 0 && (
          <div className="mt-3 border-t border-[var(--color-border-default)] pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
              Options
            </p>
            <div className="mt-2 space-y-1.5">
              {parameters
                .flatMap((param) => param.options.map((opt) => ({ param, opt })))
                .map(({ param, opt }) => {
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

        {/* Total unitaire */}
        <div className="mt-3 flex items-center justify-between border-t border-[var(--color-border-default)] pt-2.5">
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">Total</span>
          <span className="font-mono text-lg font-bold text-[var(--color-text-primary)]">{formatPrice(total)}</span>
        </div>

        {/* Jauge */}
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-[var(--color-text-secondary)]">{placesTaken} / {maxPlaces} places</span>
            <span className="font-semibold text-[var(--color-accent-amber)]">{remaining} restantes</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--color-border-strong)]">
            <div
              className="h-full rounded-full bg-[var(--color-accent-amber)] transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Paiement : montant de départ / solde (sans mention « paiement total » si pas d'acompte) */}
        <p className="mt-2 text-[11px] leading-relaxed text-[var(--color-text-secondary)]">
          {depositFcfa != null && (
            <>
              <span className="font-semibold text-[var(--color-text-primary)]">{formatPrice(deposit)}</span> maintenant ·{" "}
              <span className="font-semibold text-[var(--color-text-primary)]">{formatPrice(balance)}</span> à la livraison ·{" "}
            </>
          )}
          livré une fois le groupage complet
        </p>

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
          <button
            type="button"
            onClick={onJoin}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-success)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#15803D]"
          >
            <Users className="h-4 w-4" />
            Rejoindre le groupage
            <span className="text-[7px] font-bold leading-none" aria-hidden="true">•</span>
            <span className="font-mono font-bold">{formatPrice(lineTotal)}</span>
          </button>

          {/* Réassurance */}
          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[var(--color-border-default)] pt-3">
            {deliveryTime && (
              <div className="flex items-center gap-2 min-w-0">
                <Clock className="h-4 w-4 shrink-0 text-[var(--color-accent-amber)]" />
                <div className="min-w-0">
                  <p className="truncate text-[10px] leading-none text-[var(--color-text-tertiary)]">Délai</p>
                  <p className="truncate text-[12px] font-medium leading-tight text-[var(--color-text-primary)]">{deliveryTime}</p>
                </div>
              </div>
            )}
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
  );
}
