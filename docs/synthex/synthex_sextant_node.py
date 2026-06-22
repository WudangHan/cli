"""
SYNTHEX Corporation Agentique
Noeud LangGraph — Agent SEXTANT (Metrologie & Prevision du progres de l'IA)
Document: SYNTHEX-IMPL-SEXTANT-v1.0 | Version 1.0 | 2026-06-22

Extension de SYNTHEX-IMPL-LANGGRAPH-v1.0 : reutilise AgentState, VetoLevel,
compute_idempotency_key et le mecanisme interrupt() (HITL).
Reference veto: SYNTHEX-VET-v1.0 | Conformite: ISO/IEC 42001:2023 — Annexe A.6

ARCHITECTURE
- SEXTANT est en LECTURE SEULE : aucun effet de bord externe avant approbation.
- La publication d'une prevision est encadree par la CALIBRATION (score de Brier).
- Tout NIVEAU 0/1 passe par interrupt() (approbation president), comme les
  autres agents. Le noeud est idempotent (re-execution sans double effet).
"""

from datetime import datetime, timezone
from typing import Tuple

from langgraph.graph import StateGraph
from langgraph.types import interrupt, Command

# Reutilise les types/fonctions du module principal (memes definitions) :
# from synthex_langgraph_hitl_v1_0 import (
#     AgentState, VetoLevel, compute_idempotency_key,
# )

# ============================================================
# 1. SEUILS DE CALIBRATION SEXTANT (extension metrologique de SYNTHEX-VET-v1.0)
# ============================================================

BRIER_HIGH_CONFIDENCE_MAX = 0.15   # Brier <= 0.15  -> prevision haute confiance
BRIER_PUBLISH_MAX = 0.25           # Brier  > 0.25  -> veto publication (NIVEAU 1)


# ============================================================
# 2. CLASSIFICATION DE VETO SPECIFIQUE A SEXTANT
# ============================================================

def classify_sextant_veto(
    task_type: str,
    payload: dict,
    calibration_brier: "float | None" = None,
) -> "Tuple[VetoLevel, str]":
    """
    Determine le niveau de veto d'une action SEXTANT selon SYNTHEX-VET-v1.0,
    etendu par les seuils de calibration.

    REGLES (ordre de priorite decroissant) :
      1. Cartographie / benchmark / veille de rupture -> NIVEAU 4 (auto, lecture seule)
      2. Prevision/rapport avec Brier > 0.25          -> NIVEAU 1 (veto publication)
      3. Prevision destinee a une decision a fort enjeu -> NIVEAU 1 (HITL)
      4. Publication d'Intelligence Report (defaut)    -> NIVEAU 2 (notification)
    """
    stakes = payload.get("decision_stakes", "none")

    if task_type in {"capability_map", "benchmark", "rupture_watch"}:
        return VetoLevel.NIVEAU_4_AUTO, "Mesure en lecture seule"

    if task_type in {"forecast", "intelligence_report"}:
        if calibration_brier is not None and calibration_brier > BRIER_PUBLISH_MAX:
            return (
                VetoLevel.NIVEAU_1_APPROBATION,
                f"Calibration insuffisante (Brier {calibration_brier:.2f} > {BRIER_PUBLISH_MAX}) — veto publication",
            )
        if stakes == "high":
            return (
                VetoLevel.NIVEAU_1_APPROBATION,
                "Prevision destinee a une decision a fort enjeu — HITL requis",
            )
        return VetoLevel.NIVEAU_2_NOTIFICATION, "Publication d'Intelligence Report — notification president"

    return VetoLevel.NIVEAU_4_AUTO, "Action metrologique par defaut"


# ============================================================
# 3. CALCUL METROLOGIQUE (sans effet de bord — a brancher sur la stack)
# ============================================================

def _run_metrology(payload: dict) -> dict:
    """
    Appelle les outils autorises (web_search, news_api, benchmark_runner,
    forecast_engine, pinecone_read) et renvoie cartographie + previsions +
    calibration. STUB : a implementer dans la stack SYNTHEX.
    Doit etre PUR / idempotent (aucun POST/ecriture externe ici).
    """
    return {
        "cartographie": [],   # [{domaine, niveau_vs_humain, robustesse, transfert}]
        "previsions": [],     # [{evenement, horizon, probabilite, intervalle}]
        "calibration": {"brier": 0.0, "methode": "backtest"},
        "alertes": [],
        "sources": [],
    }


# ============================================================
# 4. NOEUD SEXTANT (idempotent, HITL via interrupt())
# ============================================================

def sextant_node(state: "AgentState") -> "Command":
    payload = state["input_payload"]
    task_type = state["task_type"]

    # 1) Idempotence (cle calculee AVANT tout effet de bord)
    # idem = compute_idempotency_key("SEXTANT", task_type, payload)

    # 2) Mesure / prevision (pure, sans effet de bord)
    result = _run_metrology(payload)
    brier = float(result["calibration"]["brier"])

    # 3) Classification de veto (calibration + enjeu aval)
    level, reason = classify_sextant_veto(task_type, payload, brier)
    now = datetime.now(timezone.utc).isoformat()
    audit = list(state.get("audit_trail", [])) + [{
        "agent": "SEXTANT", "task_type": task_type, "veto_level": level.value,
        "brier": brier, "reason": reason, "ts": now,
    }]

    # 4) HITL si NIVEAU 0/1 (suspension via interrupt — etat serialise par le checkpointer)
    if level in {VetoLevel.NIVEAU_0_CRITIQUE, VetoLevel.NIVEAU_1_APPROBATION}:
        decision = interrupt({
            "agent": "SEXTANT",
            "veto_level": level.value,
            "reason": reason,
            "brier": brier,
            "previsions": result["previsions"],
            "demande": "Approuver la publication de la prevision / du rapport ?",
        })
        if decision != "approved":
            return Command(update={
                "status": "blocked",
                "veto_level": level.value,
                "veto_reason": reason,
                "hitl_approval": decision,
                "final_result": None,
                "audit_trail": audit,
            })

    # 5) Publication (NIVEAU 2/4 ou apres approbation)
    report_id = f"SEXTANT-{datetime.now(timezone.utc):%Y%m%d}-{abs(hash(task_type)) % 10000:04d}"
    final = {
        "report_id": report_id,
        "task_type": task_type,
        **result,
        "confidence_score": max(0.0, 1.0 - brier),
        "timestamp": now,
    }
    return Command(update={
        "status": "completed",
        "veto_level": level.value,
        "final_result": final,
        "audit_trail": audit,
    })


# ============================================================
# 5. ENREGISTREMENT DANS LE GRAPHE SYNTHEX
# ============================================================

def register_sextant(graph: "StateGraph") -> None:
    """
    Enregistre SEXTANT dans le StateGraph SYNTHEX.
    OUROBOROS route vers SEXTANT pour les taches de metrologie/prevision
    (task_type in {capability_map, forecast, benchmark, intelligence_report, rupture_watch}).
    Handoffs : PROMETHEUS (strategie), APOLLO (visualisation), ATLAS (dashboard).
    """
    graph.add_node("SEXTANT", sextant_node)
    # graph.add_edge("OUROBOROS", "SEXTANT")   # selon la table de routage d'OUROBOROS
    # graph.add_edge("SEXTANT", "PROMETHEUS")  # handoff previsions -> strategie
