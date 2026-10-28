import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/utils";
import { MEMBER_JWT_SECRET } from "./secret";

/**
 * OTP par téléphone (livré via le bridge WhatsApp, best-effort).
 * Le code est hashé en base (jamais stocké en clair).
 */

function hashOtp(phoneDigits: string, code: string): string {
  const secret = new TextDecoder().decode(MEMBER_JWT_SECRET);
  return createHash("sha256").update(`${phoneDigits}:${code}:${secret}`).digest("hex");
}

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 chiffres
}

/** Rate-limit en mémoire : max 5 demandes / 15 min / téléphone. */
const rateLimit = new Map<string, { count: number; resetAt: number }>();
export function checkOtpRateLimit(phoneDigits: string): boolean {
  const now = Date.now();
  const rec = rateLimit.get(phoneDigits);
  if (!rec || now > rec.resetAt) {
    rateLimit.set(phoneDigits, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }
  if (rec.count >= 5) return false;
  rec.count++;
  return true;
}

/** Envoie le code OTP via le bridge WhatsApp (fire-and-forget). */
export async function sendOtp(phoneDigits: string, code: string): Promise<boolean> {
  const waUrl = process.env.WHATSAPP_QUEUE_URL;
  if (!waUrl) return false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    await fetch(waUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "member_otp", phone: phoneDigits, code }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return true;
  } catch {
    return false;
  }
}

/** Crée un OTP en base et renvoie le code (à envoyer). */
export async function issueOtp(phoneDigits: string): Promise<{ code: string } | { error: string }> {
  const admin = createAdminClient();
  const code = generateOtp();

  // Invalide les anciens codes actifs pour ce téléphone.
  await admin
    .from("showroom_otp")
    .update({ consumed_at: new Date().toISOString() })
    .eq("phone", phoneDigits)
    .is("consumed_at", null);

  const { error } = await admin.from("showroom_otp").insert({
    phone: phoneDigits,
    code_hash: hashOtp(phoneDigits, code),
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  });

  if (error) return { error: "Erreur lors de la génération du code." };
  return { code };
}

/** Vérifie un code OTP. Renvoie true si valide et non consommé. */
export async function verifyOtp(phoneDigits: string, code: string): Promise<boolean> {
  const admin = createAdminClient();
  const hash = hashOtp(phoneDigits, code);

  const { data } = await admin
    .from("showroom_otp")
    .select("id, attempts, expires_at, consumed_at")
    .eq("phone", phoneDigits)
    .eq("code_hash", hash)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return false;

  const otp = data as { id: string; attempts: number; expires_at: string; consumed_at: string | null };
  if (otp.consumed_at) return false;
  if (new Date(otp.expires_at).getTime() < Date.now()) return false;

  // Consomme le code (usage unique).
  await admin.from("showroom_otp").update({ consumed_at: new Date().toISOString() }).eq("id", otp.id);
  return true;
}

export { normalizePhone };
