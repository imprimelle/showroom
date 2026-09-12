import { supabase } from "./supabase/client";
import type { ShowcaseSettings } from "@/types";

/**
 * Charge les réglages du site (showcase_settings, ligne id=1).
 * À utiliser uniquement dans des Server Components.
 */
export async function getShowcaseSettings(): Promise<ShowcaseSettings> {
  try {
    const { data } = await supabase
      .from("showcase_settings")
      .select("data")
      .eq("id", 1)
      .single();
    return (data?.data as ShowcaseSettings) || {};
  } catch {
    return {};
  }
}
