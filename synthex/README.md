# SYNTHEX Corporation Agentique — Matrice de Connexion

Entreprise pilotée par **12 agents** organisés en **4 couches**. Ce dossier
contient le front-end (5 pages connectées), les workflows d'automatisation
(n8n) et l'infrastructure complète (Docker, 11 services).

> Ce projet vit dans le sous-dossier `synthex/` du dépôt. Les noms de fichiers
> ont été normalisés (sans accents ni espaces) pour être compatibles URL.

## Arborescence

```
synthex/
├── index.html              # Accueil / Contact (formulaire → workflow 01)
├── services.html           # Catalogue de services
├── agents.html             # 12 agents (généré depuis le JSON)
├── ops.html                # Tableau de bord opérationnel
├── dashboard.html          # Dashboard Président (React + API live MINERVA)
├── SYNTHEX_Contrats_Agents_v1.0.json   # Source de vérité des agents
├── n8n-workflows/
│   ├── workflow_01_lead_diana_mercury.json
│   ├── workflow_02_stripe_minerva_themis.json
│   └── workflow_03_ouroboros_ares_brief.json
└── infrastructure/
    ├── docker-compose.yml  # 11 services
    ├── .env.example
    ├── init-db.sql         # transactions, mrr_log, audit_log, leads, v_dashboard_metrics
    ├── deploy-hetzner.sh
    ├── import-workflows-n8n.sh
    ├── test-synthex.sh
    ├── langgraph/          # Dockerfile + main.py + requirements.txt
    ├── metrics-api/        # Dockerfile + metrics_api.py + requirements.txt
    ├── monitoring/         # prometheus.yml + alerts.yml
    ├── cloudflared/        # config.yml
    └── nginx/              # nginx.conf
```

## Les 12 agents (4 couches)

| Couche | Agents | Veto |
|---|---|---|
| **L1 · Gouvernance** | ATLAS, THEMIS, ARES | ABSOLU, LEGAL, FINANCIER |
| **L2 · Intelligence** | DIANA, MINERVA, ORACLE | — |
| **L3 · Opérations** | MERCURY, VULCAN, HERMES | — |
| **L4 · Infrastructure** | OUROBOROS, ARGUS, JANUS | —, —, SECURITE |

## Lancer en local

```bash
# Front-end seul (les pages se servent entre elles)
cd synthex && python3 -m http.server 8080
# → http://localhost:8080/index.html

# Stack complète
cd synthex/infrastructure
cp .env.example .env   # puis remplir
docker compose --env-file .env up -d
```

Le `dashboard.html` démarre en **mode démo**. Pour le passer en **live**,
ouvrez la console DevTools et lancez `synthexSetApiKey('votre-cle')`, puis
rechargez. Les appels ciblent `/metrics/mrr`, `/metrics/leads`, `/metrics/audit`
avec auto-refresh 60 s.

## Workflows n8n

1. **01 — Lead** : Formulaire → DIANA (scoring Claude) → HubSpot (si ≥ 70) → MERCURY (email) → THEMIS (audit).
2. **02 — Paiement** : Stripe → MINERVA (PostgreSQL) → THEMIS (hash SHA-256) → ARES (email VETO si > 1 000 CAD).
3. **03 — Brief** : Cron 06:00 → métriques DB → Claude → brief quotidien (email).

Import : `bash infrastructure/import-workflows-n8n.sh` (nécessite `N8N_API_KEY`).

## Reste à faire (actions manuelles)

1. Obtenir les 7 clés API : Anthropic, SendGrid, HubSpot, Stripe, Pinecone, Hetzner, Cloudflare.
2. Remplir `infrastructure/.env` à partir de `.env.example`.
3. Commander un VPS Hetzner CX52 → `bash infrastructure/deploy-hetzner.sh <IP>`.
4. Stripe Dashboard : webhook vers `https://n8n.synthex.ai/webhook/stripe-payment`.
5. SendGrid : vérifier `mercury@synthex.ai` et `ares@synthex.ai`.
6. `bash infrastructure/import-workflows-n8n.sh` puis configurer les credentials dans l'UI n8n.
7. `bash infrastructure/test-synthex.sh` pour valider l'ensemble.
8. Incorporation légale LCSA (~14 jours, ~2 014 CAD).
