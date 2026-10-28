import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Liaison d'un membre à ses commandes / revendeurs par téléphone normalisé.
 * Le téléphone peut être stocké avec ou sans « + » → on couvre les deux variantes.
 */
export async function linkMemberByPhone(memberId: string, phoneDigits: string): Promise<void> {
  const admin = createAdminClient();
  const variants = [phoneDigits, `+${phoneDigits}`];

  for (const v of variants) {
    if (!v) continue;
    await admin.from("showcase_orders").update({ member_id: memberId }).eq("customer_phone", v).is("member_id", null);
    await admin.from("showcase_resellers").update({ member_id: memberId }).eq("phone", v).is("member_id", null);
  }
}
