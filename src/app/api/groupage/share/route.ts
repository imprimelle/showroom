import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  resolveGroupageConfig,
  groupagePrice,
  groupageReductionAmount,
} from "@/lib/groupage";

export const dynamic = "force-dynamic";

/**
 * Enregistre un partage de groupage (incrémente `shares_count` du groupage ouvert).
 * POST /api/groupage/share  { product_id }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const productId = body?.product_id;
    if (!productId) {
      return NextResponse.json({ error: "product_id requis" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: product } = await admin
      .from("products")
      .select("showcase, variants")
      .eq("id", productId)
      .single();

    if (!product) {
      return NextResponse.json({ shares_count: 0 }, { status: 200 });
    }

    const sc = (product as any).showcase;
    const variants = (Array.isArray(sc?.variants) ? sc.variants : (product as any).variants) as
      | { id?: string; price: number | null }[]
      | null;
    const config = resolveGroupageConfig(sc);
    if (!config) {
      return NextResponse.json({ shares_count: 0 }, { status: 200 });
    }

    const price = groupagePrice(config, variants) ?? 0;
    const reduction = groupageReductionAmount(config, variants) ?? 0;

    const { data: g, error } = await admin.rpc("register_groupage_share", {
      p_product_id: productId,
      p_reduction_fcfa: reduction,
      p_group_price_fcfa: price,
      p_max_places: config.max_places,
      p_deposit_fcfa: config.deposit_fcfa,
    });

    if (error) {
      console.error("register_groupage_share error:", error);
      return NextResponse.json({ shares_count: 0 }, { status: 200 });
    }

    return NextResponse.json({ shares_count: g?.shares_count ?? 0 });
  } catch (err) {
    console.error("Groupage share API error:", err);
    return NextResponse.json({ shares_count: 0 }, { status: 200 });
  }
}
