import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAffiliateStats, normalizeCode } from "@/lib/resellers";

/**
 * GET /api/affiliates/[code] — mini-dashboard affilié (stats agrégées).
 * Accès par code ref (aucune donnée sensible : pas d'email/phone client).
 * Renvoie 404 si le code n'existe pas / n'est pas actif.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const refCode = normalizeCode(code);
  if (!refCode) {
    return NextResponse.json({ error: "Code invalide" }, { status: 400 });
  }

  const supabase = createServerClient();
  const stats = await getAffiliateStats(supabase, refCode);
  if (!stats) {
    return NextResponse.json({ error: "Affilié introuvable" }, { status: 404 });
  }

  return NextResponse.json({ affiliate: stats });
}
