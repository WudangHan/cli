# SEXTANT × SYNTHEX — Dossier stratégique

Documents produits en session (juin 2026), reliant le rapport *From AGI to ASI*
(Genewein et al., arXiv:2606.18621) à l'écosystème agentique **SYNTHEX**.

## Contenu

| Fichier | Description |
|---|---|
| `SYNTHEX_Agent_SEXTANT_Integration_v1.0.docx` | **Document principal.** Intègre SEXTANT comme **13ᵉ agent** de SYNTHEX (Couche Métier : métrologie & prévision du progrès de l'IA), conforme à la procédure d'extension §6 du *Document de Référence SYNTHEX*. Moteur des « SYNTHEX Intelligence Reports ». |
| `Programme_SEXTANT.docx` | Programme de recherche AGI→ASI : 6 thèses hétérodoxes, 3 phases jalonnées de portes (G0/G1/G2), charte constitutionnelle en 12 articles, organigramme + 8 fiches de poste. Sert de socle de R&D / feuille de route de capacité à l'agent SEXTANT. |
| `Dossier_SYNTHEX.docx` | Variante « holding / écosystème » rédigée **avant** la découverte de la véritable architecture SYNTHEX (schéma nautique CARÈNE/AMER/ANCRE). Conservée comme exploration créative ; **supersédée** par le document d'intégration natif ci-dessus. |

## Intégration native dans SYNTHEX (agent SEXTANT, 13ᵉ)

| Fichier | Rôle |
|---|---|
| `SYNTHEX_Agent_SEXTANT_Integration_v1.0.docx` | Document d'intégration (placement, procédure §6, gouvernance THEMIS / veto / HITL). |
| `SYNTHEX_Agent13_SEXTANT_section_v1.0.docx` | Section **13** à insérer dans « SYNTHEX — Documentation Complète des 12 Agents » (13.1 Prompt Maître → 13.6 Seuils de véto Brier). |
| `SYNTHEX_SEXTANT_contract.json` | Contrat d'agent (`SYNTHEX-CTR-SEXTANT-v1.0`) à fusionner dans la clé `agents` de `SYNTHEX_Contrats_Agents_v1.0.json`. |
| `synthex_sextant_node.py` | Nœud LangGraph + classification de véto par calibration (Brier) + HITL `interrupt()`. Extension de `SYNTHEX-IMPL-LANGGRAPH-v1.0`. |
| `synthex_sextant_n8n.json` | Workflow n8n : Cron → invoke LangGraph → véto IF → branche HITL / publication. |

Seuils calibrés (addendum à `SYNTHEX-VET-v1.0`) : **Brier ≤ 0,15** haute confiance · **> 0,25 → véto publication** (NIVEAU 1) · `decision_stakes=high` **→ HITL**.

## Sources & reproductibilité

- `*.html` — sources HTML de chaque document (`sextant.html`, `synthex.html`, `synthex_sextant.html`).
- `build_docx.py` — convertit un HTML en `.docx` (OOXML, sans dépendance externe).
  Usage : `python3 build_docx.py <src.html> <out.docx>`.

## Note

Documents de travail. SYNTHEX vit dans Google Drive (« SYNTHEX CORPORATION AGENTIQUE »).
Les seuils chiffrés (calibration, veto) sont à caler sur `SYNTHEX_Grille_Seuils_Veto_v1.0`.
