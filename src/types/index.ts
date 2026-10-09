import type { Category } from "@/lib/categories";

export interface ProductParameterOption {
  id: string;
  label: string;
  /** URL de la miniature (image) — prioritaire sur `color`. */
  image?: string | null;
  /** Swatch couleur (hex) — utilisé si `image` est vide (ex. paramètre « Couleur »). */
  color?: string;
  /** Coût additionnel en FCFA (null = 0). */
  price: number | null;
}

export interface ProductParameter {
  id: string;
  name: string;
  type: "single" | "multi";
  options: ProductParameterOption[];
}

/** Option sélectionnée dans le panier (référence + coût + libellé d'affichage). */
export interface CartItemOption {
  param_id: string;
  option_id: string;
  label: string;
  price: number;
}

export interface CartItem {
  key: string;
  product_id: string;
  product_name: string;
  product_slug: string;
  variant_label: string;
  variant_sku: string;
  quantity: number;
  unit_price_fcfa: number;
  image_url: string | null;
  options?: CartItemOption[];
  /** Produit éligible au paiement en ligne (flag produit). */
  online_enabled?: boolean;
  /** Produit éligible au cash à la livraison (flag produit). */
  cash_on_delivery?: boolean;
}

export interface OrderPayload {
  customer: {
    name: string;
    phone: string;
    email?: string;
    city: string;
    address: string;
  };
  items: {
    product_id: string;
    product_name: string;
    variant_label: string;
    variant_sku: string;
    quantity: number;
    unit_price_fcfa: number;
    subtotal_fcfa: number;
    options?: CartItemOption[];
  }[];
  total_amount: number;
  notes?: string;
}

export type OrderStatus = 'new' | 'contacted' | 'confirmed' | 'in_progress' | 'delivered' | 'cancelled';

/** Méthodes de paiement en ligne via FedaPay (catalogue global, grisées si non live). */
export type OnlinePaymentMethod = 'orange' | 'mtn' | 'wave' | 'card';

/** Méthode de paiement d'une commande : en ligne | cash | nous parler avant de payer. */
export type PaymentMethod = OnlinePaymentMethod | 'cod' | 'talk_first';

export interface ShowcaseOrder {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_city: string;
  customer_address: string;
  customer_email: string | null;
  items: CartItem[];
  total_amount: number;
  notes: string | null;
  status: OrderStatus;
  payment_method: PaymentMethod | null;
  payment_status: string | null;
  payment_reference: string | null;
  shipping_country: string | null;
  shipping_fee_fcfa: number | null;
  total_with_shipping: number | null;
  created_at: string;
  updated_at: string;
}

export interface MediaItem {
  type: 'image' | 'video';
  url: string;
  alt?: string;
}

/** Point fort d'une fiche produit : titre + icône + texte révélé au clic. */
export interface Highlight {
  /** Titre court affiché sur la carte. */
  title: string;
  /** Clé d'icône (catalogue `HIGHLIGHT_ICONS`). Vide = déduite du titre. */
  icon: string;
  /** Texte complémentaire révélé au clic (carrousel). */
  text: string;
}

/** Pilule FAQ (bottom sheet de la fiche produit) — réglable globalement. */
export interface FaqPill {
  id: string;
  label: string;
  content: string;
}

/** Vidéo d'inspiration « Idées décos » (slider 9:16 en bas de fiche produit). */
export interface IdeaDecoVideo {
  /** URL de la vidéo (MP4, format vertical 9:16). */
  url: string;
  /** Image d'affiche (poster) optionnelle, affichée avant lecture. */
  poster?: string | null;
  /** Slugs des produits présentés dans la vidéo (cibles du bouton « Produits »). */
  product_slugs?: string[];
}

/** Produit résolu à afficher dans le bottom-sheet « Produits » d'une carte vidéo. */
export interface IdeaDecoProductRef {
  slug: string;
  name: string;
  image_url: string | null;
  price: number | null;
}

/** Vidéo « Idées décos » résolue pour le rendu front (produits dé-référencés). */
export interface IdeaDecoSlide {
  url: string;
  poster: string | null;
  products: IdeaDecoProductRef[];
}

/** Avis client (table showcase_reviews). */
export interface ShowcaseReview {
  id: string;
  product_slug: string;
  product_name: string;
  author_name: string;
  rating: number;
  title?: string | null;
  content: string;
  verified: boolean;
  order_number?: string | null;
  /** Pays d'origine du client (affiché sur la carte d'avis). */
  country?: string | null;
  /** Photos du client (URLs publiques Supabase Storage), jusqu'à 4. */
  photos?: string[] | null;
  created_at: string;
}

/** Agrégat d'avis d'un produit (note moyenne + répartition). */
export interface ReviewAggregate {
  /** Note moyenne (0 si aucun avis), arrondie à 1 décimale. */
  average: number;
  /** Nombre total d'avis. */
  count: number;
  /** Répartition par note (5 → 1). */
  distribution: { rating: number; count: number }[];
}

export interface ShowcaseSettings {
  contact?: { whatsapp?: string; phone?: string; email?: string; address?: string };
  meta?: { site_name?: string; domain?: string; default_title?: string; default_description?: string };
  social?: { facebook?: string; instagram?: string; tiktok?: string };
  analytics?: {
    fb_pixel_id?: string;
    umami_website_id?: string;
    umami_script_url?: string;
    posthog_key?: string;
    posthog_host?: string;
  };
  hero?: {
    video_url?: string;
    title?: string;
    subtitle?: string;
    cta_text?: string;
    cta_href?: string;
    slides?: MediaItem[];
  };
  categories?: Record<string, { title?: string; media?: MediaItem }>;
  home?: {
    cta_title?: string;
    cta_desc?: string;
    reassurance?: { title: string; desc: string }[];
    steps?: { title: string; desc: string }[];
    featured?: string[];
  };
  /** Catalogue global des paramètres produit (options avec miniatures + coûts). */
  product_parameters?: ProductParameter[];
  /** Catalogue des catégories/sous-catégories (dynamique, repli sur DEFAULT_CATEGORIES). */
  catalog?: Category[];
  /** Zones de livraison / frais de port (Réglages → Livraison). */
  shipping?: { zones?: { id: string; label: string; countries: string[]; fee_fcfa: number }[] };
  /** Catalogue des méthodes de paiement en ligne + statut « live sur FedaPay » (Réglages → Paiement). */
  payment_methods?: { id: OnlinePaymentMethod; label: string; live: boolean }[];
  /** Pilules FAQ (bottom sheet) affichées sur toutes les fiches produit (Réglages → FAQ produit). */
  faq_pills?: FaqPill[];
  /** Vidéos d'inspiration « Idées décos » par univers (slug de famille → liste de vidéos). */
  idea_deco?: Record<string, IdeaDecoVideo[]>;
}
