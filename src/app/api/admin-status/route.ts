import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { JWT_SECRET } from "@/lib/admin/secret";

/**
 * GET /api/admin-status — renvoie { isAdmin } selon la présence d'un cookie
 * `admin_token` valide. Route volontairement HORS du préfixe protégé
 * `/api/admin/` : le client public l'appelle pour savoir s'il faut afficher
 * la barre d'édition inline. Ne fuite aucune donnée, uniquement un booléen.
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token) return NextResponse.json({ isAdmin: false });

  try {
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.json({ isAdmin: true });
  } catch {
    return NextResponse.json({ isAdmin: false });
  }
}
