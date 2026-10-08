/**
 * Source unique de vérité pour le secret JWT admin.
 * ⚠️ Doit rester identique partout (middleware, login, auth) :
 * sinon le login signe avec un secret que le middleware ne reconnaît pas → 401 généralisé.
 *
 * Priorité : ADMIN_JWT_SECRET > ADMIN_PIN > fallback.
 * (Historiquement le middleware utilisait ADMIN_PIN seul tandis que login/auth
 * priorisaient ADMIN_JWT_SECRET — harmonisé le 01/10/2026.)
 */
export const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || process.env.ADMIN_PIN || "showroom-admin-secret-change-me"
);
