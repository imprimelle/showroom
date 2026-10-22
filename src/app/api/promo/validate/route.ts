import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { resolveAffiliateByPromo, normalizeCode } from "@/lib/resellers";

/**
 * POST /api/promo/validate — valide un code promo d'affiliation côté client.
 * Renvoie le pourcentage de remise (le montant est calculé côté client sur le
 * total courant, puis REVALIDÉ côté serveur au moment de la commande).
 * Ne renvoie jamais de données sensibles : juste `{ valid, code, percent }`.
 */

const schema = z.object({
  code: z.string().min(1).max(60),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const code = normalizeCode(parsed.data.code);
  if (!code) return NextResponse.json({ valid: false });

  const supabase = createServerClient();
  const affiliate = await resolveAffiliateByPromo(supabase, code);

  const percent = Number(affiliate?.promo_discount_percent);
  if (!affiliate || !Number.isFinite(percent) || percent <= 0 || percent > 100) {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({ valid: true, code: affiliate.promo_code ?? code, percent });
}
