/**
 * Géocodage d'une adresse en lat/lng via Nominatim (OpenStreetMap).
 * Best-effort : renvoie `null` en cas d'échec (jamais bloquant).
 * Cache en mémoire court pour limiter les appels externes.
 */

export interface GeocodeResult {
  lat: number;
  lng: number;
}

const cache = new Map<string, GeocodeResult>();

export async function geocodeAddress(
  address?: string,
  city?: string,
  country?: string
): Promise<GeocodeResult | null> {
  const query = [address, city, country].filter(Boolean).join(", ");
  if (!query.trim()) return null;

  const key = query.toLowerCase().trim();
  const cached = cache.get(key);
  if (cached) return cached;

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "Imprimelle-Showroom/1.0 (contact: imprimelle.com)" },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = (await res.json()) as { lat?: string; lon?: string }[];
    if (!Array.isArray(data) || data.length === 0) return null;

    const lat = Number(data[0].lat);
    const lng = Number(data[0].lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    const result = { lat, lng };
    cache.set(key, result);
    return result;
  } catch {
    return null;
  }
}
