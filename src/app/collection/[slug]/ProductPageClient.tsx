"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Clock,
  Ruler,
  Shield,
  ChevronDown,
  Zap,
  Layers,
  Sparkles,
  Droplets,
  Palette,
  Truck,
  ShieldCheck,
  MapPin,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { VariantSelector } from "@/components/product/VariantSelector";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { useCartStore } from "@/stores/cart";
import { imgProxyUrl } from "@/lib/images";
import { formatFCFA, getWhatsAppUrl, DEFAULT_WHATSAPP } from "@/lib/utils";
import { getCategoryLabel, getFamilyLabel, resolveFamily } from "@/lib/categories";
import type { ShowcaseProduct } from "@/lib/products";

interface ProductPageClientProps {
  product: ShowcaseProduct;
  relatedProducts: ShowcaseProduct[];
  whatsapp?: string;
}

/** Traduit l'emplacement (usage) en libellé lisible. */
function usageLabel(u?: string): string | null {
  switch (u) {
    case "intérieur":
      return "Intérieur";
    case "extérieur":
      return "Extérieur";
    case "les deux":
      return "Intérieur & extérieur";
    default:
      return null;
  }
}

/** Associe une icône à un point fort (mots-clés → icône). */
function highlightIcon(text: string): LucideIcon {
  const t = text.toLowerCase();
  if (/(led|éclairage|lumineu|lumière|neon|retro)/.test(t)) return Zap;
  if (/(verre|aluminium|acier|bois|structure|materiau)/.test(t)) return Layers;
  if (/(garantie)/.test(t)) return Shield;
  if (/(etanche|ip|exterieur|intemper|resistan)/.test(t)) return Droplets;
  if (/(couleur|finition|design|moderne|epure|soigne)/.test(t)) return Palette;
  return Sparkles;
}

const reassurances = [
  { icon: Truck, label: "Livraison gratuite" },
  { icon: ShieldCheck, label: "Garantie 2 ans" },
  { icon: MapPin, label: "Fabrication locale" },
  { icon: Lock, label: "Paiement à la livraison" },
];

const productFaq = [
  {
    q: "Quels sont les délais de fabrication ?",
    a: "7 à 10 jours ouvrés selon le produit et la complexité de votre projet.",
  },
  {
    q: "Puis-je personnaliser ce produit ?",
    a: "Oui, tous nos produits sont fabriqués sur mesure : dimensions, couleurs, logo et finitions. Envoyez-nous votre projet sur WhatsApp pour un devis.",
  },
  {
    q: "La livraison et l'installation sont-elles incluses ?",
    a: "Nous livrons partout en Côte d'Ivoire et l'installation est incluse à Abidjan.",
  },
  {
    q: "Quelle garantie est offerte ?",
    a: "Tous nos produits sont garantis 2 ans, pièces et main d'œuvre.",
  },
];

export function ProductPageClient({ product, relatedProducts, whatsapp = DEFAULT_WHATSAPP }: ProductPageClientProps) {
  const [selectedSku, setSelectedSku] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const selectedVariant = product.variants?.find((v) => v.sku === selectedSku) || null;
  const currentPrice = selectedVariant?.price ?? null;
  const showWhatsAppMsg = selectedVariant
    ? selectedVariant.price != null
      ? `Bonjour, je suis intéressé par le ${product.name} - ${selectedVariant.name} (${formatFCFA(selectedVariant.price)})`
      : `Bonjour, je suis intéressé par le ${product.name} - ${selectedVariant.name} (merci de m'envoyer un devis)`
    : `Bonjour, je suis intéressé par le ${product.name}`;

  const familyId = resolveFamily(product.showcase?.family, product.showcase?.category);
  const categoryLabel = product.showcase?.category
    ? getCategoryLabel(product.showcase.category)
    : null;
  const usage = usageLabel(product.showcase?.usage);
  const highlights = product.showcase?.highlights || [];
  const variants = product.variants || [];
  const galleryImages = product.gallery_images || [];
  const hasVariantsTable = variants.some((v) => v.attributes?.dimensions || v.attributes?.materials);

  const handleAddToCart = () => {
    if (!selectedVariant || selectedVariant.price == null) return;
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
    <div className="pb-12">
      {/* ===== Breadcrumb ===== */}
      <div className="max-w-7xl mx-auto px-4 pt-4 md:pt-6">
        <nav className="text-xs text-[var(--color-text-tertiary)] flex items-center gap-1 flex-wrap">
          <Link href="/" className="hover:text-[var(--color-text-primary)]">Accueil</Link>
          <span>/</span>
          {familyId && (
            <>
              <Link href={`/collection/categorie/${familyId}`} className="hover:text-[var(--color-text-primary)]">
                {getFamilyLabel(familyId)}
              </Link>
              <span>/</span>
            </>
          )}
          {product.showcase?.category && (
            <>
              <span className="text-[var(--color-text-secondary)]">{getCategoryLabel(product.showcase.category)}</span>
              <span>/</span>
            </>
          )}
          <span className="text-[var(--color-text-secondary)] line-clamp-1">{product.name}</span>
        </nav>
      </div>

      {/* ===== Produit : galerie + panneau info ===== */}
      <div className="max-w-7xl mx-auto px-4 py-5 md:py-8 grid grid-cols-1 lg:grid-cols-2 lg:gap-12">
        {/* Galerie */}
        <div>
          <div className="relative aspect-[4/5] md:aspect-square rounded-2xl overflow-hidden bg-[var(--color-bg-tertiary)]">
            {product.main_image_url ? (
              <img
                src={imgProxyUrl(product.main_image_url, 900)}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-[var(--color-text-tertiary)] gap-2">
                <span className="text-4xl">✨</span>
                <span className="text-sm">Photo à venir</span>
              </div>
            )}
          </div>
          {/* Vignettes (si galerie disponible) */}
          {galleryImages.length > 0 && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {galleryImages.map((g, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden bg-[var(--color-bg-tertiary)]">
                  <img src={imgProxyUrl(g.url, 200)} alt={g.alt || product.name} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panneau info */}
        <div className="mt-6 lg:mt-0">
          {categoryLabel && <Badge variant="category">{categoryLabel}</Badge>}

          <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mt-3">
            {product.name}
          </h1>

          {/* Prix */}
          <div className="mt-3">
            {currentPrice != null ? (
              <div>
                <span className="text-xs text-[var(--color-text-tertiary)]">À partir de</span>
                <p className="text-2xl font-bold text-[var(--color-text-primary)] font-mono">
                  {formatFCFA(currentPrice)}
                </p>
              </div>
            ) : (
              <p className="text-lg font-semibold text-[var(--color-text-secondary)]">Sur devis</p>
            )}
          </div>

          {/* Sélecteur de variante */}
          {variants.length > 0 && (
            <div className="mt-4">
              <VariantSelector
                variants={variants.map((v) => ({ id: v.id, sku: v.sku, name: v.name, price: v.price }))}
                selectedSku={selectedSku}
                onSelect={(v) => setSelectedSku(v.sku)}
              />
            </div>
          )}

          {/* Description courte */}
          {product.showcase?.short_description && (
            <p className="mt-4 text-sm text-[var(--color-text-secondary)] leading-relaxed">
              {product.showcase.short_description}
            </p>
          )}

          {/* CTA */}
          <div className="mt-5 flex flex-col gap-2.5">
            {variants.length > 0 ? (
              currentPrice != null ? (
                <Button variant="primary" size="lg" className="w-full" onClick={handleAddToCart} disabled={!selectedSku}>
                  {selectedSku ? `Ajouter au panier — ${formatFCFA(currentPrice)}` : "Sélectionnez une taille"}
                </Button>
              ) : (
                <a href={getWhatsAppUrl(whatsapp, showWhatsAppMsg)} target="_blank" rel="noopener noreferrer">
                  <Button variant="whatsapp" size="lg" className="w-full">
                    {selectedSku ? "💬 Demander un devis WhatsApp" : "Sélectionnez une taille"}
                  </Button>
                </a>
              )
            ) : (
              <a href={getWhatsAppUrl(whatsapp, showWhatsAppMsg)} target="_blank" rel="noopener noreferrer">
                <Button variant="whatsapp" size="lg" className="w-full">💬 Demander un devis WhatsApp</Button>
              </a>
            )}
            <a href={getWhatsAppUrl(whatsapp, showWhatsAppMsg)} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="lg" className="w-full">💬 Parler à un conseiller</Button>
            </a>
          </div>

          {/* Réassurance (grille compacte) */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t border-[var(--color-border-default)]">
            {reassurances.map((r) => (
              <div key={r.label} className="flex flex-col items-center gap-1.5 text-center">
                <r.icon className="w-5 h-5 text-[var(--color-accent-amber)]" />
                <span className="text-[11px] leading-tight text-[var(--color-text-secondary)]">{r.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== Points forts : slider minimaliste ===== */}
      {highlights.length > 0 && (
        <section className="border-t border-[var(--color-border-default)]">
          <div className="max-w-7xl mx-auto px-4 py-8 md:py-10">
            <h2 className="font-display text-xl md:text-2xl font-bold text-[var(--color-text-primary)] mb-4">
              Points forts
            </h2>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-4 px-4 pb-2">
              {highlights.map((h, i) => {
                const Icon = highlightIcon(h);
                return (
                  <div
                    key={i}
                    className="snap-start shrink-0 w-[150px] sm:w-[170px] rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4 flex flex-col items-center gap-2.5 text-center"
                  >
                    <span className="w-9 h-9 rounded-full bg-[var(--color-bg-secondary)] text-[var(--color-accent-amber)] flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </span>
                    <span className="text-xs font-medium text-[var(--color-text-primary)] leading-snug">{h}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ===== Caractéristiques (compact) ===== */}
      {(hasVariantsTable || usage || product.showcase?.delivery_time) && (
        <section className="border-t border-[var(--color-border-default)]">
          <div className="max-w-7xl mx-auto px-4 py-8 md:py-10">
            <h2 className="font-display text-xl md:text-2xl font-bold text-[var(--color-text-primary)] mb-4">
              Caractéristiques
            </h2>

            {/* Tableau compact des variantes */}
            {hasVariantsTable && (
              <div className="overflow-x-auto mb-5">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wide text-[var(--color-text-tertiary)] border-b border-[var(--color-border-default)]">
                      <th className="py-2 pr-3 font-medium">Taille</th>
                      <th className="py-2 pr-3 font-medium">Dimensions</th>
                      <th className="py-2 pr-3 font-medium">Matériaux</th>
                      <th className="py-2 font-medium text-right">Prix</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v) => (
                      <tr key={v.id} className="border-b border-[var(--color-border-default)] last:border-0">
                        <td className="py-2 pr-3 font-medium text-[13px] text-[var(--color-text-primary)]">{v.name}</td>
                        <td className="py-2 pr-3 text-[13px] text-[var(--color-text-secondary)]">
                          {v.attributes?.dimensions || "—"}
                        </td>
                        <td className="py-2 pr-3 text-[13px] text-[var(--color-text-secondary)]">
                          {v.attributes?.materials || "—"}
                        </td>
                        <td className="py-2 text-right font-medium text-[13px] text-[var(--color-text-primary)] whitespace-nowrap">
                          {v.price != null ? formatFCFA(v.price) : "Sur devis"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Specs générales (grille compacte) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {product.showcase?.delivery_time && (
                <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl border border-[var(--color-border-default)]">
                  <Clock className="w-5 h-5 text-[var(--color-accent-amber)] shrink-0" />
                  <div>
                    <p className="text-[11px] text-[var(--color-text-tertiary)]">Délai</p>
                    <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{product.showcase.delivery_time}</p>
                  </div>
                </div>
              )}
              {usage && (
                <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl border border-[var(--color-border-default)]">
                  <Ruler className="w-5 h-5 text-[var(--color-accent-amber)] shrink-0" />
                  <div>
                    <p className="text-[11px] text-[var(--color-text-tertiary)]">Emplacement</p>
                    <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{usage}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl border border-[var(--color-border-default)]">
                <Shield className="w-5 h-5 text-[var(--color-accent-amber)] shrink-0" />
                <div>
                  <p className="text-[11px] text-[var(--color-text-tertiary)]">Garantie</p>
                  <p className="text-[13px] font-medium text-[var(--color-text-primary)]">2 ans</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== FAQ ===== */}
      <section className="border-t border-[var(--color-border-default)]">
        <div className="max-w-3xl mx-auto px-4 py-8 md:py-10">
          <h2 className="font-display text-xl md:text-2xl font-bold text-[var(--color-text-primary)] mb-4">
            Questions fréquentes
          </h2>
          <div className="space-y-2.5">
            {productFaq.map((faq, i) => (
              <details
                key={i}
                className="group rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)]"
              >
                <summary className="flex items-center justify-between gap-4 px-4 py-3 cursor-pointer text-sm font-medium text-[var(--color-text-primary)] select-none">
                  {faq.q}
                  <ChevronDown className="w-4 h-4 text-[var(--color-text-tertiary)] group-open:rotate-180 transition-transform shrink-0" />
                </summary>
                <p className="px-4 pb-3.5 text-sm text-[var(--color-text-secondary)] leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Produits similaires ===== */}
      {relatedProducts.length > 0 && (
        <section className="border-t border-[var(--color-border-default)]">
          <div className="max-w-7xl mx-auto px-4 py-8 md:py-10">
            <h2 className="font-display text-xl md:text-2xl font-bold text-[var(--color-text-primary)] mb-6">
              Vous aimerez aussi
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8">
              {relatedProducts.map((rp) => (
                <ProductCard key={rp.id} product={rp} />
              ))}
            </div>
          </div>
        </section>
      )}

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
