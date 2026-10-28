/**
 * OAuth2 Google & Facebook (Authorization Code flow, implémentation manuelle).
 * Les credentials viennent de l'environnement (GOOGLE_CLIENT_ID/SECRET,
 * FACEBOOK_APP_ID/SECRET). Sans credentials, le bouton correspondant est masqué.
 */

export function siteUrl(): string {
  return (process.env.SITE_URL || "https://imprimelle.com").replace(/\/+$/, "");
}

export interface OAuthProfile {
  provider: "google" | "facebook";
  oauthId: string; // identifiant stable chez le provider
  email: string | null;
  name: string | null;
  picture: string | null;
}

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}
export function facebookConfigured(): boolean {
  return Boolean(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET);
}

export function googleAuthUrl(state: string): string {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!);
  url.searchParams.set("redirect_uri", `${siteUrl()}/api/member/oauth/google/callback`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

export function facebookAuthUrl(state: string): string {
  const url = new URL("https://www.facebook.com/v19.0/dialog/oauth");
  url.searchParams.set("client_id", process.env.FACEBOOK_APP_ID!);
  url.searchParams.set("redirect_uri", `${siteUrl()}/api/member/oauth/facebook/callback`);
  url.searchParams.set("scope", "email,public_profile");
  url.searchParams.set("state", state);
  return url.toString();
}

export async function exchangeGoogleCode(code: string): Promise<OAuthProfile | null> {
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${siteUrl()}/api/member/oauth/google/callback`,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) return null;
    const tokens = (await tokenRes.json()) as { access_token?: string };
    if (!tokens.access_token) return null;

    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!userRes.ok) return null;
    const u = (await userRes.json()) as { sub?: string; email?: string; name?: string; picture?: string };
    if (!u.sub) return null;
    return {
      provider: "google",
      oauthId: `google:${u.sub}`,
      email: u.email ?? null,
      name: u.name ?? null,
      picture: u.picture ?? null,
    };
  } catch {
    return null;
  }
}

export async function exchangeFacebookCode(code: string): Promise<OAuthProfile | null> {
  try {
    const tokenRes = await fetch("https://graph.facebook.com/v19.0/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.FACEBOOK_APP_ID!,
        client_secret: process.env.FACEBOOK_APP_SECRET!,
        redirect_uri: `${siteUrl()}/api/member/oauth/facebook/callback`,
        code,
      }),
    });
    if (!tokenRes.ok) return null;
    const tokens = (await tokenRes.json()) as { access_token?: string };
    if (!tokens.access_token) return null;

    const userRes = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${encodeURIComponent(tokens.access_token)}`
    );
    if (!userRes.ok) return null;
    const u = (await userRes.json()) as {
      id?: string;
      name?: string;
      email?: string;
      picture?: { data?: { url?: string } };
    };
    if (!u.id) return null;
    return {
      provider: "facebook",
      oauthId: `facebook:${u.id}`,
      email: u.email ?? null,
      name: u.name ?? null,
      picture: u.picture?.data?.url ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Crée ou met à jour un membre à partir d'un profil OAuth.
 * Résolution : oauth_id d'abord, puis email (fusion de comptes), sinon création.
 */
export async function upsertOAuthMember(profile: OAuthProfile): Promise<string | null> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data: byOauth } = await admin
    .from("showroom_members")
    .select("id")
    .eq("oauth_id", profile.oauthId)
    .maybeSingle();
  if (byOauth) {
    await admin
      .from("showroom_members")
      .update({
        email: profile.email,
        name: profile.name,
        avatar_url: profile.picture,
        last_login_at: new Date().toISOString(),
      })
      .eq("id", (byOauth as { id: string }).id);
    return (byOauth as { id: string }).id;
  }

  if (profile.email) {
    const { data: byEmail } = await admin
      .from("showroom_members")
      .select("id")
      .eq("email", profile.email)
      .maybeSingle();
    if (byEmail) {
      await admin
        .from("showroom_members")
        .update({
          oauth_provider: profile.provider,
          oauth_id: profile.oauthId,
          name: profile.name || undefined,
          avatar_url: profile.picture || undefined,
          last_login_at: new Date().toISOString(),
        })
        .eq("id", (byEmail as { id: string }).id);
      return (byEmail as { id: string }).id;
    }
  }

  const { data: created, error } = await admin
    .from("showroom_members")
    .insert({
      email: profile.email,
      name: profile.name,
      avatar_url: profile.picture,
      oauth_provider: profile.provider,
      oauth_id: profile.oauthId,
    })
    .select("id")
    .single();

  if (error || !created) return null;
  return (created as { id: string }).id;
}
