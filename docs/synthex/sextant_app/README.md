# SEXTANT — MVP opérationnel (`SYNTHEX-APP-SEXTANT-v1.0`)

Implémentation **exécutable** de l'agent SEXTANT (13ᵉ agent SYNTHEX, Couche Métier) :
mesure les capacités de l'IA, produit une prévision **calibrée (Brier)**, applique le
**véto/HITL** (`SYNTHEX-VET-v1.0`) et émet un *Intelligence Report* JSON conforme au
contrat `SYNTHEX-CTR-SEXTANT-v1.0`.

## Lancer (sans dépendance — stdlib uniquement)

```bash
python3 sextant.py report --domain code --horizon 2026-12 --auto-approve
python3 sextant.py report --domain agents --horizon 2027-06 --stakes high   # déclenche le HITL
python3 sextant.py report --domain code --out rapport.json
python3 sextant.py agi-profile --auto-approve                               # profil AGI (CHC) + voies ASI
```

- `--domain` : `code | math | agents` (séries de capacités embarquées)
- `--stakes high` ou `Brier > 0,25` → **NIVEAU 1**, passage par le HITL (approbation)
- `--auto-approve` : approuve le HITL automatiquement (CI / cron)

Codes de sortie : `0` publié · `2` bloqué par véto/HITL.

## Ce qui est « réel » ici
- **Cartographie** : niveau vs humain, robustesse, transfert, pente (pts/mois).
- **Prévision** : probabilité de franchir le seuil super-expert (90/100) par
  extrapolation logistique de la série de capacités.
- **Calibration** : score de Brier calculé sur des prévisions **résolues**.
- **Véto** : `classify_sextant_veto()` (NIVEAU 4/2/1) + HITL par callback.

## `agi-profile` — cadre de mesure AGI (note de veille intégrée)
Intègre la note `../SYNTHEX_Note_AGIASI_v1.0.docx` (5 sources AGI/ASI, MLA 9e) comme
**instrument de mesure** de SEXTANT :
- **Profil cognitif « dentelé » (CHC)** — Hendrycks et al. : 10 domaines pondérés à
  10 %, échelle 0-100 (100 = adulte instruit). Révèle le **verrou** : stockage long
  terme (Glr) ≈ 8/100 malgré un indice composite de ~73/100.
- **Verrous fondationnels** — Mumuni & Mumuni : incarnation, ancrage symbolique,
  causalité, mémoire, rattachés à leur domaine CHC.
- **Voies AGI→ASI** — Google DeepMind : 4 voies + frictions ; SYNTHEX mise sur la
  voie 3 (OUROBOROS) et la voie 4 (Conseil des 12 agents).
- **Familles de risque** — Shah et al. : mésusage / désalignement / erreurs /
  structurel, rattachées au véto `SYNTHEX-VET-v1.0`.

## Brancher sur la stack réelle (LangGraph / n8n)
Remplacer `run_metrology()` par des appels aux outils autorisés du contrat
(`benchmark_runner`, `forecast_engine`, `pinecone_read`, `news_api`). Le nœud
LangGraph + `interrupt()` est dans `../synthex_sextant_node.py` ; le workflow
n8n (Cron → invoke → véto IF → HITL/publication) dans `../synthex_sextant_n8n.json`.
Voir `requirements.txt` pour la stack de production.
