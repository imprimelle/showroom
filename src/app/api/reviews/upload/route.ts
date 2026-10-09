import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_SIZE = 5 * 1024 * 1024; // 5 Mo
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Rate limiting simple en mémoire (par IP).
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const rec = rateLimitMap.get(ip);
  if (!rec || now > rec.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return true;
  }
  if (rec.count >= 10) return false;
  rec.count++;
  return true;
}

/**
 * Upload d'une photo d'avis vers Supabase Storage (bucket « images », dossier public/reviews).
 * Route publique (les avis sont déposés par des visiteurs non authentifiés).
 * Attend un FormData : { file: File }. Retourne { url }.
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Trop d'envois. Veuillez patienter 10 minutes." }, { status: 429 });
  }

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
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Image trop lourde (5 Mo maximum)" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Seules les images (JPEG, PNG, WebP, GIF) sont acceptées" }, { status: 400 });
  }

  try {
    const cleanExt = (file.name.split(".").pop() || "jpg").replace(/[^a-zA-Z0-9]/g, "").slice(0, 6) || "jpg";
    const path = `public/reviews/${crypto.randomUUID()}.${cleanExt}`;

    const admin = createAdminClient();
    const arrayBuffer = await file.arrayBuffer();

    const { error } = await admin.storage.from("images").upload(path, arrayBuffer, {
      contentType: file.type || "image/jpeg",
      upsert: true,
    });

    if (error) {
      console.error("Review photo upload error:", error);
      return NextResponse.json({ error: "Erreur lors de l'envoi de la photo" }, { status: 500 });
    }

    const { data } = admin.storage.from("images").getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (e) {
    console.error("Review photo upload error:", e);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
