import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFedaPayTransaction, isFedaPayPaid } from "@/lib/fedapay";

/**
 * URL de retour FedaPay (callback_url). Réinterroge le statut de la transaction
 * auprès de FedaPay (source de vérité), met à jour la commande, puis redirige
 * vers la page de confirmation.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("order") || "";
  const txId = searchParams.get("id") || "";

  const redirect = (status: string, extra = "") => {
    const url = new URL(`/confirmation?order=${encodeURIComponent(orderId)}&status=${status}${extra}`, request.url);
    return NextResponse.redirect(url);
  };

  if (!orderId) {
    const url = new URL("/confirmation?status=error", request.url);
    return NextResponse.redirect(url);
  }

  try {
    const admin = createAdminClient();
    const { data: order, error } = await admin
      .from("showcase_orders")
      .select("id, payment_reference, payment_method, total_with_shipping, total_amount, shipping_country")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return redirect("error");
    }

    const fedapayId = txId || order.payment_reference;
    if (!fedapayId) {
      return redirect("pending");
    }

    const tx = await getFedaPayTransaction(fedapayId);
    const paid = isFedaPayPaid(tx.status);

    const status = paid ? "paid" : tx.status === "failed" || tx.status === "declined" ? "failed" : "pending";

    // Met à jour le statut de paiement (idempotent).
    await admin
      .from("showcase_orders")
      .update({ payment_status: status, payment_reference: String(fedapayId) })
      .eq("id", orderId);

    const total = order.total_with_shipping ?? order.total_amount ?? 0;
    const pm = order.payment_method || "";
    return redirect(status, `&pm=${encodeURIComponent(pm)}&total=${encodeURIComponent(total)}`);
  } catch (e) {
    console.error("FedaPay return error:", e);
    return redirect("pending");
  }
}
