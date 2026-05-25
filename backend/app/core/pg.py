"""Cliente directo al endpoint /pg/query de Supabase self-hosted.

Workaround: el PostgREST de este Supabase compartido tiene un schema cache
que no se refresca con NOTIFY y solo expone GETs de las tablas nuevas, no
POST/PATCH/DELETE. Usamos /pg/query para todas las escrituras hasta que
alguien con acceso reinicie PostgREST.
"""
from __future__ import annotations

import json
import re
from typing import Any
from urllib import request as urlrequest
from urllib.error import HTTPError

from app.core.config import settings


# Postgres devuelve timestamps como '2026-05-24 02:07:55.974+00' (sin T, tz
# sin minutos). Pydantic v2 quiere ISO 8601 estricto. Normalizamos aquí.
_TS_RE = re.compile(
    r"^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}(?:\.\d+)?)([+-]\d{2})(?::?(\d{2}))?$"
)


def _normalize_value(v: Any) -> Any:
    if isinstance(v, str):
        m = _TS_RE.match(v)
        if m:
            d, t, tzh, tzm = m.groups()
            return f"{d}T{t}{tzh}:{tzm or '00'}"
    return v


def _normalize_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [{k: _normalize_value(v) for k, v in r.items()} for r in rows]


def _endpoint() -> str:
    return f"{settings.supabase_url.rstrip('/')}/pg/query"


def execute_sql(sql: str) -> list[dict[str, Any]]:
    """Ejecuta SQL crudo con la service_role key. Devuelve filas si las hay."""
    payload = json.dumps({"query": sql}).encode("utf-8")
    req = urlrequest.Request(
        _endpoint(),
        headers={
            "apikey": settings.supabase_service_role_key,
            "Authorization": f"Bearer {settings.supabase_service_role_key}",
            "Content-Type": "application/json",
        },
        data=payload,
    )
    try:
        raw = urlrequest.urlopen(req, timeout=15).read().decode("utf-8")
    except HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"pg.execute_sql HTTP {e.code}: {body}") from e
    try:
        data = json.loads(raw) if raw else []
    except json.JSONDecodeError as e:
        raise RuntimeError(f"pg.execute_sql respuesta no-JSON: {raw[:200]}") from e
    if isinstance(data, dict) and data.get("error"):
        raise RuntimeError(f"pg.execute_sql SQL error: {data.get('message') or data}")
    return _normalize_rows(data) if isinstance(data, list) else []


def quote_literal(v: Any) -> str:
    """Escapa un literal para concatenar en SQL. No usar para identificadores."""
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    s = str(v).replace("'", "''")
    return f"'{s}'"
