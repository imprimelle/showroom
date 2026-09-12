import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get("phone");
  if (!phone || !/^\+?[0-9]{8,15}$/.test(phone)) {
    return NextResponse.json({ error: "Numéro de téléphone invalide" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: orders, error } = await admin
    .from("showcase_orders")
    .select("id, status, total_amount, items, created_at")
    .eq("customer_phone", phone)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error || !orders?.length) {
    return NextResponse.json({ error: "Aucune commande trouvée pour ce numéro" }, { status: 404 });
  }

  return NextResponse.json({ order: orders[0] });
}
