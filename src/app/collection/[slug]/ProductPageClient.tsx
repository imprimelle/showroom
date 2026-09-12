"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Truck, Shield, ChevronLeft, ChevronRight } from "lucide-react";
import { VariantSelector } from "@/components/product/VariantSelector";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { useCartStore } from "@/stores/cart";
import { imgProxyUrl } from "@/lib/images";
import { formatFCFA, cn, getWhatsAppUrl, DEFAULT_WHATSAPP } from "@/lib/utils";
import { getCategoryLabel } from "@/lib/categories";
import type { ShowcaseProduct } from "@/lib/products";

interface ProductPageClientProps {
  product: ShowcaseProduct;
  relatedProducts: ShowcaseProduct[];
  whatsapp?: string;
}

export function ProductPageClient({ product, relatedProducts, whatsapp = DEFAULT_WHATSAPP }: ProductPageClientProps) {
  const [selectedSku, setSelectedSku] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const addItem = useCartStore((s) => s.addItem);

  const selectedVariant = product.variants?.find((v) => v.sku === selectedSku) || null;
  const currentPrice = selectedVariant?.price;
  const showWhatsAppMsg = selectedVariant
    ? `Bonjour, je suis intéressé par le ${product.name} - ${selectedVariant.name} (${formatFCFA(selectedVariant.price)})`
    : `Bonjour, je suis intéressé par le ${product.name}`;

  const images: { url: string; alt: string }[] = product.main_image_url
    ? [{ url: product.main_image_url, alt: product.name }, ...(product.gallery_images || [])]
    : [];

  const scrollToImage = (i: number) => {
    const c = carouselRef.current;
    if (!c) return;
    c.scrollTo({ left: i * c.clientWidth, behavior: "smooth" });
  };

  const handleScroll = () => {
    const c = carouselRef.current;
    if (!c) return;
    const idx = Math.round(c.scrollLeft / c.clientWidth);
    setActiveImage(idx);
  };

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    addItem({
      product_id: product.id,
      product_name: product.name,
      product_slug: product.slug,
      variant_label: selectedVariant.name,
      variant_sku: selectedVariant.sku,
      quantity: 1,
      unit_price_fcfa: selectedVariant.price,
      image_url: product.main_image_url,
    });
    setCartOpen(true);
  };

  return (
    <div className="pb-24 md:pb-8">
      {/* Back button */}
      <div className="sticky top-0 z-30 bg-[var(--color-bg-primary)]/90 backdrop-blur-sm px-4 py-3 md:hidden">
        <Link href="/collection" className="inline-flex items-center gap-1 text-sm text-[var(--color-text-secondary)]">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>
      </div>

      {/* Image Carousel */}
      {images.length > 0 && (
        <div className="relative md:max-w-2xl md:mx-auto md:rounded-2xl md:overflow-hidden">
          <div
            ref={carouselRef}
            onScroll={handleScroll}
            className="carousel"
          >
            {images.map((img, i) => (
              <div key={i} className="w-full shrink-0 aspect-square md:aspect-[4/3] bg-[var(--color-bg-tertiary)]">
                <img
                  src={imgProxyUrl(img.url, 600)}
                  srcSet={`${imgProxyUrl(img.url, 400)} 400w, ${imgProxyUrl(img.url, 600)} 600w, ${imgProxyUrl(img.url, 900)} 900w`}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 75vw, 50vw"
                  alt={img.alt || product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>

          {/* Arrows — desktop */}
          {images.length > 1 && (
            <>
              <button
                onClick={() => scrollToImage(Math.max(0, activeImage - 1))}
                disabled={activeImage === 0}
                className="hidden md:flex absolute top-1/2 -translate-y-1/2 left-4 w-10 h-10 rounded-full bg-white/90 shadow-lg items-center justify-center text-[var(--color-text-primary)] hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all z-10"
                aria-label="Image précédente"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => scrollToImage(Math.min(images.length - 1, activeImage + 1))}
                disabled={activeImage >= images.length - 1}
                className="hidden md:flex absolute top-1/2 -translate-y-1/2 right-4 w-10 h-10 rounded-full bg-white/90 shadow-lg items-center justify-center text-[var(--color-text-primary)] hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all z-10"
                aria-label="Image suivante"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Dots indicator */}
      {images.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToImage(i)}
              aria-label={`Image ${i + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === activeImage ? "w-5 bg-[var(--color-text-primary)]" : "w-1.5 bg-[var(--color-border-strong)]"
              )}
            />
          ))}
        </div>
      )}

      {/* Product Info */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <nav className="text-xs text-[var(--color-text-tertiary)] flex items-center gap-1 flex-wrap">
          <Link href="/" className="hover:text-[var(--color-text-primary)]">Accueil</Link>
          <span>/</span>
          {product.showcase?.category ? (
            <>
              <Link href={`/collection/categorie/${product.showcase.category}`} className="hover:text-[var(--color-text-primary)]">
                {getCategoryLabel(product.showcase.category)}
              </Link>
              <span>/</span>
            </>
          ) : null}
          <span className="text-[var(--color-text-secondary)] line-clamp-1">{product.name}</span>
        </nav>

        {product.showcase?.category && (
          <Badge variant="category">{getCategoryLabel(product.showcase.category)}</Badge>
        )}

        <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">{product.name}</h1>

        {currentPrice ? (
          <div>
            <span className="text-xs text-[var(--color-text-tertiary)]">À partir de</span>
            <p className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] font-mono">
              {formatFCFA(currentPrice)}
            </p>
          </div>
        ) : (
          <p className="text-lg text-[var(--color-text-secondary)]">Sur devis</p>
        )}

        {/* Variant Selector */}
        {product.variants?.length > 0 && (
          <VariantSelector
            variants={product.variants.map((v) => ({ id: v.id, sku: v.sku, name: v.name, price: v.price }))}
            selectedSku={selectedSku}
            onSelect={(v) => setSelectedSku(v.sku)}
          />
        )}

        {/* Short Description */}
        {product.showcase?.short_description && (
          <p className="text-sm md:text-base text-[var(--color-text-secondary)] leading-relaxed">
            {product.showcase.short_description}
          </p>
        )}

        {/* Highlights */}
        {product.showcase?.highlights && product.showcase.highlights.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {product.showcase.highlights.map((h, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--color-bg-secondary)] text-sm text-[var(--color-text-secondary)]">
                <Check className="w-3.5 h-3.5 text-[var(--color-success)]" />
                {h}
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="flex flex-col gap-3 pt-4">
          {product.variants?.length > 0 ? (
            <Button variant="primary" size="lg" className="w-full" onClick={handleAddToCart} disabled={!selectedSku}>
              {selectedSku ? `Ajouter au panier — ${formatFCFA(currentPrice!)}` : "Sélectionnez une taille"}
            </Button>
          ) : (
            <a href={getWhatsAppUrl(whatsapp, showWhatsAppMsg)} target="_blank" rel="noopener noreferrer">
              <Button variant="whatsapp" size="lg" className="w-full">💬 Demander un devis WhatsApp</Button>
            </a>
          )}
          <a href={getWhatsAppUrl(whatsapp, showWhatsAppMsg)} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" size="lg" className="w-full">💬 Parler à un conseiller</Button>
          </a>
        </div>

        {/* Specs */}
        {product.showcase?.delivery_time && (
          <div className="flex flex-wrap gap-4 pt-4 border-t border-[var(--color-border-default)]">
            <div className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)]">
              <Truck className="w-4 h-4" />
              Délai : {product.showcase.delivery_time}
            </div>
            {product.showcase?.usage && (
              <div className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)]">
                <Shield className="w-4 h-4" />
                Usage : {product.showcase.usage}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mt-12 mb-8">
          <h2 className="font-display text-xl md:text-2xl font-bold text-[var(--color-text-primary)] mb-6">
            Vous aimerez aussi
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8">
            {relatedProducts.map((rp) => (
              <ProductCard key={rp.id} product={rp} />
            ))}
          </div>
        </section>
      )}

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
