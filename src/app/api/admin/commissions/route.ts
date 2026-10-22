import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/admin/commissions — lignes de commission (commandes attribuées à un revendeur).
 *   Filtres : ?reseller_id=, ?status=
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const resellerId = searchParams.get("reseller_id");
  const status = searchParams.get("status");

  const admin = createAdminClient();
  let query = admin
    .from("showcase_orders")
    .select(
      "id, customer_name, total_amount, promo_discount_fcfa, commission_rate, commission_fcfa, commission_status, payment_status, status, created_at, reseller_id"
    )
    .not("reseller_id", "is", null)
    .order("created_at", { ascending: false });

  if (resellerId) query = query.eq("reseller_id", resellerId);
  if (status) query = query.eq("commission_status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const orders = (data || []) as any[];

  // Agrégats (pour les cartes de synthèse admin).
  const totals = {
    pending_fcfa: 0,
    earned_fcfa: 0,
    paid_fcfa: 0,
  };
  for (const o of orders) {
    const amount = Number(o.commission_fcfa) || 0;
    if (o.commission_status === "paid") totals.paid_fcfa += amount;
    else if (o.commission_status === "earned") totals.earned_fcfa += amount;
    else totals.pending_fcfa += amount;
  }

  return NextResponse.json({ commissions: orders, totals });
}
