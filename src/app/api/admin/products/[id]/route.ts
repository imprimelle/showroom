import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeHighlights } from "@/lib/highlights";

/** Assainit les variantes reçues de l'admin avant écriture dans `showcase.variants`. */
function sanitizeVariants(variants: any[]): any[] {
  return variants
    .filter((v: any) => v && typeof v.name === "string" && v.name.trim())
    .map((v: any) => {
      const attrs: Record<string, string> = {};
      if (typeof v.attributes?.dimensions === "string" && v.attributes.dimensions.trim()) {
        attrs.dimensions = v.attributes.dimensions.trim();
      }
      if (typeof v.attributes?.materials === "string" && v.attributes.materials.trim()) {
        attrs.materials = v.attributes.materials.trim();
      }
      return {
        id: typeof v.id === "string" && v.id ? v.id : randomUUID(),
        sku: typeof v.sku === "string" ? v.sku.trim() : "",
        name: v.name.trim(),
        price: typeof v.price === "number" && Number.isFinite(v.price) && v.price >= 0 ? v.price : null,
        image: typeof v.image === "string" && v.image.trim() ? v.image.trim() : null,
        attributes: attrs,
      };
    });
}

/** Extrait le chemin Storage (bucket `images`) depuis une URL publique Supabase. */
function storagePathFromUrl(url: string): string | null {
  const m = url.match(/\/storage\/v1\/object\/public\/images\/(public\/[^?#]+)/);
  return m ? m[1] : null;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { name, is_published, popularity, showcase, main_image_url, gallery_images } = body;

    const admin = createAdminClient();
    const updates: Record<string, any> = {};

    if (typeof name === "string" && name.trim()) updates.name = name.trim();
    if (typeof is_published === "boolean") updates.is_published = is_published;
    if (main_image_url !== undefined) updates.main_image_url = main_image_url; // string | null
    if (Array.isArray(gallery_images)) updates.gallery_images = gallery_images; // string[]

    // Frames 360° retirées lors de cette sauvegarde (à supprimer du Storage).
    let removed360: string[] = [];

    if (typeof popularity === "number" || (showcase && typeof showcase === "object")) {
      // Merge showcase JSONB — ne jamais écraser, même si seul `popularity` est fourni
      const { data: existing } = await admin.from("products").select("showcase").eq("id", id).single();
      const merged = { ...((existing?.showcase as any) || {}), ...(showcase || {}) };
      if (typeof popularity === "number") merged.popularity = popularity;
      // Variantes découplées d'AssoAI : stockées dans `showcase.variants` (source de vérité admin).
      if (showcase && Array.isArray(showcase.variants)) {
        merged.variants = sanitizeVariants(showcase.variants);
      }
      // Points forts : assainir (ancien format string[] → objets { title, icon, text }).
      if (showcase && Array.isArray(showcase.highlights)) {
        merged.highlights = sanitizeHighlights(showcase.highlights);
      }
      // Séquence d'images 360° : assainir en tableau de strings non vides.
      if (showcase && Array.isArray(showcase.images_360)) {
        merged.images_360 = showcase.images_360
          .filter((u: any) => typeof u === "string" && u.trim())
          .map((u: string) => u.trim());
      }
      // Toggle d'activation de la vue 360°.
      if (showcase && typeof showcase.three_sixty_enabled === "boolean") {
        merged.three_sixty_enabled = showcase.three_sixty_enabled;
      }
      // Switch allumé/éteint : assainir (enabled booléen + deux URLs d'images optionnelles + map galerie).
      if (showcase && typeof showcase.light_switch === "object" && showcase.light_switch !== null) {
        const ls = showcase.light_switch as Record<string, any>;
        const galleryOff: Record<string, string> = {};
        if (ls.gallery_off && typeof ls.gallery_off === "object") {
          for (const [k, v] of Object.entries(ls.gallery_off)) {
            if (typeof k === "string" && k.trim() && typeof v === "string" && v.trim()) {
              galleryOff[k.trim()] = v.trim();
            }
          }
        }
        merged.light_switch = {
          enabled: typeof ls.enabled === "boolean" ? ls.enabled : false,
          image_on: typeof ls.image_on === "string" && ls.image_on.trim() ? ls.image_on.trim() : null,
          image_off: typeof ls.image_off === "string" && ls.image_off.trim() ? ls.image_off.trim() : null,
          gallery_off: galleryOff,
        };
      }
      // Réglages de paiement : paiement en ligne + cash à la livraison (booléens).
      if (showcase && typeof showcase.payment === "object" && showcase.payment !== null) {
        const pmt = showcase.payment as Record<string, any>;
        merged.payment = {
          online_enabled: typeof pmt.online_enabled === "boolean" ? pmt.online_enabled : false,
          cash_on_delivery: typeof pmt.cash_on_delivery === "boolean" ? pmt.cash_on_delivery : false,
        };
      }
      updates.showcase = merged;

      // Frames 360° présentes avant mais absentes après → orphelines à supprimer.
      const before360: string[] = ((existing?.showcase as any)?.images_360) || [];
      const after360: string[] = merged.images_360 || [];
      removed360 = before360.filter((u) => !after360.includes(u));
    }

    const { error } = await admin.from("products").update(updates).eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Suppression des fichiers 360 orphelins (best-effort — n'échoue pas la sauvegarde).
    if (removed360.length > 0) {
      const paths = removed360.map(storagePathFromUrl).filter((p): p is string => !!p);
      if (paths.length > 0) {
        await admin.storage.from("images").remove(paths);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
