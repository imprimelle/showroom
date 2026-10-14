import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Ingestion d'événements analytics first-party (table `showroom_events`).
 * Écrit via le service role (bypass RLS). Aucune lecture publique.
 * Payload attendu (envoyé par `src/lib/first-party.ts`) :
 *   { session_id, event, path?, referrer?, product_slug?, data? }
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const raw = (body ?? {}) as Record<string, unknown>;

  const session_id = String(raw.session_id ?? "").slice(0, 64);
  const event = String(raw.event ?? "").slice(0, 64);
  if (!session_id || !event) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const path = raw.path ? String(raw.path).slice(0, 512) : null;
  const referrer = raw.referrer ? String(raw.referrer).slice(0, 512) : null;
  const product_slug = raw.product_slug ? String(raw.product_slug).slice(0, 256) : null;
  const data = raw.data && typeof raw.data === "object" ? raw.data : null;

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("showroom_events").insert({
      session_id,
      event,
      path,
      referrer,
      product_slug,
      data,
    });
    if (error) {
      return NextResponse.json({ ok: false }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
