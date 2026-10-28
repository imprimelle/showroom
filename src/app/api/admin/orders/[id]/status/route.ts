import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { status, notes } = body;

    const admin = createAdminClient();
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (status) updates.status = status;
    if (notes !== undefined) updates.notes = notes;

    const { error } = await admin.from("showcase_orders").update(updates).eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Vente confirmée par l'admin (talk_first / COD) → la commission devient « acquise ».
    // Idempotent : ne touche que les commissions encore « pending » (le paiement en ligne
    // les passe déjà à « earned » via le return FedaPay).
    if (status === "confirmed" || status === "delivered") {
      await admin
        .from("showcase_orders")
        .update({ commission_status: "earned" })
        .eq("id", id)
        .eq("commission_status", "pending");
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
