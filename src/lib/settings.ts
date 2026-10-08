import { supabase } from "./supabase/client";
import type { ShowcaseSettings } from "@/types";
import { setCategories, resolveCategories } from "./categories";

/**
 * Charge les réglages du site (showcase_settings, ligne id=1).
 * À utiliser uniquement dans des Server Components.
 * Hydrate aussi le catalogue de catégories (module `categories.ts`).
 */
export async function getShowcaseSettings(): Promise<ShowcaseSettings> {
  try {
    const { data } = await supabase
      .from("showcase_settings")
      .select("data")
      .eq("id", 1)
      .single();
    const settings = (data?.data as ShowcaseSettings) || {};
    setCategories(resolveCategories(settings.catalog));
    return settings;
  } catch {
    return {};
  }
}
