import Link from "next/link";
import { Zap, ArrowRight } from "lucide-react";
import { FlashTimerGauge } from "./FlashTimerGauge";
import { ProductSlider } from "./ProductSlider";
import type { ShowcaseProduct } from "@/lib/products";

interface FlashSaleSliderProps {
  title?: string;
  buttonHref?: string;
  endTime?: string;
  /** Produits à afficher dans le slide (configurés dans l'admin). */
  products?: ShowcaseProduct[];
}

/**
 * Slide « Vente flash » de la page d'accueil : fond rouge, titre en majuscules
 * + jauge de temps (style groupage) + bouton flèche, le tout sur une ligne,
 * suivi d'un slider de produits. Même langage visuel que les slides « Tops ».
 */
export function FlashSaleSlider({
  title = "VENTE FLASH",
  buttonHref = "/ventes-flash",
  endTime = "23:59",
  products = [],
}: FlashSaleSliderProps) {
  return (
    <div className="rounded-lg bg-[#be1d3e] px-4 py-3.5 md:px-6 md:py-4">
      <div className="flex items-center gap-3">
        <span className="w-9 h-9 shrink-0 rounded-lg bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </span>
        <h3 className="shrink-0 font-display text-base md:text-lg font-bold uppercase tracking-wide text-white whitespace-nowrap">
          {title}
        </h3>
        <FlashTimerGauge endTime={endTime} className="flex-1 min-w-0" />
        <Link
          href={buttonHref}
          aria-label="Voir les ventes flash"
          className="shrink-0 w-9 h-9 rounded-full bg-white text-[#be1d3e] flex items-center justify-center hover:bg-red-50 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {products.length > 0 && (
        <div className="mt-3 md:mt-4">
          <ProductSlider products={products} autoPlay={false} />
        </div>
      )}
    </div>
  );
}
