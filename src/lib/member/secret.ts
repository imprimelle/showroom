/**
 * Source unique de vérité pour le secret JWT de l'espace membre.
 * ⚠️ Distinct du secret admin : un token membre ne doit JAMAIS passer pour admin.
 * En production, définir MEMBER_JWT_SECRET dans l'environnement VPS.
 */
export const MEMBER_JWT_SECRET = new TextEncoder().encode(
  process.env.MEMBER_JWT_SECRET || "showroom-member-secret-change-me"
);

export const MEMBER_COOKIE = "member_token";
