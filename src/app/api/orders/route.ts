import { NextRequest, NextResponse } from "next/server";
import { createOrderSchema } from "@/schemas/order";
import { createAdminClient } from "@/lib/supabase/admin";

// In-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 5 * 60 * 1000 });
    return true;
  }
  if (record.count >= 3) return false;
  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  // Rate limit
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Trop de tentatives. Veuillez patienter 5 minutes." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { customer, items, total_amount, notes } = parsed.data;

    // Server-side price verification
    const admin = createAdminClient();
    for (const item of items) {
      const { data: product, error } = await admin
        .from("products")
        .select("variants")
        .eq("id", item.product_id)
        .single();

      if (error || !product) {
        return NextResponse.json({ error: `Produit introuvable: ${item.product_id}` }, { status: 400 });
      }

      const variants = product.variants as { sku: string; price: number }[] | null;
      const variant = variants?.find((v) => v.sku === item.variant_sku);

      if (!variant) {
        return NextResponse.json({ error: `Variante introuvable: ${item.variant_sku}` }, { status: 400 });
      }

      if (Math.abs(variant.price - item.unit_price_fcfa) / variant.price > 0.05) {
        return NextResponse.json({ error: `Prix incorrect pour ${item.product_name}` }, { status: 400 });
      }

      const expectedSubtotal = variant.price * item.quantity;
      if (item.subtotal_fcfa !== expectedSubtotal) {
        return NextResponse.json({ error: `Sous-total incorrect pour ${item.product_name}` }, { status: 400 });
      }
    }

    // Insert order
    const orderItems = items.map((item) => ({
      product_id: item.product_id,
      product_name: item.product_name,
      variant_label: item.variant_label,
      variant_sku: item.variant_sku,
      quantity: item.quantity,
      unit_price_fcfa: item.unit_price_fcfa,
      subtotal_fcfa: item.subtotal_fcfa,
    }));

    const { data: order, error: insertError } = await admin
      .from("showcase_orders")
      .insert({
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_email: customer.email || null,
        customer_city: customer.city,
        customer_address: customer.address,
        items: orderItems,
        total_amount,
        notes: notes || null,
        status: "new",
        ip_address: ip,
        user_agent: request.headers.get("user-agent") || null,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Order insert error:", insertError);
      return NextResponse.json({ error: "Erreur lors de la création de la commande" }, { status: 500 });
    }

    // Fire-and-forget WhatsApp notification (timeout 5s)
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const waUrl = process.env.WHATSAPP_QUEUE_URL;
      if (waUrl) {
        await fetch(waUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "new_order",
            order_id: order.id,
            customer_name: customer.name,
            customer_phone: customer.phone,
            total: total_amount,
            items: items.map((i) => i.product_name).join(", "),
          }),
          signal: controller.signal,
        });
      }
      clearTimeout(timeout);
    } catch {
      // Fire & forget — never block the response
    }

    return NextResponse.json({ order_id: order.id }, { status: 201 });
  } catch (err) {
    console.error("Order API error:", err);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
