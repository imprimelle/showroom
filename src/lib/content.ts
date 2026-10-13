import { unstable_cache } from "next/cache";
import { supabase } from "./supabase/client";

/**
 * Surcartes de textes rigides (édités inline sur les pages publiques).
 * Table `showcase_content` : `key` → `value`.
 *
 * Même mécanisme de cache que `settings.ts` : `unstable_cache` déduplique et
 * persiste le résultat (process auto-hébergé), tag `showcase-content` pour
 * invalidation on-demand depuis l'API admin (`revalidateTag`).
 */

export type ContentMap = Record<string, string>;

const getContentMapCached = unstable_cache(
  async (): Promise<ContentMap> => {
    const { data } = await supabase.from("showcase_content").select("key, value");
    const map: ContentMap = {};
    for (const row of data || []) {
      if (row.key) map[row.key] = row.value ?? "";
    }
    return map;
  },
  ["showcase-content"],
  { revalidate: 300, tags: ["showcase-content"] }
);

/**
 * Charge toutes les surcartes de textes (clé → valeur).
 * À utiliser uniquement dans des Server Components (layout racine).
 */
export async function getContentMap(): Promise<ContentMap> {
  try {
    return await getContentMapCached();
  } catch {
    return {};
  }
}
