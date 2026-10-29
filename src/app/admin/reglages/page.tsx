import { createAdminClient } from "@/lib/supabase/admin";
import { getPublishedProducts } from "@/lib/products";
import { DEFAULT_REASSURANCE, DEFAULT_STEPS, DEFAULT_CTA } from "@/lib/home";
import { DEFAULT_PRODUCT_PARAMETERS } from "@/lib/parameters";
import { DEFAULT_CATEGORIES } from "@/lib/categories";
import { DEFAULT_FAQ_PILLS } from "@/lib/faq";
import { DEFAULT_GROUPAGE_INFO } from "@/lib/groupage";
import { DEFAULT_SOCIAL_PROOF_ENTRIES, SOCIAL_PROOF_DEFAULTS } from "@/lib/social-proof";
import { DEFAULT_ANNOUNCEMENT_MESSAGES, DEFAULT_ANNOUNCEMENT_PERIOD_MS } from "@/lib/announcements";
import type { ShowcaseSettings } from "@/types";
import { SettingsClient } from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const admin = createAdminClient();
  const [{ data }, products] = await Promise.all([
    admin.from("showcase_settings").select("data").eq("id", 1).single(),
    getPublishedProducts().catch(() => []),
  ]);

  const raw = (data?.data || {}) as ShowcaseSettings;
  const rawHome = raw.home;

  // Pré-remplissage des sections de la page d'accueil avec leurs valeurs par défaut,
  // afin que l'admin affiche le contenu actuellement visible (et non des champs vides).
  const settings: ShowcaseSettings = {
    ...raw,
    product_parameters:
      raw.product_parameters && raw.product_parameters.length > 0
        ? raw.product_parameters
        : DEFAULT_PRODUCT_PARAMETERS,
    catalog:
      raw.catalog && raw.catalog.length > 0 ? raw.catalog : DEFAULT_CATEGORIES,
    faq_pills:
      raw.faq_pills && raw.faq_pills.length > 0 ? raw.faq_pills : DEFAULT_FAQ_PILLS,
    social_proof: {
      enabled: !!raw.social_proof?.enabled,
      first_delay_seconds: raw.social_proof?.first_delay_seconds ?? SOCIAL_PROOF_DEFAULTS.first_delay_seconds,
      min_minutes: raw.social_proof?.min_minutes ?? SOCIAL_PROOF_DEFAULTS.min_minutes,
      max_minutes: raw.social_proof?.max_minutes ?? SOCIAL_PROOF_DEFAULTS.max_minutes,
      display_seconds: raw.social_proof?.display_seconds ?? SOCIAL_PROOF_DEFAULTS.display_seconds,
      entries:
        raw.social_proof?.entries && raw.social_proof.entries.length > 0
          ? raw.social_proof.entries
          : DEFAULT_SOCIAL_PROOF_ENTRIES,
    },
    groupage_info:
      raw.groupage_info?.sections && raw.groupage_info.sections.length > 0
        ? raw.groupage_info
        : DEFAULT_GROUPAGE_INFO,
    three_sixty: {
      enabled: raw.three_sixty?.enabled ?? true,
      sticky_button_enabled: !!raw.three_sixty?.sticky_button_enabled,
    },
    home: {
      ...rawHome,
      cta_title: rawHome?.cta_title ?? DEFAULT_CTA.title,
      cta_desc: rawHome?.cta_desc ?? DEFAULT_CTA.desc,
      reassurance:
        rawHome && rawHome.reassurance && rawHome.reassurance.length > 0
          ? rawHome.reassurance
          : DEFAULT_REASSURANCE,
      steps:
        rawHome && rawHome.steps && rawHome.steps.length > 0
          ? rawHome.steps
          : DEFAULT_STEPS,
    },
    announcement: {
      enabled: raw.announcement?.enabled !== false,
      period_ms: raw.announcement?.period_ms ?? DEFAULT_ANNOUNCEMENT_PERIOD_MS,
      messages: raw.announcement?.messages ?? DEFAULT_ANNOUNCEMENT_MESSAGES,
    },
    remises: raw.remises || { surplus: { enabled: false, amount_fcfa: 0 }, rules: [] },
  };

  return (
    <SettingsClient
      initialData={settings}
      products={products.map((p) => ({ id: p.id, name: p.name, slug: p.slug, main_image_url: p.main_image_url }))}
    />
  );
}
