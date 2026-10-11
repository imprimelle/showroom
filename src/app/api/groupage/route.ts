import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  resolveGroupageConfig,
  resolveGroupageVariant,
  groupagePrice,
  groupageReductionAmount,
  remainingPlaces,
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
    const { data: active } = await admin
      .from("showcase_groupages")
      .select("*")
      .eq("product_id", productId)
      .eq("status", "open")
      .order("round", { ascending: false })
      .limit(1)
      .maybeSingle();

    const maxPlaces = active?.max_places ?? config.max_places;

    // Places restantes : valeur forcée (admin) sinon calculée depuis le compteur réel.
    const forcedRemaining = config.forced_remaining;
    const remaining =
      forcedRemaining != null
        ? Math.max(0, Math.min(forcedRemaining, maxPlaces))
        : remainingPlaces(maxPlaces, active?.places_taken ?? 0);
    const placesTaken = forcedRemaining != null ? maxPlaces - remaining : active?.places_taken ?? 0;

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
      forced_remaining: forcedRemaining,
      places_taken: placesTaken,
      remaining,
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
