import { NextRequest, NextResponse } from "next/server";
import { createOrderSchema } from "@/schemas/order";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveActiveParameters, DEFAULT_PRODUCT_PARAMETERS } from "@/lib/parameters";
import { shippingFeeForCountry } from "@/lib/shipping";
import { createFedaPayTransaction } from "@/lib/fedapay";
import { isOnlinePayment, DEFAULT_ONLINE_METHODS } from "@/lib/payment";
import { getWhatsAppUrl, DEFAULT_WHATSAPP } from "@/lib/utils";
import { buildOrderMessage, productUrl } from "@/lib/whatsapp";
import type { ProductParameter } from "@/types";

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

function siteUrl(): string {
  return (process.env.SITE_URL || "https://imprimelle.com").replace(/\/+$/, "");
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

    const { customer, items, total_amount, notes, payment_method, shipping_country, shipping_fee_fcfa } =
      parsed.data;

    // Server-side price verification (variante + options de paramètres)
    const admin = createAdminClient();

    // Catalogue global des paramètres + zones de livraison + méthodes de paiement
    const { data: settingsRow } = await admin
      .from("showcase_settings")
      .select("data")
      .eq("id", 1)
      .single();
    const catalog =
      (settingsRow?.data?.product_parameters as ProductParameter[]) || DEFAULT_PRODUCT_PARAMETERS;
    const shippingConfig = settingsRow?.data?.shipping || null;
    const methodDefs =
      (Array.isArray(settingsRow?.data?.payment_methods) && settingsRow.data.payment_methods.length)
        ? settingsRow.data.payment_methods
        : DEFAULT_ONLINE_METHODS;
    const liveMethods = new Set(methodDefs.filter((m: any) => m?.live).map((m: any) => m.id));
    const whatsapp = settingsRow?.data?.contact?.whatsapp || DEFAULT_WHATSAPP;

    // Map product_id → slug (pour les liens produit du message WhatsApp).
    const slugById = new Map<string, string>();

    for (const item of items) {
      const { data: product, error } = await admin
        .from("products")
        .select("slug, variants, showcase")
        .eq("id", item.product_id)
        .single();

      if (error || !product) {
        return NextResponse.json({ error: `Produit introuvable: ${item.product_id}` }, { status: 400 });
      }

      if ((product as any).slug) slugById.set(item.product_id, (product as any).slug);

      const sc = (product as any).showcase;
      const variants = (Array.isArray(sc?.variants) ? sc.variants : (product as any).variants) as
        | { sku: string; price: number | null }[]
        | null;
      const variant = variants?.find((v) => v.sku === item.variant_sku);

      if (!variant) {
        return NextResponse.json({ error: `Variante introuvable: ${item.variant_sku}` }, { status: 400 });
      }

      const basePrice = variant.price;
      if (basePrice == null) {
        return NextResponse.json({ error: `Variante sur devis: ${item.variant_sku}` }, { status: 400 });
      }

      // Éligibilité produit selon la méthode choisie.
      if (isOnlinePayment(payment_method) && !sc?.payment?.online_enabled) {
        return NextResponse.json(
          { error: `Le paiement en ligne n'est pas disponible pour « ${item.product_name} »` },
          { status: 400 }
        );
      }
      if (payment_method === "cod" && !sc?.payment?.cash_on_delivery) {
        return NextResponse.json(
          { error: `Le paiement à la livraison n'est pas disponible pour « ${item.product_name} »` },
          { status: 400 }
        );
      }

      // Vérifie les options sélectionnées contre le catalogue (anti-falsification des coûts)
      const activeParams = resolveActiveParameters(sc, catalog);
      let optionsTotal = 0;
      for (const opt of item.options || []) {
        const param = activeParams.find((p) => p.id === opt.param_id);
        const option = param?.options.find((o) => o.id === opt.option_id);
        if (!option) {
          return NextResponse.json({ error: `Option invalide pour ${item.product_name}` }, { status: 400 });
        }
        if ((option.price ?? 0) !== opt.price) {
          return NextResponse.json({ error: `Prix d'option incorrect pour ${item.product_name}` }, { status: 400 });
        }
        optionsTotal += opt.price;
      }

      const expectedUnitPrice = basePrice + optionsTotal;
      if (item.unit_price_fcfa !== expectedUnitPrice) {
        return NextResponse.json({ error: `Prix incorrect pour ${item.product_name}` }, { status: 400 });
      }

      if (item.subtotal_fcfa !== expectedUnitPrice * item.quantity) {
        return NextResponse.json({ error: `Sous-total incorrect pour ${item.product_name}` }, { status: 400 });
      }
    }

    // Vérifie que la méthode en ligne choisie est bien « live » sur FedaPay.
    if (isOnlinePayment(payment_method) && !liveMethods.has(payment_method)) {
      return NextResponse.json(
        { error: "Ce moyen de paiement en ligne n'est pas encore disponible." },
        { status: 400 }
      );
    }

    // Vérifie les frais de port côté serveur (anti-falsification).
    const expectedShipping = shippingFeeForCountry(shipping_country, shippingConfig);
    if (shipping_fee_fcfa !== expectedShipping) {
      return NextResponse.json({ error: "Frais de port incorrects" }, { status: 400 });
    }

    const total_with_shipping = total_amount + shipping_fee_fcfa;

    // Insert order
    const orderItems = items.map((item) => ({
      product_id: item.product_id,
      product_name: item.product_name,
      variant_label: item.variant_label,
      variant_sku: item.variant_sku,
      quantity: item.quantity,
      unit_price_fcfa: item.unit_price_fcfa,
      subtotal_fcfa: item.subtotal_fcfa,
      options: item.options || [],
    }));

    const isOnline = isOnlinePayment(payment_method);

    const { data: order, error: insertError } = await admin
      .from("showcase_orders")
      .insert({
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_email: customer.email || null,
        customer_city: customer.city || "",
        customer_address: customer.address,
        items: orderItems,
        total_amount,
        notes: notes || null,
        status: "new",
        payment_method,
        payment_status: isOnline ? "pending" : null,
        payment_reference: null,
        shipping_country,
        shipping_fee_fcfa,
        total_with_shipping,
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
            total: total_with_shipping,
            payment_method,
            items: items.map((i) => i.product_name).join(", "),
          }),
          signal: controller.signal,
        });
      }
      clearTimeout(timeout);
    } catch {
      // Fire & forget — never block the response
    }

    // « Nous parler avant de payer » : commande créée, redirection WhatsApp pré-remplie.
    if (payment_method === "talk_first") {
      const message = buildOrderMessage({
        items: items.map((i) => ({
          name: i.product_name,
          variant: i.variant_label,
          quantity: i.quantity,
          url: productUrl(slugById.get(i.product_id)),
          options: (i.options || []).map((o) => ({ label: o.label, price: o.price })),
        })),
        orderId: order.id.slice(0, 8).toUpperCase(),
        totalFcfa: total_with_shipping,
        paymentMethod: payment_method,
      });
      return NextResponse.json(
        { order_id: order.id, whatsapp_url: getWhatsAppUrl(whatsapp, message) },
        { status: 201 }
      );
    }

    // Paiement en ligne : créer une transaction FedaPay et renvoyer l'URL de redirection.
    if (isOnline) {
      try {
        const nameParts = customer.name.trim().split(/\s+/);
        const firstname = nameParts[0] || "Client";
        const lastname = nameParts.slice(1).join(" ") || firstname;

        const callbackUrl = `${siteUrl()}/api/payments/fedapay/return?order=${order.id}`;
        const tx = await createFedaPayTransaction({
          description: `Commande #${order.id.slice(0, 8).toUpperCase()}`,
          amount: total_with_shipping,
          callback_url: callbackUrl,
          customer: {
            firstname,
            lastname,
            email: customer.email || null,
            phone: customer.phone.replace(/^\+/, ""),
            phone_country: shipping_country,
          },
        });

        // Associe la référence FedaPay à la commande.
        await admin
          .from("showcase_orders")
          .update({ payment_reference: String(tx.id) })
          .eq("id", order.id);

        return NextResponse.json({ order_id: order.id, payment_url: tx.url }, { status: 201 });
      } catch (e) {
        console.error("FedaPay create error:", e);
        return NextResponse.json(
          { error: "Impossible d'initialiser le paiement. Veuillez réessayer." },
          { status: 502 }
        );
      }
    }

    // Cash à la livraison.
    return NextResponse.json({ order_id: order.id }, { status: 201 });
  } catch (err) {
    console.error("Order API error:", err);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
