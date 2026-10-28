import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMemberIdFromRequest } from "@/lib/member/auth";

export async function GET(request: NextRequest) {
  const memberId = await getMemberIdFromRequest(request);
  if (!memberId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const admin = createAdminClient();
  const { data: member } = await admin
    .from("showroom_members")
    .select("id, name, phone, email, avatar_url, oauth_provider")
    .eq("id", memberId)
    .single();
  if (!member) return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });

  const { data: resellers } = await admin
    .from("showcase_resellers")
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false });
  const list = (resellers as any[]) || [];
  const affiliateRow = list.find((r) => r.type === "affiliate") || null;
  const storeRow = list.find((r) => r.type === "store") || null;

  const { count: ordersCount } = await admin
    .from("showcase_orders")
    .select("id", { count: "exact", head: true })
    .eq("member_id", memberId);

  return NextResponse.json({
    member,
    affiliate: affiliateRow
      ? {
          id: affiliateRow.id,
          name: affiliateRow.name,
          status: affiliateRow.status,
          ref_code: affiliateRow.ref_code,
          promo_code: affiliateRow.promo_code,
          commission_rate: affiliateRow.commission_rate,
        }
      : null,
    store: storeRow
      ? {
          id: storeRow.id,
          name: storeRow.name,
          status: storeRow.status,
          city: storeRow.city,
          country: storeRow.country,
          address: storeRow.address,
          lat: storeRow.lat,
          lng: storeRow.lng,
          is_published: storeRow.is_published,
          store_model: storeRow.store_model,
          website: storeRow.website,
          social: storeRow.social,
        }
      : null,
    orders_count: ordersCount ?? 0,
  });
}
