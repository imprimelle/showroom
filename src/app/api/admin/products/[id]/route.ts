import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { is_published, popularity, showcase } = body;

    const admin = createAdminClient();
    const updates: Record<string, any> = {};

    if (typeof is_published === "boolean") updates.is_published = is_published;
    if (typeof popularity === "number") {
      updates.showcase = { popularity };
    }

    if (showcase && typeof showcase === "object") {
      // Merge showcase JSONB
      const { data: existing } = await admin.from("products").select("showcase").eq("id", id).single();
      const merged = { ...((existing?.showcase as any) || {}), ...showcase };
      if (typeof popularity === "number") merged.popularity = popularity;
      updates.showcase = merged;
    }

    const { error } = await admin.from("products").update(updates).eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
