import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { MEMBER_JWT_SECRET, MEMBER_COOKIE } from "./secret";

const TOKEN_DURATION = "30d"; // sessions longues pour l'espace membre

export async function signMemberToken(memberId: string): Promise<string> {
  return new SignJWT({ role: "member" })
    .setSubject(memberId)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_DURATION)
    .sign(MEMBER_JWT_SECRET);
}

/** Renvoie l'id du membre si le token est valide, sinon null. */
export async function verifyMemberToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, MEMBER_JWT_SECRET);
    if (payload.role !== "member" || !payload.sub) return null;
    return payload.sub as string;
  } catch {
    return null;
  }
}

export async function setMemberCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(MEMBER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });
}

export async function clearMemberCookie(): Promise<void> {
  const store = await cookies();
  store.delete(MEMBER_COOKIE);
}

/** Extrait l'id membre depuis la requête (route handler). */
export async function getMemberIdFromRequest(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get(MEMBER_COOKIE)?.value;
  if (!token) return null;
  return verifyMemberToken(token);
}
