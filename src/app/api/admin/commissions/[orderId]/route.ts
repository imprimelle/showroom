import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * PATCH /api/admin/commissions/[orderId] — change le statut d'une commission
 * (`pending` → `earned`/`paid`, `earned` → `paid`, ou `cancelled`).
 */

const statusSchema = z.object({
  status: z.enum(["pending", "earned", "paid", "cancelled"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: updated, error } = await admin
    .from("showcase_orders")
    .update({ commission_status: parsed.data.status })
    .eq("id", orderId)
    .select("id, commission_status")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ commission: updated });
}
