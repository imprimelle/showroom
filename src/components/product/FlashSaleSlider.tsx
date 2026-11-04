import Link from "next/link";
import { Zap, ArrowRight } from "lucide-react";
import { FlashCountdown } from "./FlashCountdown";
import { ProductSlider } from "./ProductSlider";
import type { ShowcaseProduct } from "@/lib/products";

interface FlashSaleSliderProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonHref?: string;
  endTime?: string;
  /** Produits à afficher dans le slide (configurés dans l'admin). */
  products?: ShowcaseProduct[];
}

/**
 * Slide « Vente flash » de la page d'accueil : fond rouge, titre + minuteur
 * quotidien + bouton vers la page des ventes flash, suivi d'un slider de
 * produits. Même langage visuel que les slides « Tops », mais en rouge.
 */
export function FlashSaleSlider({
  title = "Vente flash | chaque jour",
  subtitle,
  buttonText = "Voir les ventes flash",
  buttonHref = "/ventes-flash",
  endTime = "23:59",
  products = [],
}: FlashSaleSliderProps) {
  return (
    <div className="rounded-lg bg-[#DC2626] px-4 py-4 md:px-6 md:py-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 shrink-0 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </span>
          <div className="min-w-0">
            <h3 className="font-display text-base md:text-lg font-bold text-white leading-tight">
              {title}
            </h3>
            {subtitle ? (
              <p className="text-white/85 text-xs mt-0.5">{subtitle}</p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-white/90 text-xs font-semibold uppercase tracking-wide">
              Fin dans
            </span>
            <FlashCountdown
              endTime={endTime}
              className="inline-flex items-center rounded-md bg-black/25 px-2.5 py-1 font-mono text-sm font-bold text-white tabular-nums"
            />
          </div>
          <Link
            href={buttonHref}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#DC2626] hover:bg-red-50 transition-colors"
          >
            {buttonText}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {products.length > 0 && (
        <div className="mt-3 md:mt-4">
          <ProductSlider products={products} autoPlay={false} />
        </div>
      )}
    </div>
  );
}
