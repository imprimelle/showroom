import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const reviewSchema = z.object({
  product_slug: z.string().min(1).max(200),
  author_name: z.string().min(2).max(60),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional().nullable(),
  content: z.string().min(10).max(2000),
  order_number: z.string().max(40).optional().nullable(),
});

// Rate limiting simple en mémoire (par IP).
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const rec = rateLimitMap.get(ip);
  if (!rec || now > rec.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return true;
  }
  if (rec.count >= 3) return false;
  rec.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Trop d'avis envoyés. Veuillez patienter 10 minutes." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
  }

  const { product_slug, author_name, rating, title, content, order_number } = parsed.data;

  try {
    const admin = createAdminClient();

    // Vérifie que le produit existe (anti-falsification + récupère le nom réel).
    const { data: product } = await admin
      .from("products")
      .select("name")
      .eq("slug", product_slug)
      .single();

    if (!product) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 400 });
    }

    const orderRef = order_number?.trim() || null;
    const verified = !!orderRef;

    const { data: review, error } = await admin
      .from("showcase_reviews")
      .insert({
        product_slug,
        product_name: (product as { name: string }).name,
        author_name: author_name.trim(),
        rating,
        title: title?.trim() || null,
        content: content.trim(),
        verified,
        order_number: verified ? orderRef : null,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Review insert error:", error);
      return NextResponse.json({ error: "Erreur lors de l'enregistrement de l'avis" }, { status: 500 });
    }

    return NextResponse.json({ review }, { status: 201 });
  } catch (err) {
    console.error("Review API error:", err);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
