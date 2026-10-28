import { NextRequest, NextResponse } from "next/server";
import { createOrderSchema } from "@/schemas/order";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveActiveParameters, DEFAULT_PRODUCT_PARAMETERS } from "@/lib/parameters";
import { shippingFeeForCountry } from "@/lib/shipping";
import { createFedaPayTransaction } from "@/lib/fedapay";
import { isOnlinePayment, DEFAULT_ONLINE_METHODS } from "@/lib/payment";
import { getWhatsAppUrl, DEFAULT_WHATSAPP, normalizePhone } from "@/lib/utils";
import { buildOrderMessage, productUrl } from "@/lib/whatsapp";
import {
  resolveGroupageConfig,
  groupagePrice,
  groupageReductionAmount,
  type GroupageConfig,
} from "@/lib/groupage";
import { createFactureFromShowroomOrder } from "@/lib/facture-link";
import {
  normalizeCode,
  resolveResellerByRef,
  resolveResellerByPromo,
  storeCommissionRate,
  computeCommission,
  computePromoDiscount,
  commissionRateFor,
} from "@/lib/resellers";
import type { ProductParameter, Reseller } from "@/types";

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

    const { customer, items, total_amount, notes, payment_method, shipping_country, shipping_fee_fcfa, ref_code, promo_code } =
      parsed.data;

    // Server-side price verification (variante + options de paramètres + groupage)
    const admin = createAdminClient();

    // Catalogue global des paramètres + zones de livraison + méthodes de paiement + groupage
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

    const hasGroupage = items.some((i) => i.groupage);

    // Map product_id → slug (pour les liens produit du message WhatsApp).
    const slugById = new Map<string, string>();
    // Map product_id → main_image_url (pour les miniatures de la facture matérialisée).
    const imageById = new Map<string, string | null>();
    // Config + prix groupage validés par produit (pour l'étape de join).
    const groupageConfig = new Map<string, GroupageConfig>();
    const groupagePriceMap = new Map<string, number>();
    const groupageReductionMap = new Map<string, number>();

    for (const item of items) {
      const { data: product, error } = await admin
        .from("products")
        .select("slug, variants, showcase, main_image_url")
        .eq("id", item.product_id)
        .single();

      if (error || !product) {
        return NextResponse.json({ error: `Produit introuvable: ${item.product_id}` }, { status: 400 });
      }

      if ((product as any).slug) slugById.set(item.product_id, (product as any).slug);
      imageById.set(item.product_id, (product as any).main_image_url ?? null);

      const sc = (product as any).showcase;
      const variants = (Array.isArray(sc?.variants) ? sc.variants : (product as any).variants) as
        | { id?: string; sku: string; price: number | null }[]
        | null;

      // === Article groupage : prix de base (variante clonée − %) + options (plein tarif) ===
      if (item.groupage) {
        const config = resolveGroupageConfig(sc);
        if (!config) {
          return NextResponse.json(
            { error: `Le groupage n'est pas disponible pour « ${item.product_name} »` },
            { status: 400 }
          );
        }
        const gPrice = groupagePrice(config, variants);
        if (gPrice == null) {
          return NextResponse.json(
            { error: `Groupage indisponible pour « ${item.product_name} »` },
            { status: 400 }
          );
        }
        // Valide les options : incluses = 0 FCFA, ajoutées = prix catalogue (aucune réduction).
        const activeParams = resolveActiveParameters(sc, catalog);
        const included = new Set(config.included_option_ids);
        let optionsTotal = 0;
        for (const opt of item.options || []) {
          const param = activeParams.find((p) => p.id === opt.param_id);
          const option = param?.options.find((o) => o.id === opt.option_id);
          if (!option) {
            return NextResponse.json({ error: `Option invalide pour ${item.product_name}` }, { status: 400 });
          }
          const expectedPrice = included.has(opt.option_id) ? 0 : option.price ?? 0;
          if (opt.price !== expectedPrice) {
            return NextResponse.json({ error: `Prix d'option incorrect pour ${item.product_name}` }, { status: 400 });
          }
          optionsTotal += opt.price;
        }
        const expectedUnit = gPrice + optionsTotal;
        if (item.unit_price_fcfa !== expectedUnit) {
          return NextResponse.json(
            { error: `Prix groupage incorrect pour ${item.product_name}` },
            { status: 400 }
          );
        }
        if (item.subtotal_fcfa !== expectedUnit * item.quantity) {
          return NextResponse.json(
            { error: `Sous-total incorrect pour ${item.product_name}` },
            { status: 400 }
          );
        }
        groupageConfig.set(item.product_id, config);
        groupagePriceMap.set(item.product_id, gPrice);
        groupageReductionMap.set(item.product_id, groupageReductionAmount(config, variants) ?? 0);
        continue;
      }

      // === Article classique : variante + options ===
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

    // Cohérence du total (anti-falsification).
    const sumItems = items.reduce((s, i) => s + i.subtotal_fcfa, 0);
    if (total_amount !== sumItems) {
      return NextResponse.json({ error: "Total incohérent" }, { status: 400 });
    }

    // Le groupage exige un montant de départ payé en ligne — le cash à la livraison seul n'est pas accepté.
    if (hasGroupage && payment_method === "cod") {
      return NextResponse.json(
        { error: "Le groupage nécessite un montant de départ payé en ligne." },
        { status: 400 }
      );
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

    // === Affiliation / revente — résolution serveur (anti-falsification, best-effort) ===
    // 1) Attribution par code ref (?ref=CODE) ou code promo (saisi au checkout).
    // 2) Remise du code promo : appliquée UNIQUEMENT hors groupage (le groupage a déjà sa réduction).
    // 3) Commission : taux figé × assiette HT (hors livraison), hors remise promo.
    // Un code invalide n'attribue rien et ne bloque jamais la commande.
    const refCode = normalizeCode(ref_code);
    const promoCode = normalizeCode(promo_code);

    let reseller: Reseller | null = null;
    let promoDiscount = 0;
    let appliedPromoCode: string | null = null;

    if (refCode) {
      reseller = await resolveResellerByRef(admin, refCode);
    }

    if (promoCode) {
      const promoReseller = await resolveResellerByPromo(admin, promoCode);
      if (promoReseller) {
        // Le code promo porte aussi l'affiliation si aucun ref n'a été fourni.
        if (!reseller) reseller = promoReseller;
        const pct = Number(promoReseller.promo_discount_percent);
        if (!hasGroupage && Number.isFinite(pct) && pct > 0 && pct <= 100) {
          promoDiscount = computePromoDiscount(total_amount, pct);
          appliedPromoCode = promoReseller.promo_code ?? promoCode;
        }
      }
    }

    let commissionFcfa: number | null = null;
    let commissionRate: number | null = null;
    if (reseller) {
      const rates = settingsRow?.data?.affiliation?.rates as
        | { standard?: number; performance?: number; vip?: number; store?: number }
        | undefined;
      commissionRate =
        reseller.type === "store"
          ? storeCommissionRate(rates)
          : commissionRateFor(reseller.level, rates);
      const base = Math.max(0, total_amount - promoDiscount);
      commissionFcfa = computeCommission(base, commissionRate);
    }

    const total_with_shipping = total_amount + shipping_fee_fcfa - promoDiscount;

    // === Rejoint les groupages (atomique) + calcule acompte / solde ===
    let groupageBalance = 0;
    const groupageIdByProduct = new Map<string, string>();
    if (hasGroupage) {
      for (const item of items) {
        if (!item.groupage) continue;
        const config = groupageConfig.get(item.product_id)!;
        const gPrice = groupagePriceMap.get(item.product_id)!;
        // Solde = prix complet (base + options) − montant de départ (null = tout payé maintenant).
        const deposit = config.deposit_fcfa ?? item.subtotal_fcfa;
        groupageBalance += Math.max(0, item.subtotal_fcfa - deposit);

        const { data: g, error: joinErr } = await admin.rpc("join_groupage", {
          p_product_id: item.product_id,
          p_reduction_fcfa: groupageReductionMap.get(item.product_id) ?? 0,
          p_group_price_fcfa: gPrice,
          p_max_places: config.max_places,
          p_deposit_fcfa: config.deposit_fcfa,
        });
        if (joinErr || !g) {
          console.error("join_groupage error:", joinErr);
          return NextResponse.json(
            { error: "Erreur lors de la participation au groupage. Veuillez réessayer." },
            { status: 500 }
          );
        }
        groupageIdByProduct.set(item.product_id, g.id);
      }
    }

    // Acompte (payé maintenant) = total − solde groupage ; solde = montant de départ non couvert.
    const balance_fcfa = hasGroupage ? groupageBalance : null;
    const deposit_fcfa = hasGroupage ? total_with_shipping - groupageBalance : null;

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
      groupage: item.groupage || false,
      groupage_id: item.groupage ? groupageIdByProduct.get(item.product_id) || null : null,
    }));

    const isOnline = isOnlinePayment(payment_method);
    const orderGroupageId = groupageIdByProduct.size > 0 ? groupageIdByProduct.values().next().value : null;

    // Liaison membre (client) par téléphone normalisé (best-effort).
    let memberId: string | null = null;
    try {
      const phoneDigits = normalizePhone(customer.phone);
      if (phoneDigits) {
        const { data: memberRow } = await admin
          .from("showroom_members")
          .select("id")
          .eq("phone", phoneDigits)
          .maybeSingle();
        memberId = (memberRow as { id?: string } | null)?.id ?? null;
      }
    } catch {
      /* best-effort */
    }

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
        groupage_id: orderGroupageId,
        deposit_fcfa,
        balance_fcfa,
        ip_address: ip,
        user_agent: request.headers.get("user-agent") || null,
        member_id: memberId,
        reseller_id: reseller?.id ?? null,
        ref_code: refCode || null,
        promo_code: appliedPromoCode,
        promo_discount_fcfa: promoDiscount > 0 ? promoDiscount : null,
        commission_rate: commissionRate,
        commission_fcfa: commissionFcfa,
        commission_status: commissionFcfa != null ? "pending" : null,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Order insert error:", insertError);
      return NextResponse.json({ error: "Erreur lors de la création de la commande" }, { status: 500 });
    }

    // === Pont Showroom → FactureBuilder (Option C) : matérialise une facture dans `messages` ===
    // Best-effort : un échec ici ne bloque JAMAIS la commande showroom (déjà créée).
    try {
      await createFactureFromShowroomOrder(admin, {
        orderId: order.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email || null,
        customerAddress: customer.address,
        items: items.map((i) => ({
          product_name: i.product_name,
          variant_label: i.variant_label,
          quantity: i.quantity,
          unit_price_fcfa: i.unit_price_fcfa,
          subtotal_fcfa: i.subtotal_fcfa,
          groupage: !!i.groupage,
          image_url: imageById.get(i.product_id) ?? null,
        })),
        totalAmount: total_amount,
        notes: notes || null,
        paymentMethod: payment_method,
        paymentStatus: isOnline ? "pending" : null,
        shippingCountry: shipping_country,
        shippingFeeFcfa: shipping_fee_fcfa,
        totalWithShipping: total_with_shipping,
        depositFcfa: deposit_fcfa,
        balanceFcfa: balance_fcfa,
      });
    } catch (e) {
      console.error("Facture link (showroom → messages) failed:", e);
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
            total: deposit_fcfa ?? total_with_shipping,
            balance_fcfa,
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
          variant: i.groupage ? "Groupage" : i.variant_label,
          quantity: i.quantity,
          url: productUrl(slugById.get(i.product_id)),
          options: (i.options || []).map((o) => ({ label: o.label, price: o.price })),
        })),
        orderId: order.id.slice(0, 8).toUpperCase(),
        totalFcfa: total_with_shipping,
        paymentMethod: payment_method,
        depositFcfa: balance_fcfa != null && balance_fcfa > 0 ? deposit_fcfa ?? undefined : undefined,
        balanceFcfa: balance_fcfa != null && balance_fcfa > 0 ? balance_fcfa : undefined,
      });
      return NextResponse.json(
        { order_id: order.id, whatsapp_url: getWhatsAppUrl(whatsapp, message) },
        { status: 201 }
      );
    }

    // Paiement en ligne : créer une transaction FedaPay (montant = acompte si groupage).
    if (isOnline) {
      try {
        const nameParts = customer.name.trim().split(/\s+/);
        const firstname = nameParts[0] || "Client";
        const lastname = nameParts.slice(1).join(" ") || firstname;

        const chargeAmount = deposit_fcfa ?? total_with_shipping;
        const callbackUrl = `${siteUrl()}/api/payments/fedapay/return?order=${order.id}`;
        const tx = await createFedaPayTransaction({
          description: `Commande #${order.id.slice(0, 8).toUpperCase()}`,
          amount: chargeAmount,
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
