import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || process.env.ADMIN_PIN || "showroom-admin-secret-change-me"
);

// Simple in-memory rate limiting for login
const loginAttempts = new Map<string, { count: number; blockedUntil: number }>();

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  // Rate limit check
  const attempt = loginAttempts.get(ip);
  if (attempt && attempt.blockedUntil > Date.now()) {
    return NextResponse.json({ error: "Trop de tentatives. Réessayez plus tard." }, { status: 429 });
  }

  try {
    const { pin } = await request.json();
    const validPin = process.env.ADMIN_PIN;

    if (!validPin || pin !== validPin) {
      const current = loginAttempts.get(ip) || { count: 0, blockedUntil: 0 };
      current.count++;
      if (current.count >= 5) {
        current.blockedUntil = Date.now() + 60 * 60 * 1000; // Block 1h
        loginAttempts.set(ip, current);
        return NextResponse.json({ error: "Compte bloqué. Réessayez dans 1 heure." }, { status: 429 });
      }
      loginAttempts.set(ip, current);
      return NextResponse.json({ error: "PIN incorrect" }, { status: 401 });
    }

    // Clear attempts on success
    loginAttempts.delete(ip);

    // Create JWT
    const token = await new SignJWT({ role: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(JWT_SECRET);

    const response = NextResponse.json({ success: true });
    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
