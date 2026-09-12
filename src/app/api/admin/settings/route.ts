import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PUT(request: NextRequest) {
  try {
    const { data } = await request.json();
    const admin = createAdminClient();
    const { error } = await admin.from("showcase_settings").update({ data, updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function GET() {
  const admin = createAdminClient();
  const { data, error } = await admin.from("showcase_settings").select("data").eq("id", 1).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data?.data || {});
}
