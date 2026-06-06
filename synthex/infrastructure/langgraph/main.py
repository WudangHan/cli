"""SYNTHEX langgraph-api — passerelle FastAPI vers les 12 agents.

Chaque invocation d'agent est automatiquement journalisée par THEMIS
(table audit_log, hash SHA-256) avant de retourner la réponse.
"""
from __future__ import annotations

import hashlib
import json
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any

import asyncpg
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

DATABASE_URL = os.environ.get("DATABASE_URL", "")
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
MODEL = os.environ.get("SYNTHEX_MODEL", "claude-opus-4-8")

# Les 12 agents, 4 couches — aligné sur SYNTHEX_Contrats_Agents_v1.0.json
AGENTS: dict[str, dict[str, str]] = {
    # L1 — Gouvernance
    "ATLAS":     {"layer": "Gouvernance",    "veto": "ABSOLU"},
    "THEMIS":    {"layer": "Gouvernance",    "veto": "LEGAL"},
    "ARES":      {"layer": "Gouvernance",    "veto": "FINANCIER"},
    # L2 — Intelligence
    "DIANA":     {"layer": "Intelligence",   "veto": "AUCUN"},
    "MINERVA":   {"layer": "Intelligence",   "veto": "AUCUN"},
    "ORACLE":    {"layer": "Intelligence",   "veto": "AUCUN"},
    # L3 — Opérations
    "MERCURY":   {"layer": "Operations",     "veto": "AUCUN"},
    "VULCAN":    {"layer": "Operations",     "veto": "AUCUN"},
    "HERMES":    {"layer": "Operations",     "veto": "AUCUN"},
    # L4 — Infrastructure
    "OUROBOROS": {"layer": "Infrastructure", "veto": "AUCUN"},
    "ARGUS":     {"layer": "Infrastructure", "veto": "AUCUN"},
    "JANUS":     {"layer": "Infrastructure", "veto": "SECURITE"},
}

VETO_THRESHOLD_CAD = 1000.0


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.pool = None
    if DATABASE_URL:
        try:
            app.state.pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=5)
        except Exception as exc:  # pragma: no cover - démarrage best-effort
            print(f"[langgraph] pool indisponible: {exc}")
    yield
    if app.state.pool:
        await app.state.pool.close()


app = FastAPI(title="SYNTHEX langgraph-api", version="1.0", lifespan=lifespan)


class Invocation(BaseModel):
    payload: dict[str, Any] = {}


def themis_hash(agent: str, action: str, payload: dict[str, Any]) -> str:
    """Hash SHA-256 déterministe pour la traçabilité (THEMIS)."""
    blob = json.dumps(
        {"agent": agent, "action": action, "payload": payload},
        sort_keys=True, separators=(",", ":"), default=str,
    )
    return hashlib.sha256(blob.encode("utf-8")).hexdigest()


async def themis_log(pool, agent: str, action: str, payload: dict[str, Any]) -> str:
    """Journalise une action dans audit_log. Retourne le hash."""
    digest = themis_hash(agent, action, payload)
    if pool:
        async with pool.acquire() as conn:
            await conn.execute(
                "INSERT INTO audit_log (agent, action, subject, hash, created_at) "
                "VALUES ($1, $2, $3, $4, $5)",
                agent, action, str(payload.get("subject", "")), digest,
                datetime.now(timezone.utc),
            )
    return digest


async def claude(system: str, user: str, max_tokens: int = 512) -> str:
    """Appel Claude (best-effort)."""
    if not ANTHROPIC_API_KEY:
        return ""
    import httpx
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": MODEL, "max_tokens": max_tokens,
                "system": system,
                "messages": [{"role": "user", "content": user}],
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data.get("content", [{}])[0].get("text", "")


# --- Logique métier par agent (extrait représentatif) ---

async def handle_diana(payload: dict[str, Any]) -> dict[str, Any]:
    text = await claude(
        "Tu es DIANA. Réponds en JSON {\"score\":0-100,\"raison\":str}.",
        json.dumps(payload, ensure_ascii=False),
    )
    try:
        parsed = json.loads(text) if text else {"score": 0, "raison": "no-llm"}
    except json.JSONDecodeError:
        parsed = {"score": 0, "raison": "parse-error"}
    return parsed


async def handle_ares(payload: dict[str, Any]) -> dict[str, Any]:
    amount = float(payload.get("amount_cad", 0) or 0)
    veto = amount > VETO_THRESHOLD_CAD
    return {"veto": veto, "amount_cad": amount, "threshold": VETO_THRESHOLD_CAD}


async def handle_generic(code: str, payload: dict[str, Any]) -> dict[str, Any]:
    return {"agent": code, "status": "accepted", "echo": payload}


HANDLERS = {"DIANA": handle_diana, "ARES": handle_ares}


@app.get("/health")
async def health() -> dict[str, Any]:
    return {"status": "ok", "agents": len(AGENTS)}


@app.get("/agents")
async def list_agents() -> dict[str, Any]:
    return {"count": len(AGENTS), "agents": AGENTS}


@app.post("/agents/{code}/invoke")
async def invoke(code: str, body: Invocation) -> dict[str, Any]:
    code = code.upper()
    if code not in AGENTS:
        raise HTTPException(status_code=404, detail=f"Agent inconnu: {code}")

    handler = HANDLERS.get(code)
    result = await handler(body.payload) if handler else await handle_generic(code, body.payload)

    # THEMIS journalise systématiquement.
    digest = await themis_log(app.state.pool, code, "invoke", body.payload)
    return {"agent": code, "layer": AGENTS[code]["layer"], "result": result, "audit_hash": digest}
