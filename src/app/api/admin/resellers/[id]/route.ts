import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeCode } from "@/lib/resellers";

/**
 * PATCH /api/admin/resellers/[id] — modifie un revendeur (statut, codes, commission, coordonnées…).
 * DELETE /api/admin/resellers/[id] — supprime un revendeur.
 */

const patchSchema = z.object({
  status: z.enum(["pending", "active", "suspended", "rejected"]).optional(),
  name: z.string().min(2).max(120).optional(),
  contact_name: z.string().max(120).nullable().optional(),
  email: z.string().email().max(120).nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  ref_code: z.string().max(60).nullable().optional(),
  promo_code: z.string().max(60).nullable().optional(),
  promo_discount_percent: z.number().min(0).max(100).nullable().optional(),
  commission_rate: z.number().min(0).max(100).optional(),
  level: z.enum(["standard", "performance", "vip"]).optional(),
  store_model: z.enum(["showroom", "b2b", "corner"]).nullable().optional(),
  city: z.string().max(80).nullable().optional(),
  country: z.string().max(80).nullable().optional(),
  address: z.string().max(300).nullable().optional(),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
  website: z.string().max(200).nullable().optional(),
  social: z.string().max(200).nullable().optional(),
  is_published: z.boolean().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  const admin = createAdminClient();

  // Vérifie l'unicité des codes si fournis.
  if (d.ref_code !== undefined || d.promo_code !== undefined) {
    const refCode = d.ref_code !== undefined && d.ref_code !== null ? normalizeCode(d.ref_code) : null;
    const promoCode = d.promo_code !== undefined && d.promo_code !== null ? normalizeCode(d.promo_code) : null;
    if (refCode || promoCode) {
      const filters: string[] = [];
      if (refCode) filters.push(`ref_code.eq.${refCode}`);
      if (promoCode) filters.push(`promo_code.eq.${promoCode}`);
      const { data: dupe } = await admin
        .from("showcase_resellers")
        .select("id")
        .or(filters.join(","))
        .neq("id", id)
        .limit(1);
      if (dupe && dupe.length > 0) {
        return NextResponse.json({ error: "Ce code ref ou promo est déjà utilisé." }, { status: 409 });
      }
    }
  }

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (d.status !== undefined) updates.status = d.status;
  if (d.name !== undefined) updates.name = d.name;
  if (d.contact_name !== undefined) updates.contact_name = d.contact_name;
  if (d.email !== undefined) updates.email = d.email;
  if (d.phone !== undefined) updates.phone = d.phone;
  if (d.ref_code !== undefined) updates.ref_code = d.ref_code ? normalizeCode(d.ref_code) : null;
  if (d.promo_code !== undefined) updates.promo_code = d.promo_code ? normalizeCode(d.promo_code) : null;
  if (d.promo_discount_percent !== undefined) updates.promo_discount_percent = d.promo_discount_percent;
  if (d.commission_rate !== undefined) updates.commission_rate = d.commission_rate;
  if (d.level !== undefined) updates.level = d.level;
  if (d.store_model !== undefined) updates.store_model = d.store_model;
  if (d.city !== undefined) updates.city = d.city;
  if (d.country !== undefined) updates.country = d.country;
  if (d.address !== undefined) updates.address = d.address;
  if (d.lat !== undefined) updates.lat = d.lat;
  if (d.lng !== undefined) updates.lng = d.lng;
  if (d.website !== undefined) updates.website = d.website;
  if (d.social !== undefined) updates.social = d.social;
  if (d.is_published !== undefined) updates.is_published = d.is_published;
  if (d.notes !== undefined) updates.notes = d.notes;

  const { data: updated, error } = await admin
    .from("showcase_resellers")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Notification WhatsApp au candidat (approbation / rejet) — best-effort.
  if (d.status === "active" || d.status === "rejected") {
    try {
      const waUrl = process.env.WHATSAPP_QUEUE_URL;
      const u = updated as Record<string, any> | null;
      if (waUrl && u?.phone) {
        const site = (process.env.SITE_URL || "https://imprimelle.com").replace(/\/+$/, "");
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        await fetch(waUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "reseller_decision",
            phone: u.phone,
            name: u.name,
            decision: d.status,
            reseller_type: u.type,
            ref_code: u.ref_code ?? null,
            promo_code: u.promo_code ?? null,
            dashboard_url:
              u.type === "affiliate" ? `${site}/compte/affiliation` : `${site}/compte/boutique`,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
      }
    } catch {
      /* best-effort */
    }
  }

  return NextResponse.json({ reseller: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const admin = createAdminClient();
  const { error } = await admin.from("showcase_resellers").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
