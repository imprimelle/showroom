import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/admin/products — crée une ébauche de produit (nom placeholder unique).
 * Le slug est auto-généré par le trigger `trg_product_slug` (BEFORE INSERT) depuis `name`.
 * Renvoie `{ id }` ; le client redirige vers `/admin/produits/[id]` pour compléter la fiche.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = createAdminClient();

    // Nom placeholder unique : garantit un slug UNIQUE (contrainte `products_slug_unique`)
    // tant que l'utilisateur n'a pas renommé le produit. Renommable ensuite dans l'éditeur.
    const name = `Nouveau produit ${randomUUID().slice(0, 6)}`;

    const { data, error } = await admin
      .from("products")
      .insert({ name, is_published: false })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: data.id });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
