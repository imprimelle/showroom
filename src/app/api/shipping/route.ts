import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveShippingZones } from "@/lib/shipping";
import { DEFAULT_ONLINE_METHODS } from "@/lib/payment";

/**
 * Config publique du checkout : zones de livraison + méthodes de paiement en ligne
 * (avec leur statut « live sur FedaPay ») + état du paiement en ligne.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("showcase_settings")
      .select("data")
      .eq("id", 1)
      .single();

    const settings = data?.data;
    const paymentMethods =
      Array.isArray(settings?.payment_methods) && settings.payment_methods.length
        ? settings.payment_methods
        : DEFAULT_ONLINE_METHODS;

    return NextResponse.json({
      zones: resolveShippingZones(settings?.shipping),
      payment_methods: paymentMethods,
      online_payment_enabled: Boolean(process.env.FEDAPAY_API_KEY),
    });
  } catch {
    return NextResponse.json({
      zones: resolveShippingZones(null),
      payment_methods: DEFAULT_ONLINE_METHODS,
      online_payment_enabled: Boolean(process.env.FEDAPAY_API_KEY),
    });
  }
}
