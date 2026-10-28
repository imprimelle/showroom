import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { normalizePhone } from "@/lib/utils";
import { checkOtpRateLimit, issueOtp, sendOtp } from "@/lib/member/otp";

const schema = z.object({ phone: z.string().min(6).max(30) });

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Numéro invalide" }, { status: 400 });

  const phone = normalizePhone(parsed.data.phone);
  if (phone.length < 8) return NextResponse.json({ error: "Numéro invalide" }, { status: 400 });

  if (!checkOtpRateLimit(phone)) {
    return NextResponse.json({ error: "Trop de demandes. Réessayez plus tard." }, { status: 429 });
  }

  const res = await issueOtp(phone);
  if ("error" in res) return NextResponse.json({ error: res.error }, { status: 500 });

  await sendOtp(phone, res.code);
  return NextResponse.json({ ok: true });
}
