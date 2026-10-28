import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/utils";
import { verifyOtp } from "@/lib/member/otp";
import { signMemberToken, setMemberCookie, getMemberIdFromRequest } from "@/lib/member/auth";
import { linkMemberByPhone } from "@/lib/member/link";

const schema = z.object({
  phone: z.string().min(6).max(30),
  code: z.string().min(4).max(10),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const phone = normalizePhone(parsed.data.phone);
  const code = parsed.data.code.trim();
  if (!(await verifyOtp(phone, code))) {
    return NextResponse.json({ error: "Code invalide ou expiré." }, { status: 400 });
  }

  const admin = createAdminClient();
  const currentId = await getMemberIdFromRequest(request);

  if (currentId) {
    // Mode liaison : attache ce téléphone au membre déjà connecté (ex. après login social).
    const { data: existing } = await admin
      .from("showroom_members")
      .select("id")
      .eq("phone", phone)
      .maybeSingle();
    if (existing && (existing as { id: string }).id !== currentId) {
      return NextResponse.json({ error: "Ce numéro est déjà lié à un autre compte." }, { status: 409 });
    }
    await admin.from("showroom_members").update({ phone }).eq("id", currentId);
    await linkMemberByPhone(currentId, phone);
    return NextResponse.json({ linked: true });
  }

  // Mode connexion : trouve ou crée le membre par téléphone.
  let memberId: string;
  const { data: existingMember } = await admin
    .from("showroom_members")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();

  if (existingMember) {
    memberId = (existingMember as { id: string }).id;
  } else {
    const { data: created } = await admin
      .from("showroom_members")
      .insert({ phone })
      .select("id")
      .single();
    memberId = (created as { id: string }).id;
  }

  await admin.from("showroom_members").update({ last_login_at: new Date().toISOString() }).eq("id", memberId);
  await linkMemberByPhone(memberId, phone);

  const token = await signMemberToken(memberId);
  await setMemberCookie(token);
  return NextResponse.json({ member_id: memberId });
}
