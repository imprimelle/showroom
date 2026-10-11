import { unstable_cache } from "next/cache";
import { supabase } from "./supabase/client";
import type { ShowcaseSettings } from "@/types";
import { setCategories, resolveCategories } from "./categories";

/**
 * Lecture brute des réglages (mise en cache Next.js).
 * `unstable_cache` déduplique au sein d'une même requête ET persiste le résultat
 * entre requêtes (process auto-hébergé). Tag `showcase-settings` pour invalidation
 * on-demand depuis l'admin (`revalidateTag`).
 *
 * IMPORTANT : l'effet de bord `setCategories(...)` (hydratation du catalogue global)
 * reste dans le wrapper NON caché ci-dessous, afin qu'il s'exécute à chaque appel.
 */
const getSettingsCached = unstable_cache(
  async (): Promise<ShowcaseSettings> => {
    const { data } = await supabase
      .from("showcase_settings")
      .select("data")
      .eq("id", 1)
      .single();
    return (data?.data as ShowcaseSettings) || {};
  },
  ["showcase-settings"],
  // Filet de sécurité (5 min) au cas où un écrit ne passerait pas par l'admin ;
  // l'invalidation on-demand (revalidateTag) garde le contenu frais sinon.
  { revalidate: 300, tags: ["showcase-settings"] }
);

/**
 * Charge les réglages du site (showcase_settings, ligne id=1).
 * À utiliser uniquement dans des Server Components.
 * Hydrate aussi le catalogue de catégories (module `categories.ts`).
 */
export async function getShowcaseSettings(): Promise<ShowcaseSettings> {
  try {
    const settings = await getSettingsCached();
    setCategories(resolveCategories(settings.catalog));
    return settings;
  } catch {
    return {};
  }
}
