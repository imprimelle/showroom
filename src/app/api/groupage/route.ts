import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  resolveGroupageConfig,
  resolveGroupageVariant,
  groupagePrice,
  groupageReductionAmount,
  GROUPAGE_MAX_DURATION_DAYS,
  groupageAgeDays,
  groupageDaysRemaining,
} from "@/lib/groupage";

export const dynamic = "force-dynamic";

/**
 * Statut « live » du groupage d'un produit (jauge de places restantes).
 * Lecture seule — aucun effet de bord (le groupage est créé au moment de la commande).
 * GET /api/groupage?product_id=<uuid>
 */
export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get("product_id");
  if (!productId) {
    return NextResponse.json({ enabled: false }, { status: 200 });
  }

  try {
    const admin = createAdminClient();

    const { data: product } = await admin
      .from("products")
      .select("showcase, variants")
      .eq("id", productId)
      .single();

    if (!product) {
      return NextResponse.json({ enabled: false }, { status: 200 });
    }

    const sc = (product as any).showcase;
    const variants = (Array.isArray(sc?.variants) ? sc.variants : (product as any).variants) as
      | { id?: string; name?: string; price: number | null }[]
      | null;

    const config = resolveGroupageConfig(sc);
    if (!config) {
      return NextResponse.json({ enabled: false }, { status: 200 });
    }

    const price = groupagePrice(config, variants);
    const reductionAmount = groupageReductionAmount(config, variants);
    const clonedVariant = resolveGroupageVariant(config, variants);

    // Groupage ouvert (le plus récent) — sans création.
    const { data: activeRow } = await admin
      .from("showcase_groupages")
      .select("*")
      .eq("product_id", productId)
      .eq("status", "open")
      .order("round", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Auto-complétion : un tour actif de plus de 3 semaines est marqué « complété ».
    let active = activeRow;
    if (active && groupageAgeDays(active.created_at) >= GROUPAGE_MAX_DURATION_DAYS) {
      await admin
        .from("showcase_groupages")
        .update({ status: "closed", closed_at: new Date().toISOString() })
        .eq("id", active.id);
      active = null;
    }

    // Le total de places est piloté par la config (modifiable dans l'admin).
    // L'instance active (`showcase_groupages`) garde un instantané figé à sa création,
    // mais l'affichage doit toujours refléter la valeur courante de la config.
    const maxPlaces = config.max_places;

    // Base d'affichage : nombre de places déjà attribuées (0..max_places), auquel
    // s'ajoutent les commandes réelles. Jauge = base + places réellement prises.
    const basePlaces = Math.min(maxPlaces, config.base_places ?? 0);
    const placesTaken = Math.min(maxPlaces, basePlaces + (active?.places_taken ?? 0));
    const remaining = Math.max(0, maxPlaces - placesTaken);

    return NextResponse.json({
      enabled: true,
      variant_id: config.variant_id,
      variant_name: clonedVariant?.name ?? null,
      reduction_percent: config.reduction_percent,
      reduction_fcfa: reductionAmount,
      max_places: maxPlaces,
      deposit_fcfa: config.deposit_fcfa,
      included_option_ids: config.included_option_ids,
      group_price_fcfa: price,
      base_places: config.base_places,
      places_taken: placesTaken,
      remaining,
      days_remaining: groupageDaysRemaining(active?.created_at ?? null),
      shares_count: active?.shares_count ?? 0,
      active: active
        ? {
            id: active.id,
            round: active.round,
            status: active.status,
            places_taken: active.places_taken,
            max_places: active.max_places,
          }
        : null,
    });
  } catch (err) {
    console.error("Groupage API error:", err);
    return NextResponse.json({ enabled: false }, { status: 200 });
  }
}
