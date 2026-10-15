import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { COUNTRIES } from "@/lib/countries";
import { COUNTRY_FLAGS } from "@/lib/social-proof";

export const dynamic = "force-dynamic";

interface RealOrder {
  name: string;
  country: string;
  flag: string;
  product_name: string | null;
}

/**
 * Preuve sociale réelle : dernières commandes (nom + pays + produit),
 * pour alimenter la notification « X vient de commander ». Aucune donnée
 * sensible (pas de téléphone, pas d'adresse). Repli silencieux sur liste vide.
 */
export async function GET() {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("showcase_orders")
      .select("customer_name, shipping_country, items")
      .order("created_at", { ascending: false })
      .limit(40);

    if (error || !Array.isArray(data)) {
      return NextResponse.json({ orders: [] });
    }

    const seen = new Set<string>();
    const orders: RealOrder[] = [];

    for (const row of data) {
      const rawName = String(row?.customer_name || "").trim();
      if (!rawName) continue;
      const name = rawName.split(/\s+/).slice(0, 2).join(" ");
      // Déduplique par nom (une commande = une notification max).
      if (seen.has(name.toLowerCase())) continue;
      seen.add(name.toLowerCase());

      const code = String(row?.shipping_country || "").toUpperCase();
      const countryName =
        COUNTRIES.find((c) => c.code === code)?.name || "Côte d'Ivoire";

      const items = Array.isArray(row?.items) ? row.items : [];
      const productName =
        items.length > 0 && items[0]?.product_name
          ? String(items[0].product_name)
          : null;
      if (!productName) continue;

      orders.push({
        name,
        country: countryName,
        flag: COUNTRY_FLAGS[countryName] ?? "🌍",
        product_name: productName,
      });

      if (orders.length >= 12) break;
    }

    return NextResponse.json({ orders });
  } catch {
    return NextResponse.json({ orders: [] });
  }
}
