import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMemberIdFromRequest } from "@/lib/member/auth";

const patchSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  contact_name: z.string().max(120).nullable().optional(),
  city: z.string().max(80).nullable().optional(),
  country: z.string().max(80).nullable().optional(),
  address: z.string().max(300).nullable().optional(),
  website: z.string().max(200).nullable().optional(),
  social: z.string().max(200).nullable().optional(),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
});

export async function GET(request: NextRequest) {
  const memberId = await getMemberIdFromRequest(request);
  if (!memberId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("showcase_resellers")
    .select("*")
    .eq("member_id", memberId)
    .eq("type", "store")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ store: data || null });
}

export async function PATCH(request: NextRequest) {
  const memberId = await getMemberIdFromRequest(request);
  if (!memberId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  const d = parsed.data;

  const admin = createAdminClient();
  const { data: store } = await admin
    .from("showcase_resellers")
    .select("id")
    .eq("member_id", memberId)
    .eq("type", "store")
    .limit(1)
    .maybeSingle();
  if (!store) return NextResponse.json({ error: "Point de vente introuvable" }, { status: 404 });

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (d.name !== undefined) updates.name = d.name;
  if (d.contact_name !== undefined) updates.contact_name = d.contact_name;
  if (d.city !== undefined) updates.city = d.city;
  if (d.country !== undefined) updates.country = d.country;
  if (d.address !== undefined) updates.address = d.address;
  if (d.website !== undefined) updates.website = d.website;
  if (d.social !== undefined) updates.social = d.social;
  if (d.lat !== undefined) updates.lat = d.lat;
  if (d.lng !== undefined) updates.lng = d.lng;

  const { error } = await admin
    .from("showcase_resellers")
    .update(updates)
    .eq("id", (store as { id: string }).id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
