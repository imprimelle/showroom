import { NextResponse } from "next/server";
import { getPublicStores } from "@/lib/resellers";

/**
 * GET /api/resellers/stores — points de vente partenaires publiés (carte publique).
 * Ne renvoie que les champs publics (nom, ville, adresse, coordonnées, modèle, site).
 */
export async function GET() {
  const stores = await getPublicStores();
  return NextResponse.json({ stores });
}
