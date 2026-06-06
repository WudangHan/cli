#!/usr/bin/env bash
# SYNTHEX — 7 tests end-to-end post-déploiement.
# Usage :
#   export METRICS_BASE="https://metrics.synthex.ai"   (ou http://localhost:8002)
#   export N8N_BASE="https://n8n.synthex.ai"           (ou http://localhost:5678)
#   export METRICS_API_KEY="<clé>"
#   bash test-synthex.sh
set -uo pipefail

METRICS_BASE="${METRICS_BASE:-http://localhost:8002}"
N8N_BASE="${N8N_BASE:-http://localhost:5678}"
KEY="${METRICS_API_KEY:-}"

PASS=0; FAIL=0
ok()   { echo "  ✓ $1"; PASS=$((PASS+1)); }
ko()   { echo "  ✗ $1"; FAIL=$((FAIL+1)); }

hdr=(-H "Authorization: Bearer ${KEY}")

echo "── SYNTHEX · tests end-to-end ───────────────────────────"

# 1 — Santé metrics-api
echo "[1/7] metrics-api /health"
code="$(curl -s -o /dev/null -w '%{http_code}' "${METRICS_BASE}/health")"
[[ "$code" == "200" ]] && ok "health 200" || ko "health a renvoyé $code"

# 2 — MRR
echo "[2/7] /metrics/mrr"
body="$(curl -s "${hdr[@]}" "${METRICS_BASE}/metrics/mrr")"
echo "$body" | grep -q '"value"' && ok "mrr exposé" || ko "mrr invalide: $body"

# 3 — Leads
echo "[3/7] /metrics/leads"
body="$(curl -s "${hdr[@]}" "${METRICS_BASE}/metrics/leads")"
echo "$body" | grep -q '"total"' && ok "leads exposé" || ko "leads invalide: $body"

# 4 — Audit
echo "[4/7] /metrics/audit"
body="$(curl -s "${hdr[@]}" "${METRICS_BASE}/metrics/audit")"
echo "$body" | grep -q '"entries"' && ok "audit exposé" || ko "audit invalide: $body"

# 5 — Auth requise (sans clé -> 401)
echo "[5/7] auth requise"
code="$(curl -s -o /dev/null -w '%{http_code}' "${METRICS_BASE}/metrics/mrr")"
[[ "$code" == "401" || "$code" == "403" ]] && ok "accès protégé ($code)" || ko "attendu 401/403, reçu $code"

# 6 — n8n joignable
echo "[6/7] n8n /healthz"
code="$(curl -s -o /dev/null -w '%{http_code}' "${N8N_BASE}/healthz")"
[[ "$code" == "200" ]] && ok "n8n up" || ko "n8n /healthz a renvoyé $code"

# 7 — Webhook Lead (workflow 01)
echo "[7/7] webhook lead-capture"
code="$(curl -s -o /dev/null -w '%{http_code}' -X POST "${N8N_BASE}/webhook/lead-capture" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test E2E","email":"test@example.com","company":"ACME","message":"ping"}')"
[[ "$code" =~ ^2 ]] && ok "webhook accepté ($code)" || ko "webhook a renvoyé $code (workflow actif ?)"

echo "─────────────────────────────────────────────────────────"
echo "Résultat : ${PASS} réussis, ${FAIL} échoués."
[[ "$FAIL" -eq 0 ]] && exit 0 || exit 1
