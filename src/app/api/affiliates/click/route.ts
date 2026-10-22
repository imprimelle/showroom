import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeCode } from "@/lib/resellers";

/**
 * POST /api/affiliates/click — enregistre un clic sur un lien d'affiliation `?ref=`.
 * Fire-and-forget depuis le composant ReferralCapture (statistiques de portée).
 * N'expose aucune donnée : seuls le code et le chemin d'atterrissage sont stockés.
 */

const schema = z.object({
  ref: z.string().min(1).max(60),
  path: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: true });
  }

  const code = normalizeCode(parsed.data.ref);
  if (!code) return NextResponse.json({ ok: true });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const ua = request.headers.get("user-agent") || null;

  try {
    const admin = createAdminClient();
    await admin.from("showcase_affiliate_clicks").insert({
      ref_code: code,
      landing_path: parsed.data.path || null,
      ip,
      user_agent: ua,
    });
  } catch {
    /* best-effort : un échec de tracking ne doit jamais bloquer */
  }

  return NextResponse.json({ ok: true });
}
