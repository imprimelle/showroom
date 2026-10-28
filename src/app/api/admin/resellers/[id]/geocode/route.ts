import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { geocodeAddress } from "@/lib/geocode";

/**
 * POST /api/admin/resellers/[id]/geocode — géolocalise un point de vente
 * depuis son adresse et met à jour lat/lng.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const admin = createAdminClient();
  const { data: reseller } = await admin
    .from("showcase_resellers")
    .select("address, city, country")
    .eq("id", id)
    .single();

  if (!reseller) {
    return NextResponse.json({ error: "Revendeur introuvable" }, { status: 404 });
  }

  const r = reseller as { address?: string | null; city?: string | null; country?: string | null };
  const geo = await geocodeAddress(r.address || "", r.city || "", r.country || "");
  if (!geo) {
    return NextResponse.json(
      { error: "Adresse introuvable. Renseignez lat/lng manuellement." },
      { status: 422 }
    );
  }

  const { error } = await admin
    .from("showcase_resellers")
    .update({ lat: geo.lat, lng: geo.lng, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lat: geo.lat, lng: geo.lng });
}
