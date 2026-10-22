import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeCode } from "@/lib/resellers";

/**
 * GET /api/admin/resellers — liste des revendeurs (filtre ?type= & ?status=).
 * POST /api/admin/resellers — création manuelle d'un revendeur.
 */

const createSchema = z.object({
  type: z.enum(["affiliate", "store"]),
  status: z.enum(["pending", "active", "suspended", "rejected"]).default("pending"),
  name: z.string().min(2).max(120),
  contact_name: z.string().max(120).optional().or(z.literal("")),
  email: z.string().email().max(120).optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  ref_code: z.string().max(60).optional().or(z.literal("")),
  promo_code: z.string().max(60).optional().or(z.literal("")),
  promo_discount_percent: z.number().min(0).max(100).nullable().optional(),
  commission_rate: z.number().min(0).max(100).default(8),
  level: z.enum(["standard", "performance", "vip"]).default("standard"),
  store_model: z.enum(["showroom", "b2b", "corner"]).nullable().optional(),
  city: z.string().max(80).optional().or(z.literal("")),
  country: z.string().max(80).optional().or(z.literal("")),
  address: z.string().max(300).optional().or(z.literal("")),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
  website: z.string().max(200).optional().or(z.literal("")),
  social: z.string().max(200).optional().or(z.literal("")),
  is_published: z.boolean().default(false),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const status = searchParams.get("status");

  const admin = createAdminClient();
  let query = admin.from("showcase_resellers").select("*").order("created_at", { ascending: false });
  if (type === "affiliate" || type === "store") query = query.eq("type", type);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ resellers: data || [] });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  const admin = createAdminClient();

  // Codes normalisés en majuscules.
  const refCode = normalizeCode(d.ref_code) || null;
  const promoCode = normalizeCode(d.promo_code) || null;

  // Unicité ref/promo (contrainte UNIQUE en base, mais on donne un message clair).
  if (refCode || promoCode) {
    const filters: string[] = [];
    if (refCode) filters.push(`ref_code.eq.${refCode}`);
    if (promoCode) filters.push(`promo_code.eq.${promoCode}`);
    const { data: dupe } = await admin
      .from("showcase_resellers")
      .select("id")
      .or(filters.join(","))
      .limit(1);
    if (dupe && dupe.length > 0) {
      return NextResponse.json({ error: "Ce code ref ou promo est déjà utilisé." }, { status: 409 });
    }
  }

  const { data: created, error } = await admin
    .from("showcase_resellers")
    .insert({
      type: d.type,
      status: d.status,
      name: d.name,
      contact_name: d.contact_name || null,
      email: d.email || null,
      phone: d.phone || null,
      ref_code: refCode,
      promo_code: promoCode,
      promo_discount_percent: d.promo_discount_percent ?? null,
      commission_rate: d.commission_rate,
      level: d.level,
      store_model: d.store_model ?? null,
      city: d.city || null,
      country: d.country || null,
      address: d.address || null,
      lat: d.lat ?? null,
      lng: d.lng ?? null,
      website: d.website || null,
      social: d.social || null,
      is_published: d.is_published,
      notes: d.notes || null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ reseller: created }, { status: 201 });
}
