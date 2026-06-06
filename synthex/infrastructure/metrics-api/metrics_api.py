"""SYNTHEX metrics-api — expose les métriques MINERVA au dashboard.

Endpoints :
  GET /health          (public)
  GET /metrics/mrr     (Bearer METRICS_API_KEY)
  GET /metrics/leads   (Bearer METRICS_API_KEY)
  GET /metrics/audit   (Bearer METRICS_API_KEY)
"""
from __future__ import annotations

import os
from contextlib import asynccontextmanager
from typing import Any

import asyncpg
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

DATABASE_URL = os.environ.get("DATABASE_URL", "")
API_KEY = os.environ.get("METRICS_API_KEY", "")


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.pool = None
    if DATABASE_URL:
        try:
            app.state.pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=5)
        except Exception as exc:  # pragma: no cover
            print(f"[metrics-api] pool indisponible: {exc}")
    yield
    if app.state.pool:
        await app.state.pool.close()


app = FastAPI(title="SYNTHEX metrics-api", version="1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["Authorization", "Content-Type"],
)


async def require_key(authorization: str = Header(default="")) -> None:
    """Vérifie le jeton Bearer. Si aucune clé n'est configurée, accès ouvert (dev)."""
    if not API_KEY:
        return
    expected = f"Bearer {API_KEY}"
    if authorization != expected:
        raise HTTPException(status_code=401, detail="Clé API invalide ou manquante")


async def fetchrow(app_: FastAPI, query: str, *args) -> dict[str, Any] | None:
    if not app_.state.pool:
        return None
    async with app_.state.pool.acquire() as conn:
        row = await conn.fetchrow(query, *args)
        return dict(row) if row else None


@app.get("/health")
async def health() -> dict[str, Any]:
    return {"status": "ok", "db": bool(app.state.pool)}


@app.get("/metrics/mrr", dependencies=[Depends(require_key)])
async def metrics_mrr() -> dict[str, Any]:
    row = await fetchrow(
        app,
        "SELECT mrr_current, customers_current FROM v_dashboard_metrics",
    )
    if not row:
        raise HTTPException(status_code=503, detail="Base indisponible")
    return {
        "value": float(row["mrr_current"] or 0),
        "currency": "CAD",
        "customers": int(row["customers_current"] or 0),
        "delta_pct": 0.0,
    }


@app.get("/metrics/leads", dependencies=[Depends(require_key)])
async def metrics_leads() -> dict[str, Any]:
    row = await fetchrow(
        app,
        "SELECT leads_30d, leads_qualified_30d FROM v_dashboard_metrics",
    )
    if not row:
        raise HTTPException(status_code=503, detail="Base indisponible")
    total = int(row["leads_30d"] or 0)
    qualified = int(row["leads_qualified_30d"] or 0)
    conv = round((qualified / total * 100), 1) if total else 0.0
    return {"total": total, "qualified": qualified, "conversion_pct": conv, "delta_pct": 0.0}


@app.get("/metrics/audit", dependencies=[Depends(require_key)])
async def metrics_audit() -> dict[str, Any]:
    if not app.state.pool:
        raise HTTPException(status_code=503, detail="Base indisponible")
    async with app.state.pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT to_char(created_at, 'YYYY-MM-DD HH24:MI') AS ts, agent, action, "
            "left(hash, 8) AS hash FROM audit_log ORDER BY created_at DESC LIMIT 20"
        )
    return {"entries": [dict(r) for r in rows]}
