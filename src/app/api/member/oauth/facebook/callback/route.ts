import { NextRequest, NextResponse } from "next/server";
import { exchangeFacebookCode, upsertOAuthMember, siteUrl } from "@/lib/member/oauth";
import { signMemberToken } from "@/lib/member/auth";
import { MEMBER_COOKIE } from "@/lib/member/secret";

export async function GET(request: NextRequest) {
  const fail = NextResponse.redirect(new URL("/compte/connexion?error=oauth", siteUrl()));
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const cookie = request.cookies.get("member_oauth_state")?.value;

  if (!code || !state || !cookie) return fail;
  const [nonce, next] = cookie.split("|");
  if (nonce !== state) return fail;

  const profile = await exchangeFacebookCode(code);
  if (!profile) return fail;

  const memberId = await upsertOAuthMember(profile);
  if (!memberId) return fail;

  const token = await signMemberToken(memberId);
  const target = next && next.startsWith("/") ? next : "/compte";
  const response = NextResponse.redirect(new URL(target, siteUrl()));
  response.cookies.set(MEMBER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });
  response.cookies.delete("member_oauth_state");
  return response;
}
