import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * PATCH /api/admin/reviews/[id] — modifie un avis (contenu, note, auteur, pays, …)
 * ou bascule son statut masqué/visible (`hidden`). Le champ `<>` est interdit.
 * DELETE /api/admin/reviews/[id] — supprime définitivement un avis.
 */

/** Retire les chevrons `<` `>` (interdits) et normalise les espaces. */
function stripAngleBrackets(value: string): string {
  return value.replace(/[<>]/g, "").trim();
}

const patchSchema = z.object({
  author_name: z.string().min(2).max(60).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().max(120).nullable().optional(),
  content: z.string().min(10).max(2000).optional(),
  verified: z.boolean().optional(),
  order_number: z.string().max(40).nullable().optional(),
  country: z.string().max(60).nullable().optional(),
  product_slug: z.string().min(1).max(200).optional(),
  hidden: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const admin = createAdminClient();
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };

    if (typeof parsed.data.author_name === "string") {
      updates.author_name = stripAngleBrackets(parsed.data.author_name);
    }
    if (typeof parsed.data.rating === "number") updates.rating = parsed.data.rating;
    if (parsed.data.title !== undefined) {
      updates.title = parsed.data.title === null ? null : stripAngleBrackets(parsed.data.title);
    }
    if (typeof parsed.data.content === "string") {
      updates.content = stripAngleBrackets(parsed.data.content);
    }
    if (typeof parsed.data.verified === "boolean") updates.verified = parsed.data.verified;
    if (parsed.data.order_number !== undefined) {
      updates.order_number =
        parsed.data.order_number === null ? null : parsed.data.order_number.trim();
    }
    if (parsed.data.country !== undefined) {
      updates.country =
        parsed.data.country === null ? null : stripAngleBrackets(parsed.data.country);
    }
    if (typeof parsed.data.hidden === "boolean") updates.hidden = parsed.data.hidden;

    // Changement de produit : on récupère le nom réel (dénormalisé dans `product_name`).
    if (typeof parsed.data.product_slug === "string") {
      const { data: product } = await admin
        .from("products")
        .select("name")
        .eq("slug", parsed.data.product_slug)
        .single();
      if (!product) {
        return NextResponse.json({ error: "Produit introuvable" }, { status: 400 });
      }
      updates.product_slug = parsed.data.product_slug;
      updates.product_name = (product as { name: string }).name;
    }

    const { data: updated, error } = await admin
      .from("showcase_reviews")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidateTag("reviews", "max");

    return NextResponse.json({ review: updated });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("showcase_reviews").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidateTag("reviews", "max");

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
