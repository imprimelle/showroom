import { supabase } from './supabase/client';
import type { Highlight } from '@/types';

export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  price: number | null;
  attributes?: Record<string, string>;
  image?: string;
}

export interface ShowcaseProduct {
  id: string;
  name: string;
  slug: string;
  main_image_url: string | null;
  gallery_images: string[];
  variants: ProductVariant[];
  is_published: boolean;
  showcase: {
    variants?: ProductVariant[];
    short_description?: string;
    highlights?: string[] | Highlight[];
    family?: string;
    category?: string;
    delivery_time?: string;
    usage?: string;
    popularity?: number;
    hero_video_url?: string;
    hero_aspect?: 'wide' | 'portrait';
    seo?: { title?: string; description?: string };
    faq?: { q: string; a: string }[];
    table_colors?: { id: string; label: string; hex: string }[];
    table_options?: { id: string; label: string }[];
    active_parameters?: string[];
    /** Séquence d'images de la vue 360° (32+ frames, ordre = sens de rotation). */
    images_360?: string[];
    /** Active la vue 360° sur la fiche produit. */
    three_sixty_enabled?: boolean;
    /** Switch allumé/éteint : bascule entre deux images (produit allumé vs éteint). */
    light_switch?: {
      enabled?: boolean;
      image_on?: string | null;
      image_off?: string | null;
      /** Image « éteint » associée à une photo de la galerie (clé = URL de la galerie). */
      gallery_off?: Record<string, string>;
    };
    /** Réglages de paiement du produit (onglet admin « Paiement »). */
    payment?: {
      /** Paiement en ligne (FedaPay) disponible pour ce produit. */
      online_enabled?: boolean;
      /** Autorise le paiement cash à la livraison pour ce produit. */
      cash_on_delivery?: boolean;
    };
  };
  description?: string;
}

/**
 * Un produit est « payable en ligne » (badge Express) si l'admin a activé
 * le paiement en ligne pour ce produit (toggle explicite).
 */
export function isOnlinePayable(product: Pick<ShowcaseProduct, "showcase">): boolean {
  return !!product.showcase?.payment?.online_enabled;
}

/** Le produit autorise-t-il le paiement cash à la livraison ? */
export function allowsCashOnDelivery(product: Pick<ShowcaseProduct, "showcase">): boolean {
  return !!product.showcase?.payment?.cash_on_delivery;
}

/**
 * Résout les variantes « showroom » (découplées d'AssoAI) :
 * `showcase.variants` d'abord (source de vérité admin), sinon repli sur `variants`
 * (copie AssoAI). Dès que `showcase.variants` existe (même vide), il est prioritaire.
 */
export function resolveVariants(product: any): ProductVariant[] {
  const sc = product?.showcase?.variants;
  if (Array.isArray(sc)) return sc;
  return Array.isArray(product?.variants) ? product.variants : [];
}

export async function getPublishedProducts(): Promise<ShowcaseProduct[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_published', true)
    .order('showcase->popularity', { ascending: false });

  if (error) throw error;
  return (data || []).map((p: any) => ({ ...p, variants: resolveVariants(p) }));
}

export async function getProductBySlug(slug: string): Promise<ShowcaseProduct | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) return null;
  return { ...data, variants: resolveVariants(data) };
}
