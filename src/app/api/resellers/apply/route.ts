import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/resellers/apply — candidature revendeur (affilié ou point de vente).
 * Crée un revendeur en statut `pending` (validation manuelle admin).
 * Rate-limitée par IP (anti-spam) + validation Zod.
 */

const applySchema = z.object({
  type: z.enum(["affiliate", "store"]),
  name: z.string().min(2).max(120),
  contact_name: z.string().min(2).max(120).optional(),
  phone: z
    .string()
    .trim()
    .min(6, "Numéro invalide")
    .max(30)
    .regex(/^\+?[0-9\s\-().]{6,30}$/, "Numéro invalide")
    .transform((v) => v.replace(/[^\d+]/g, "")),
  // Point de vente
  city: z.string().max(80).optional().or(z.literal("")),
  country: z.string().max(80).optional().or(z.literal("")),
  address: z.string().max(300).optional().or(z.literal("")),
  store_model: z.enum(["showroom", "b2b", "corner"]).optional(),
  website: z.string().max(200).optional().or(z.literal("")),
  social: z.string().max(200).optional().or(z.literal("")),
  message: z.string().max(1000).optional().or(z.literal("")),
});

function stripAngleBrackets(value: string): string {
  return value.replace(/[<>]/g, "").trim();
}

// Rate limiting simple en mémoire (par IP).
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const rec = rateLimitMap.get(ip);
  if (!rec || now > rec.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (rec.count >= 3) return false;
  rec.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Trop de candidatures. Veuillez réessayer plus tard." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const parsed = applySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const d = parsed.data;

  try {
    const admin = createAdminClient();

    // Anti-doublon : une candidature active/pending avec le même téléphone
    // (même type) ne doit pas être re-soumise en boucle.
    const existingFilters: string[] = [];
    if (d.phone) existingFilters.push(`phone.eq.${d.phone}`);

    if (existingFilters.length > 0) {
      const { data: dupe } = await admin
        .from("showcase_resellers")
        .select("id")
        .or(existingFilters.join(","))
        .in("status", ["pending", "active"])
        .limit(1);
      if (dupe && dupe.length > 0) {
        return NextResponse.json(
          { error: "Une candidature est déjà en cours avec ces coordonnées." },
          { status: 409 }
        );
      }
    }

    const { error } = await admin.from("showcase_resellers").insert({
      type: d.type,
      status: "pending",
      name: stripAngleBrackets(d.name),
      contact_name: d.contact_name ? stripAngleBrackets(d.contact_name) : null,
      phone: d.phone,
      city: d.city ? stripAngleBrackets(d.city) : null,
      country: d.country ? stripAngleBrackets(d.country) : null,
      address: d.address ? stripAngleBrackets(d.address) : null,
      store_model: d.store_model ?? null,
      website: d.website ? stripAngleBrackets(d.website) : null,
      social: d.social ? stripAngleBrackets(d.social) : null,
      notes: d.message ? stripAngleBrackets(d.message) : null,
      // Par défaut : affilié standard 8 %, point de vente non publié.
      commission_rate: 8,
      level: "standard",
      is_published: false,
    });

    if (error) {
      console.error("Reseller apply insert error:", error);
      return NextResponse.json(
        { error: "Erreur lors de l'envoi de la candidature." },
        { status: 500 }
      );
    }

    // Notification WhatsApp (fire-and-forget, best-effort).
    try {
      const waUrl = process.env.WHATSAPP_QUEUE_URL;
      if (waUrl) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        await fetch(waUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "new_reseller_application",
            reseller_type: d.type,
            name: stripAngleBrackets(d.name),
            phone: d.phone,
            city: d.city || null,
            message: d.message || null,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
      }
    } catch {
      /* fire & forget */
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("Reseller apply API error:", err);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
