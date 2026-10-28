import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMemberIdFromRequest } from "@/lib/member/auth";

export async function GET(request: NextRequest) {
  const memberId = await getMemberIdFromRequest(request);
  if (!memberId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("showcase_orders")
    .select(
      "id, created_at, total_amount, total_with_shipping, status, payment_status, payment_method, items, ref_code, promo_code"
    )
    .eq("member_id", memberId)
    .order("created_at", { ascending: false });

  return NextResponse.json({ orders: data || [] });
}
