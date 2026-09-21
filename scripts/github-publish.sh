#!/usr/bin/env bash
# Publie le showroom sur GitHub (imprimelle/showroom).
#
# Usage :
#   GITHUB_TOKEN=ghp_xxx ./scripts/github-publish.sh
#   ou
#   ./scripts/github-publish.sh ghp_xxx
#
# Ce que fait le script (idempotent, sûr à relancer) :
#   1. Crée le repo GitHub imprimelle/showroom s'il n'existe pas (public, comme assoai).
#   2. Ajoute/configure la remote `origin`.
#   3. Pousse la branche main.
#   4. Vérifie que le repo distant contient bien le dernier commit.

set -euo pipefail

REPO_OWNER="imprimelle"
REPO_NAME="showroom"
BRANCH="main"
API="https://api.github.com"

# --- Résolution du token ----------------------------------------------------
TOKEN="${GITHUB_TOKEN:-${1:-}}"
if [ -z "$TOKEN" ]; then
  echo "ERREUR : aucun token. Passe-le via GITHUB_TOKEN=... ou en argument." >&2
  exit 1
fi

# --- Vérification du token --------------------------------------------------
USER_JSON=$(curl -fsS -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/vnd.github+json" "$API/user" 2>/dev/null) || {
  echo "ERREUR : token invalide ou réseau indisponible (GET /user a échoué)." >&2
  exit 1
}
LOGIN=$(printf '%s' "$USER_JSON" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("login",""))')
echo "✓ Token valide (compte : $LOGIN)"

# --- Création du repo si absent ---------------------------------------------
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/vnd.github+json" "$API/repos/$REPO_OWNER/$REPO_NAME")

if [ "$HTTP_CODE" = "404" ]; then
  echo "→ Création du repo $REPO_OWNER/$REPO_NAME (public)…"
  curl -fsS -X POST -H "Authorization: Bearer $TOKEN" \
    -H "Accept: application/vnd.github+json" \
    "$API/user/repos" \
    -d "{\"name\":\"$REPO_NAME\",\"description\":\"Showroom e-commerce AssoAI/Imprimelle (Next.js 16 + Supabase)\",\"public\":true}" \
    >/dev/null
  echo "✓ Repo créé"
elif [ "$HTTP_CODE" = "200" ]; then
  echo "✓ Repo $REPO_OWNER/$REPO_NAME existe déjà"
else
  echo "ERREUR : GET $API/repos/$REPO_OWNER/$REPO_NAME -> HTTP $HTTP_CODE" >&2
  exit 1
fi

# --- Remote + push ----------------------------------------------------------
cd "$(dirname "$0")/.."   # racine du dépôt showroom

REMOTE_URL="https://${REPO_OWNER}:${TOKEN}@github.com/${REPO_OWNER}/${REPO_NAME}.git"
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REMOTE_URL"
else
  git remote add origin "$REMOTE_URL"
fi
echo "✓ Remote origin configurée"

echo "→ Push de la branche $BRANCH…"
git push -u origin "$BRANCH"

# --- Vérification -----------------------------------------------------------
REMOTE_SHA=$(git ls-remote origin "refs/heads/$BRANCH" | cut -f1)
LOCAL_SHA=$(git rev-parse "$BRANCH")
echo ""
if [ "$REMOTE_SHA" = "$LOCAL_SHA" ]; then
  echo "✓ Push vérifié : origin/$BRANCH == $LOCAL_SHA"
else
  echo "⚠ Différence remote/local : $REMOTE_SHA vs $LOCAL_SHA" >&2
fi

# Ne pas laisser le token en clair dans la config git
git remote set-url origin "https://github.com/${REPO_OWNER}/${REPO_NAME}.git"
echo "✓ Token retiré de la remote (URL nettoyée)"

echo ""
echo "Terminé. Repo : https://github.com/$REPO_OWNER/$REPO_NAME"
