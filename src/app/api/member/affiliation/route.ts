import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAffiliateStats } from "@/lib/resellers";
import { getMemberIdFromRequest } from "@/lib/member/auth";

export async function GET(request: NextRequest) {
  const memberId = await getMemberIdFromRequest(request);
  if (!memberId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const admin = createAdminClient();
  const { data: reseller } = await admin
    .from("showcase_resellers")
    .select("*")
    .eq("member_id", memberId)
    .eq("type", "affiliate")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!reseller || !(reseller as any).ref_code) {
    return NextResponse.json({ affiliate: null });
  }

  const stats = await getAffiliateStats(admin, (reseller as any).ref_code);
  return NextResponse.json({
    affiliate: {
      id: (reseller as any).id,
      name: (reseller as any).name,
      status: (reseller as any).status,
      ...stats,
    },
  });
}
