import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Upload d'un média (image ou vidéo) vers Supabase Storage.
 * Protégé par le middleware (/api/admin/*).
 * Attend un FormData : { file: File }.
 * Retourne { url, type }.
 */
export async function POST(request: NextRequest) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Requête invalide (multipart attendu)" }, { status: 400 });
  }

  const file = form.get("file") as File | null;
  if (!file || file.size === 0) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }

  try {
    const isVideo = file.type.startsWith("video/") || /\.(mp4|webm|mov|m4v|ogv)$/i.test(file.name);
    const bucket = isVideo ? "videos" : "images";

    const cleanExt =
      (file.name.split(".").pop() || (isVideo ? "mp4" : "jpg")).replace(/[^a-zA-Z0-9]/g, "").slice(0, 6) ||
      (isVideo ? "mp4" : "jpg");
    const path = `public/${crypto.randomUUID()}.${cleanExt}`;

    const admin = createAdminClient();
    const arrayBuffer = await file.arrayBuffer();

    const { error } = await admin.storage.from(bucket).upload(path, arrayBuffer, {
      contentType: file.type || (isVideo ? "video/mp4" : "image/jpeg"),
      upsert: true,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data } = admin.storage.from(bucket).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl, type: isVideo ? "video" : "image" });
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
