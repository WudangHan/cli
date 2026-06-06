#!/usr/bin/env bash
# SYNTHEX — déploiement clé en main sur un VPS Hetzner (CX52 recommandé).
# Usage : bash deploy-hetzner.sh <IP_DU_VPS> [user]
#   - copie le dossier infrastructure/ + les pages statiques sur le VPS
#   - installe Docker si absent
#   - lance la stack via docker compose
set -euo pipefail

IP="${1:-}"
USER_REMOTE="${2:-root}"

if [[ -z "$IP" ]]; then
  echo "Usage: bash deploy-hetzner.sh <IP_DU_VPS> [user]" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REMOTE_DIR="/opt/synthex"

if [[ ! -f "$SCRIPT_DIR/.env" ]]; then
  echo "✗ $SCRIPT_DIR/.env introuvable. Copiez .env.example -> .env et remplissez-le." >&2
  exit 1
fi

echo "▶ 1/4 — Installation de Docker sur $IP (si nécessaire)…"
ssh "${USER_REMOTE}@${IP}" 'command -v docker >/dev/null 2>&1 || (curl -fsSL https://get.docker.com | sh)'

echo "▶ 2/4 — Préparation du dossier distant $REMOTE_DIR…"
ssh "${USER_REMOTE}@${IP}" "mkdir -p ${REMOTE_DIR}"

echo "▶ 3/4 — Synchronisation des fichiers…"
rsync -az --delete \
  --exclude '.git' \
  "$PROJECT_ROOT/" "${USER_REMOTE}@${IP}:${REMOTE_DIR}/"

echo "▶ 4/4 — Démarrage de la stack…"
ssh "${USER_REMOTE}@${IP}" "cd ${REMOTE_DIR}/infrastructure && docker compose --env-file .env pull && docker compose --env-file .env up -d"

echo "✓ Déploiement terminé."
echo "  Vérifiez : ssh ${USER_REMOTE}@${IP} 'cd ${REMOTE_DIR}/infrastructure && docker compose ps'"
echo "  Puis lancez : bash import-workflows-n8n.sh   et   bash test-synthex.sh"
