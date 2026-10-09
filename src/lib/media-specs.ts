/**
 * Spécifications « réglementaires » des dimensions/taille recommandées
 * pour les médias uploadés depuis la console d'administration du showroom.
 *
 * Ces valeurs sont déduites des contextes de rendu réels (aspect-ratio + object-fit
 * dans les composants) et servent de source unique de vérité pour les libellés d'aide
 * affichés dans l'admin (MediaField/GalleryField) ainsi que pour le rapport
 * `RAPPORT-DIMENSIONS-IMAGES-SHOWROOM.md` à la racine du workspace.
 */
export const MEDIA_SPECS = {
  /** Image principale produit (products.main_image_url). */
  productImage:
    "Recommandé : 1200 × 1600 px (ratio 3:4, portrait) — JPEG/WebP, ≤ 5 Mo",
  /** Galerie produit (products.gallery_images). */
  galleryImage:
    "Recommandé : 1200 × 1600 px (ratio 3:4, portrait) — JPEG/WebP, ≤ 5 Mo",
  /** Image attachée à une variante (showcase.variants[].image). */
  variantImage:
    "Recommandé : 1200 × 1600 px (ratio 3:4) — JPEG/WebP, ≤ 5 Mo",
  /** Slide du héro de la page d'accueil (showcase_settings.hero.slides). */
  heroSlide:
    "Recommandé : 1080 × 1440 px (ratio 3:4, portrait — mobile first) — image ≤ 5 Mo, vidéo MP4 ≤ 50 Mo",
  /** Média d'un univers/catégorie (showcase_settings.categories[id].media). */
  universeMedia:
    "Recommandé : 1200 × 1600 px (ratio 3:4, portrait) — image ≤ 5 Mo ou vidéo 3:4",
  /** Vidéo du héro produit (showcase.hero_video_url). */
  heroVideo:
    "Recommandé : MP4 — 1920 × 1080 (large 16:9) ou 1080 × 1350 (portrait 3:4) — ≤ 50 Mo",
  /** Frame de la vue 360° (showcase.images_360). */
  frame360:
    "Recommandé : 1200 × 1600 px (ratio 3:4) — 32 images ou plus, ordre = sens de rotation",
  /** Vidéo d'inspiration « Idées décos » (showcase_settings.idea_deco). */
  ideaDecoVideo:
    "Recommandé : MP4 vertical 1080 × 1920 (ratio 9:16) — ≤ 50 Mo, mobile first",
} as const;

export type MediaSpecKey = keyof typeof MEDIA_SPECS;

/**
 * Specs de recadrage (dimensions cibles) par type de contenu image.
 * Utilisées par le recadreur d'image de la console admin :
 * - `ratio` = rapport largeur/hauteur imposé au cadrage (ex. 3/4 = 0.75) ;
 * - `width`/`height` = dimensions de sortie de l'image recadrée (canvas).
 * `null` = pas de recadrage (contenu vidéo ou libre).
 */
export interface CropSpec {
  ratio: number;
  width: number;
  height: number;
}

export const CROP_SPECS: Record<MediaSpecKey, CropSpec | null> = {
  productImage: { ratio: 3 / 4, width: 1200, height: 1600 },
  galleryImage: { ratio: 3 / 4, width: 1200, height: 1600 },
  variantImage: { ratio: 3 / 4, width: 1200, height: 1600 },
  heroSlide: { ratio: 3 / 4, width: 1080, height: 1440 },
  universeMedia: { ratio: 3 / 4, width: 1200, height: 1600 },
  heroVideo: null, // vidéo — pas de recadrage image
  frame360: null, // frames 360° — upload batch libre (pas de recadrage individuel)
  ideaDecoVideo: null, // vidéo — pas de recadrage image
};

/** Libellé humain d'un ratio (ex. 3/4 → "3:4"). */
export function ratioLabel(spec: CropSpec): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const g = gcd(spec.width, spec.height);
  return `${spec.width / g}:${spec.height / g}`;
}
