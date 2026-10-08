const STORAGE_URL = 'https://yqioyfuxviiximembver.supabase.co/storage/v1/render/image/public';

export function imgProxyUrl(url: string | null, width: number, height?: number | null, quality = 80): string {
  if (!url) return '/placeholder.svg';
  // If it's already a Supabase storage URL, use ImgProxy
  if (url.includes('supabase.co/storage/v1/object/public/')) {
    const path = url.split('/storage/v1/object/public/')[1];
    const [bucket, ...rest] = path.split('/');
    // ⚠️ `height` + `resize=cover` est requis : l'endpoint render/image conserve la
    // hauteur d'origine quand seul `width` est fourni → image écrasée horizontalement.
    // Fournir `height` + `resize=cover` recadre (sans déformer) au ratio demandé.
    const dims = height ? `&height=${Math.round(height)}&resize=cover` : '';
    return `${STORAGE_URL}/${bucket}/${rest.join('/')}?width=${width}${dims}&quality=${quality}&format=webp`;
  }
  return url;
}

export function srcSet(url: string | null, widths: number[]): string {
  if (!url) return '';
  return widths.map(w => `${imgProxyUrl(url, w)} ${w}w`).join(', ');
}

export function sizes(mobile: string, tablet: string, desktop: string): string {
  return `(max-width: 640px) ${mobile}, (max-width: 1024px) ${tablet}, ${desktop}`;
}
