import { NextRequest, NextResponse } from "next/server";
import { facebookAuthUrl, facebookConfigured } from "@/lib/member/oauth";

export async function GET(request: NextRequest) {
  if (!facebookConfigured()) {
    return NextResponse.redirect(new URL("/compte/connexion?error=oauth", request.url));
  }
  const next = request.nextUrl.searchParams.get("next") || "/compte";
  const nonce = crypto.randomUUID();
  const response = NextResponse.redirect(facebookAuthUrl(nonce));
  response.cookies.set("member_oauth_state", `${nonce}|${next}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return response;
}
