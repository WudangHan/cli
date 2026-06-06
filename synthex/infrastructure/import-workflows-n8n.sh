#!/usr/bin/env bash
# SYNTHEX — importe et active les 3 workflows via l'API REST n8n.
# Prérequis :
#   export N8N_BASE_URL="https://n8n.synthex.ai"   (ou http://localhost:5678)
#   export N8N_API_KEY="<clé API n8n>"             (Settings -> API dans n8n)
# Usage : bash import-workflows-n8n.sh
set -euo pipefail

N8N_BASE_URL="${N8N_BASE_URL:-http://localhost:5678}"
: "${N8N_API_KEY:?Définissez N8N_API_KEY (Settings -> n8n API)}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WF_DIR="$(cd "$SCRIPT_DIR/../n8n-workflows" && pwd)"

command -v jq >/dev/null 2>&1 || { echo "✗ jq requis (apt-get install jq)" >&2; exit 1; }

import_one() {
  local file="$1"
  echo "▶ Import : $(basename "$file")"

  # n8n /workflows n'accepte que name, nodes, connections, settings.
  local payload
  payload="$(jq '{name, nodes, connections, settings: (.settings // {})}' "$file")"

  local resp id
  resp="$(curl -sS -X POST "${N8N_BASE_URL}/api/v1/workflows" \
    -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "$payload")"

  id="$(echo "$resp" | jq -r '.id // empty')"
  if [[ -z "$id" ]]; then
    echo "  ✗ Échec import : $resp" >&2
    return 1
  fi
  echo "  ✓ Créé (id=$id) — activation…"

  curl -sS -X POST "${N8N_BASE_URL}/api/v1/workflows/${id}/activate" \
    -H "X-N8N-API-KEY: ${N8N_API_KEY}" >/dev/null
  echo "  ✓ Activé."
}

for wf in \
  "$WF_DIR/workflow_01_lead_diana_mercury.json" \
  "$WF_DIR/workflow_02_stripe_minerva_themis.json" \
  "$WF_DIR/workflow_03_ouroboros_ares_brief.json"; do
  import_one "$wf"
done

echo "✓ 3 workflows importés. Configurez maintenant les credentials dans l'UI n8n."
