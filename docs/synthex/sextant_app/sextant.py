#!/usr/bin/env python3
"""
SYNTHEX — Agent SEXTANT : MVP opérationnel (autonome, stdlib uniquement)
Document: SYNTHEX-APP-SEXTANT-v1.0 | 2026-06-23

Transforme la spécification SEXTANT en implémentation EXÉCUTABLE :
- métrologie réelle : cartographie + prévision par extrapolation logistique
- calibration réelle : score de Brier calculé sur des prévisions résolues
- véto + HITL (SYNTHEX-VET-v1.0) : NIVEAU 4/2/1 selon Brier et enjeu
- produit un Intelligence Report JSON conforme au contrat SYNTHEX-CTR-SEXTANT-v1.0

Tourne sans dépendance externe :
    python3 sextant.py report --domain code --horizon 2026-12 --auto-approve
Pour la stack réelle (LangGraph/n8n), brancher run_metrology() sur les outils
autorisés (benchmark_runner, forecast_engine, pinecone_read) — voir README.
"""
from __future__ import annotations
import argparse, json, math, sys
from datetime import datetime, timezone
from enum import Enum
from typing import Callable, Optional

# ============================================================
# 0. Véto (miroir autonome de SYNTHEX-IMPL-LANGGRAPH-v1.0)
# ============================================================
class VetoLevel(str, Enum):
    NIVEAU_0_CRITIQUE = "NIVEAU_0"
    NIVEAU_1_APPROBATION = "NIVEAU_1"
    NIVEAU_2_NOTIFICATION = "NIVEAU_2"
    NIVEAU_3_AUTO_LOG = "NIVEAU_3"
    NIVEAU_4_AUTO = "NIVEAU_4"

BRIER_HIGH_CONFIDENCE_MAX = 0.15
BRIER_PUBLISH_MAX = 0.25
SUPER_EXPERT_THRESHOLD = 90.0   # score (0-100) vs base humaine = 50

# ============================================================
# 1. Données embarquées (séries de capacités + prévisions résolues)
#    En production : fournies par benchmark_runner / pinecone_read.
# ============================================================
# Score mensuel (0-100, 50 = médiane humaine), t = index de mois depuis 2025-01.
_CAPABILITY_SERIES = {
    "code":   [(0, 61), (3, 66), (6, 70), (9, 74), (12, 79), (15, 83)],
    "math":   [(0, 55), (3, 58), (6, 62), (9, 67), (12, 71), (15, 76)],
    "agents": [(0, 48), (3, 52), (6, 55), (9, 59), (12, 63), (15, 66)],
}
_ROBUSTNESS = {"code": 72, "math": 64, "agents": 51}
_TRANSFER   = {"code": 58, "math": 49, "agents": 44}
# Prévisions passées déjà résolues -> calcul du Brier (proba prédite, issue 0/1).
_RESOLVED_FORECASTS = [
    (0.80, 1), (0.65, 1), (0.55, 0), (0.90, 1), (0.40, 0),
    (0.70, 1), (0.30, 0), (0.85, 1), (0.50, 1), (0.20, 0),
]

# ============================================================
# 2. Métrologie : cartographie, prévision, calibration (Brier)
# ============================================================
def _linfit(points):
    n = len(points); sx = sum(p[0] for p in points); sy = sum(p[1] for p in points)
    sxx = sum(p[0]**2 for p in points); sxy = sum(p[0]*p[1] for p in points)
    b = (n*sxy - sx*sy) / (n*sxx - sx*sx)
    a = (sy - b*sx) / n
    return a, b

def _sigmoid(x): return 1.0 / (1.0 + math.exp(-x))

def _months_since_2025(horizon: str) -> int:
    y, m = (int(x) for x in horizon.split("-"))
    return (y - 2025) * 12 + (m - 1)

def brier_score(resolved) -> float:
    return sum((p - o) ** 2 for p, o in resolved) / len(resolved)

def run_metrology(payload: dict) -> dict:
    """Pur, sans effet de bord (idempotent). Renvoie la sortie SEXTANT."""
    domain = payload.get("domain", "code")
    horizon = payload.get("horizon", "2026-12")
    series = _CAPABILITY_SERIES.get(domain)
    if not series:
        return {"cartographie": [], "previsions": [],
                "calibration": {"brier": 1.0, "methode": "n/a"},
                "alertes": [f"Domaine '{domain}' sans instrument — incertitude maximale"],
                "sources": []}
    a, b = _linfit(series)
    last_t, last_score = series[-1]
    t_h = _months_since_2025(horizon)
    pred = a + b * t_h
    prob = round(_sigmoid((pred - SUPER_EXPERT_THRESHOLD) / 8.0), 3)
    brier = round(brier_score(_RESOLVED_FORECASTS), 3)
    niveau_vs_humain = "surhumain" if last_score >= SUPER_EXPERT_THRESHOLD else (
        "supra-médian" if last_score > 50 else "infra-humain")
    alertes = []
    if b > 0 and (pred >= SUPER_EXPERT_THRESHOLD > last_score):
        alertes.append(f"Rupture prévue : '{domain}' franchit le seuil super-expert avant {horizon}")
    return {
        "cartographie": [{"domaine": domain, "niveau_vs_humain": niveau_vs_humain,
                          "robustesse": _ROBUSTNESS.get(domain, 50),
                          "transfert": _TRANSFER.get(domain, 50),
                          "score": round(last_score, 1), "pente_pts_par_mois": round(b, 2)}],
        "previsions": [{"evenement": f"{domain} >= seuil super-expert ({SUPER_EXPERT_THRESHOLD:.0f})",
                        "horizon": horizon, "probabilite": prob,
                        "intervalle": f"[{max(0.0, prob-0.1):.2f}, {min(1.0, prob+0.1):.2f}]"}],
        "calibration": {"brier": brier, "methode": "backtest sur prévisions résolues"},
        "alertes": alertes,
        "sources": [{"titre": "Série de capacités SYNTHEX (embarquée)",
                     "url": "synthex://benchmarks/" + domain, "date": "2026-06"}],
    }

# ============================================================
# 3. Véto SEXTANT (calibration + enjeu aval)
# ============================================================
def classify_sextant_veto(task_type: str, payload: dict, brier: Optional[float]):
    stakes = payload.get("decision_stakes", "none")
    if task_type in {"capability_map", "benchmark", "rupture_watch"}:
        return VetoLevel.NIVEAU_4_AUTO, "Mesure en lecture seule"
    if task_type in {"forecast", "intelligence_report"}:
        if brier is not None and brier > BRIER_PUBLISH_MAX:
            return VetoLevel.NIVEAU_1_APPROBATION, \
                f"Calibration insuffisante (Brier {brier:.2f} > {BRIER_PUBLISH_MAX}) — véto publication"
        if stakes == "high":
            return VetoLevel.NIVEAU_1_APPROBATION, "Décision à fort enjeu — HITL requis"
        return VetoLevel.NIVEAU_2_NOTIFICATION, "Publication d'Intelligence Report — notification"
    return VetoLevel.NIVEAU_4_AUTO, "Action métrologique par défaut"

# ============================================================
# 4. Exécution SEXTANT (idempotente, HITL par callback)
# ============================================================
def default_hitl(ctx: dict) -> str:
    sys.stderr.write(f"[HITL] {ctx['reason']} (Brier={ctx['brier']}). Approuver ? [y/N] ")
    sys.stderr.flush()
    return "approved" if sys.stdin.readline().strip().lower() in {"y", "o", "oui", "yes"} else "rejected"

def run_sextant(task_type: str, payload: dict, hitl: Callable[[dict], str] = default_hitl) -> dict:
    result = run_metrology(payload)
    brier = float(result["calibration"]["brier"])
    level, reason = classify_sextant_veto(task_type, payload, brier)
    now = datetime.now(timezone.utc).isoformat()
    audit = [{"agent": "SEXTANT", "task_type": task_type, "veto_level": level.value,
              "brier": brier, "reason": reason, "ts": now}]
    if level in {VetoLevel.NIVEAU_0_CRITIQUE, VetoLevel.NIVEAU_1_APPROBATION}:
        decision = hitl({"reason": reason, "brier": brier, "previsions": result["previsions"]})
        if decision != "approved":
            return {"status": "blocked", "veto_level": level.value, "veto_reason": reason,
                    "hitl_approval": decision, "final_result": None, "audit_trail": audit}
    report_id = f"SEXTANT-{datetime.now(timezone.utc):%Y%m%d}-{abs(hash(task_type + payload.get('domain',''))) % 10000:04d}"
    final = {"report_id": report_id, "task_type": task_type, **result,
             "confidence_score": round(max(0.0, 1.0 - brier), 3), "timestamp": now}
    return {"status": "completed", "veto_level": level.value,
            "final_result": final, "audit_trail": audit}

# ============================================================
# 5. CLI
# ============================================================
def main(argv=None):
    p = argparse.ArgumentParser(prog="sextant", description="Agent SEXTANT — métrologie & prévision du progrès IA")
    sub = p.add_subparsers(dest="cmd", required=True)
    r = sub.add_parser("report", help="Produire un Intelligence Report")
    r.add_argument("--task", default="intelligence_report",
                   choices=["capability_map", "forecast", "benchmark", "intelligence_report", "rupture_watch"])
    r.add_argument("--domain", default="code", help="code | math | agents")
    r.add_argument("--horizon", default="2026-12", help="AAAA-MM")
    r.add_argument("--stakes", default="low", choices=["none", "low", "high"])
    r.add_argument("--auto-approve", action="store_true", help="approuve automatiquement le HITL")
    r.add_argument("--out", default=None, help="chemin du rapport JSON (défaut: stdout)")
    a = p.parse_args(argv)
    if a.cmd == "report":
        payload = {"domain": a.domain, "horizon": a.horizon, "decision_stakes": a.stakes}
        hitl = (lambda ctx: "approved") if a.auto_approve else default_hitl
        out = run_sextant(a.task, payload, hitl=hitl)
        txt = json.dumps(out, ensure_ascii=False, indent=2)
        if a.out:
            with open(a.out, "w", encoding="utf-8") as f: f.write(txt)
            print(f"Rapport écrit : {a.out}  (statut={out['status']}, véto={out['veto_level']})")
        else:
            print(txt)
        return 0 if out["status"] != "blocked" else 2

if __name__ == "__main__":
    raise SystemExit(main())
