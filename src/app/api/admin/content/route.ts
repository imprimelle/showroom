import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/admin/content — liste toutes les surcartes (clé → valeur).
 * Protégé par le middleware (`admin_token` requis).
 */
export async function GET() {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.from("showcase_content").select("key, value");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const map: Record<string, string> = {};
    for (const row of data || []) map[row.key] = row.value ?? "";
    return NextResponse.json(map);
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/content — upsert d'une surcarte { key, value }.
 * `value` vide = suppression de la surcarte (retour au texte par défaut).
 * Protégé par le middleware (`admin_token` requis).
 */
export async function PUT(request: NextRequest) {
  try {
    const { key, value } = await request.json();
    if (!key || typeof key !== "string") {
      return NextResponse.json({ error: "Clé requise" }, { status: 400 });
    }
    const admin = createAdminClient();

    if (typeof value === "string" && value.length > 0) {
      const { error } = await admin
        .from("showcase_content")
        .upsert({ key, value, updated_at: new Date().toISOString() });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      // Valeur vide / null : on retire la surcarte → le composant retombe sur
      // son texte par défaut (et ses animations éventuelles).
      await admin.from("showcase_content").delete().eq("key", key);
    }

    revalidateTag("showcase-content", "max");
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
