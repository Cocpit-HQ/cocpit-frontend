#!/usr/bin/env bash
#
# Provision the Cocpit frontend (Next.js) on Railway, next to the backend services.
#
#   frontend   Next.js (Dockerfile, railway.toml)   public domain, /api/health
#   backend    cocpit-backend monolith (main API + admin API + Socket.IO + workers)
#
# Because NEXT_PUBLIC_* values and INTERNAL_API_URL are baked in at BUILD time, this
# script first makes sure the public domains exist (frontend + backend), then sets
# every variable — so the very first build is already correct.
#
# It also updates the backend variables that must know the frontend's address:
#   backend : ALLOWED_ORIGINS (+frontend origin), FRONTEND_URL, CLIENT_URL, API_URL
#
# Prerequisites:
#   - railway login && railway link -p <project>   (project must contain the `backend` service)
#   - .env.railway in this repo root (copy scripts/railway/env.railway.example)
#
# Usage:
#   bash scripts/railway/setup.sh                 # dry run
#   bash scripts/railway/setup.sh --apply         # create service, domains, variables
#   bash scripts/railway/setup.sh --apply --env staging
#
# Variables are set with --skip-deploys; nothing is deployed by this script.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="$REPO_ROOT/.env.railway"
ENVIRONMENT="staging"
APPLY=false

FRONTEND_SVC="frontend"
BACKEND_SVC="backend"
APP_PORT=8080

while [[ $# -gt 0 ]]; do
  case "$1" in
    --apply) APPLY=true ;;
    --env) ENVIRONMENT="$2"; shift ;;
    --env-file) ENV_FILE="$2"; shift ;;
    -h|--help) sed -n 2,26p "$0"; exit 0 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
  shift
done

run() {
  local shown
  shown="$(printf '%s ' "$@" | sed -E 's/((SECRET|KEY|TOKEN|PASSWORD|CLIENT_ID)[A-Z_]*=)[^ ]+/\1***/g')"
  if $APPLY; then echo "+ $shown"; "$@"; else echo "[dry-run] $shown"; fi
}

gen_secret() { node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"; }

command -v railway >/dev/null || { echo "railway CLI not found" >&2; exit 1; }
railway whoami >/dev/null || { echo "Run: railway login" >&2; exit 1; }

status_json() { railway status --json; }

# Prints "<service>\t<domain>" for every service in the environment ("-" when it has none)
service_domains() {
  node -e '
    const j = JSON.parse(require("fs").readFileSync(0, "utf8"));
    const env = j.environments.edges.find(e => e.node.name === process.argv[1]);
    if (!env) { console.error(`Environment "${process.argv[1]}" not found`); process.exit(1); }
    for (const s of env.node.serviceInstances.edges) {
      const d = s.node.domains || {};
      const domain = (d.customDomains?.[0]?.domain) || (d.serviceDomains?.[0]?.domain) || "-";
      console.log(`${s.node.serviceName}\t${domain}`);
    }
  ' "$ENVIRONMENT"
}

domain_of() { awk -F'\t' -v s="$1" '$1==s {print $2}' <<<"$(status_json | service_domains)"; }
has_service() { awk -F'\t' -v s="$1" '$1==s {f=1} END {exit !f}' <<<"$(status_json | service_domains)"; }

has_service "$BACKEND_SVC" || { echo "Service '$BACKEND_SVC' not found — create it from the cocpit-backend repo first" >&2; exit 1; }
echo "== environment: $ENVIRONMENT | apply: $APPLY"

# ── 1. Service ────────────────────────────────────────────────────────────────
if has_service "$FRONTEND_SVC"; then
  echo "Service '$FRONTEND_SVC' already exists — skipping create"
else
  run railway add --service "$FRONTEND_SVC"
fi

# ── 2. Public domains (needed before the first build) ─────────────────────────
ensure_domain() {
  local svc="$1" current
  current="$(domain_of "$svc" || true)"
  if [[ -n "$current" && "$current" != "-" ]]; then
    echo "Domain for $svc: $current" >&2
    echo "$current"; return
  fi
  if $APPLY; then
    railway domain --service "$svc" --port "$APP_PORT" >/dev/null
    current="$(domain_of "$svc")"
    echo "Created domain for $svc: $current" >&2
    echo "$current"
  else
    echo "[dry-run] railway domain --service $svc --port $APP_PORT" >&2
    echo "<$svc-domain>"
  fi
}

FRONTEND_DOMAIN="$(ensure_domain "$FRONTEND_SVC")"
BACKEND_DOMAIN="$(ensure_domain "$BACKEND_SVC")"
FRONTEND_ORIGIN="https://$FRONTEND_DOMAIN"
BACKEND_ORIGIN="https://$BACKEND_DOMAIN"

# ── 3. Read .env.railway (client IDs, maps key, optional overrides) ───────────
declare -A EXTRA=()
if [[ -f "$ENV_FILE" ]]; then
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
    key="$(echo "${line%%=*}" | xargs)"; value="${line#*=}"
    [[ -z "$value" ]] && continue
    EXTRA["$key"]="$value"
  done < "$ENV_FILE"
else
  echo "WARNING: $ENV_FILE not found — client IDs / Maps key will not be set"
fi

[[ -z "${EXTRA[NEXTAUTH_SECRET]:-}" ]] && EXTRA[NEXTAUTH_SECRET]="$(gen_secret)" && echo "Generated NEXTAUTH_SECRET"

# Values derived from the topology always win over .env.railway
EXTRA[PORT]="$APP_PORT"
EXTRA[INTERNAL_API_URL]="http://${BACKEND_SVC}.railway.internal:${APP_PORT}/api"
EXTRA[REQUIRE_INTERNAL_API_URL]="true"
EXTRA[NEXT_PUBLIC_API_URL]="/api"
EXTRA[NEXT_PUBLIC_SOCKET_URL]="$BACKEND_ORIGIN"
EXTRA[NEXT_PUBLIC_SOCKET_TRANSPORT_MODE]="${EXTRA[NEXT_PUBLIC_SOCKET_TRANSPORT_MODE]:-websocket}"
EXTRA[NEXT_PUBLIC_BASE_URL]="$BACKEND_ORIGIN"
EXTRA[NEXTAUTH_URL]="$FRONTEND_ORIGIN"

frontend_pairs=()
for k in "${!EXTRA[@]}"; do frontend_pairs+=("$k=${EXTRA[$k]}"); done

run railway variable set --service "$FRONTEND_SVC" --environment "$ENVIRONMENT" --skip-deploys "${frontend_pairs[@]}"

# ── 4. Backend variables that depend on the frontend address ──────────────────
current_origins="$(railway variables -s "$BACKEND_SVC" -e "$ENVIRONMENT" --json \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).ALLOWED_ORIGINS||""))')"
merged_origins="$(node -e '
  const list = new Set(process.argv[1].split(",").map(s => s.trim()).filter(Boolean));
  list.add(process.argv[2]);
  console.log([...list].join(","));
' "$current_origins" "$FRONTEND_ORIGIN")"

run railway variable set --service "$BACKEND_SVC" --environment "$ENVIRONMENT" --skip-deploys \
  "ALLOWED_ORIGINS=$merged_origins" \
  "FRONTEND_URL=$FRONTEND_ORIGIN" \
  "CLIENT_URL=$FRONTEND_ORIGIN" \
  "API_URL=$BACKEND_ORIGIN"

cat <<EOF

== Done ($ENVIRONMENT)
  Frontend : $FRONTEND_ORIGIN
  Backend  : $BACKEND_ORIGIN   (Socket.IO + profile images)

Remaining one-time steps:
  1. $FRONTEND_SVC → Settings → Source → connect GitHub repo + branch (config: /railway.toml, default).
  2. Google Cloud: add $FRONTEND_ORIGIN to the OAuth client's Authorized JavaScript origins,
     and to the Maps key's HTTP-referrer restrictions.
  3. Deploy order: backend → $FRONTEND_SVC (backend must already accept the new origin).
  4. Switching to a custom domain later? Re-run this script — NEXTAUTH_URL and the socket URL
     are baked into the build, so the frontend must be redeployed after the change.
EOF
