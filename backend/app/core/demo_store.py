"""Demo store en memoria: mock del cliente Supabase para correr el proyecto sin BD real.

Soporta el subset del fluent API de supabase-py que usan los routers:
  db.table("x").select("...").eq("col","v").execute()
  .insert(dict | list), .update(dict), .delete()
  .eq, .neq, .in_, .order(..., desc=True), .single()
  db.auth.admin.list_users() → lista de objetos con .id .email
"""
from __future__ import annotations

import threading
import uuid
from copy import deepcopy
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _new_id() -> str:
    return str(uuid.uuid4())


# ------------------------------------------------------------------- estado
_LOCK = threading.Lock()

# tablas: cada una es una lista de dicts
_TABLES: dict[str, list[dict[str, Any]]] = {
    "profiles": [],
    "servicios": [],
    "citas": [],
    "citas_servicios": [],
}

# usuarios: id → email (para el mock de auth.admin.list_users)
_USERS: dict[str, str] = {}


def reset() -> None:
    """Limpia el store. Útil en tests."""
    with _LOCK:
        for t in _TABLES.values():
            t.clear()
        _USERS.clear()


def seed_if_empty() -> None:
    """Datos iniciales para que las pantallas no estén vacías en demo."""
    with _LOCK:
        if _TABLES["servicios"]:
            return
        for nombre, precio in [
            ("Corte de Cabello", "150.00"),
            ("Tinte", "450.00"),
            ("Manicure", "120.00"),
            ("Pedicure", "150.00"),
            ("Tratamiento Capilar", "350.00"),
            ("Peinado para Eventos", "500.00"),
        ]:
            _TABLES["servicios"].append(
                {
                    "id": _new_id(),
                    "nombre": nombre,
                    "precio": precio,
                    "activo": True,
                    "created_at": _now(),
                    "updated_at": _now(),
                }
            )


def upsert_user(user_id: str, email: str, nombre: str, apellido: str,
                telefono: str | None, is_admin: bool) -> None:
    """Crea o actualiza profile + usuario en el store."""
    with _LOCK:
        _USERS[user_id] = email
        existing = next((p for p in _TABLES["profiles"] if p["id"] == user_id), None)
        if existing:
            existing["nombre"] = nombre
            existing["apellido"] = apellido
            existing["telefono"] = telefono
            existing["is_admin"] = is_admin
            existing["updated_at"] = _now()
        else:
            _TABLES["profiles"].append(
                {
                    "id": user_id,
                    "nombre": nombre,
                    "apellido": apellido,
                    "telefono": telefono,
                    "is_admin": is_admin,
                    "created_at": _now(),
                    "updated_at": _now(),
                }
            )


# ----------------------------------------------------------- API mock cliente


@dataclass
class _Result:
    data: Any


class _Query:
    """Constructor fluido inmutable-ish. Cada método retorna self con un filtro/op acumulado."""

    def __init__(self, table: str):
        self._table = table
        self._op: str = "select"
        self._payload: Any = None
        self._select_cols: str = "*"
        self._filters: list[tuple[str, str, Any]] = []  # (col, kind, val)
        self._order: tuple[str, bool] | None = None
        self._single: bool = False

    # ---- operaciones
    def select(self, cols: str = "*") -> "_Query":
        self._op = "select"
        self._select_cols = cols
        return self

    def insert(self, data: dict | list[dict]) -> "_Query":
        self._op = "insert"
        self._payload = data if isinstance(data, list) else [data]
        return self

    def update(self, data: dict) -> "_Query":
        self._op = "update"
        self._payload = data
        return self

    def delete(self) -> "_Query":
        self._op = "delete"
        return self

    # ---- filtros
    def eq(self, col: str, val: Any) -> "_Query":
        self._filters.append((col, "eq", val))
        return self

    def neq(self, col: str, val: Any) -> "_Query":
        self._filters.append((col, "neq", val))
        return self

    def in_(self, col: str, vals: list[Any]) -> "_Query":
        self._filters.append((col, "in", list(vals)))
        return self

    def order(self, col: str, desc: bool = False) -> "_Query":
        self._order = (col, desc)
        return self

    def single(self) -> "_Query":
        self._single = True
        return self

    # ---- ejecución
    def execute(self) -> _Result:
        with _LOCK:
            rows = list(_TABLES.setdefault(self._table, []))
            rows = [r for r in rows if self._matches(r)]

            if self._op == "select":
                rows = self._with_joins(rows)
                if self._order:
                    col, desc = self._order
                    rows.sort(key=lambda r: (r.get(col) is None, r.get(col)), reverse=desc)
                if self._single:
                    return _Result(data=rows[0] if rows else None)
                return _Result(data=deepcopy(rows))

            if self._op == "insert":
                inserted = []
                for raw in self._payload or []:
                    row = dict(raw)
                    row.setdefault("id", _new_id())
                    row.setdefault("created_at", _now())
                    row.setdefault("updated_at", _now())
                    if self._table == "citas":
                        row.setdefault("estado", "pendiente")
                    _TABLES[self._table].append(row)
                    inserted.append(deepcopy(row))
                return _Result(data=inserted)

            if self._op == "update":
                updated = []
                for r in _TABLES[self._table]:
                    if self._matches(r):
                        r.update(self._payload or {})
                        r["updated_at"] = _now()
                        updated.append(deepcopy(r))
                return _Result(data=updated)

            if self._op == "delete":
                kept = [r for r in _TABLES[self._table] if not self._matches(r)]
                deleted = [r for r in _TABLES[self._table] if self._matches(r)]
                _TABLES[self._table] = kept
                # cascada simple: si borramos una cita, borrar su pivote
                if self._table == "citas":
                    for d in deleted:
                        _TABLES["citas_servicios"] = [
                            cs for cs in _TABLES["citas_servicios"] if cs["cita_id"] != d["id"]
                        ]
                # si borramos un servicio, borrar pivotes asociados
                if self._table == "servicios":
                    for d in deleted:
                        _TABLES["citas_servicios"] = [
                            cs for cs in _TABLES["citas_servicios"] if cs["servicio_id"] != d["id"]
                        ]
                return _Result(data=deleted)

            raise RuntimeError(f"op no soportada: {self._op}")

    # ---- internos
    def _matches(self, row: dict) -> bool:
        for col, kind, val in self._filters:
            actual = row.get(col)
            if kind == "eq" and actual != val:
                return False
            if kind == "neq" and actual == val:
                return False
            if kind == "in" and actual not in val:
                return False
        return True

    def _with_joins(self, rows: list[dict]) -> list[dict]:
        """Expande sintaxis Postgrest tipo:
            citas_servicios(servicio_id, precio_snapshot, servicios(nombre))
            profiles!fk(nombre, apellido, telefono)
        Solo cubre los joins que usan los routers actuales.
        """
        cols = self._select_cols
        if not cols or cols == "*" or "(" not in cols:
            return [deepcopy(r) for r in rows]

        out = []
        for r in rows:
            r = deepcopy(r)

            # join citas → citas_servicios → servicios
            if self._table == "citas" and "citas_servicios" in cols:
                pivots = [cs for cs in _TABLES["citas_servicios"] if cs["cita_id"] == r["id"]]
                enriched = []
                for cs in pivots:
                    s = next(
                        (s for s in _TABLES["servicios"] if s["id"] == cs["servicio_id"]),
                        None,
                    )
                    enriched.append(
                        {
                            "servicio_id": cs["servicio_id"],
                            "precio_snapshot": cs["precio_snapshot"],
                            "servicios": {"nombre": s["nombre"] if s else ""},
                        }
                    )
                r["citas_servicios"] = enriched

            # join citas → profiles
            if self._table == "citas" and "profiles" in cols:
                prof = next(
                    (p for p in _TABLES["profiles"] if p["id"] == r["usuario_id"]),
                    None,
                )
                if prof:
                    r["profiles"] = {
                        "nombre": prof.get("nombre", ""),
                        "apellido": prof.get("apellido", ""),
                        "telefono": prof.get("telefono"),
                    }
                else:
                    r["profiles"] = None

            out.append(r)
        return out


@dataclass
class _AuthUser:
    id: str
    email: str


class _AdminAuth:
    def list_users(self):
        with _LOCK:
            return [_AuthUser(id=uid, email=email) for uid, email in _USERS.items()]


class _Auth:
    admin = _AdminAuth()


class DemoClient:
    """Reemplazo en memoria del cliente Supabase. Solo cubre lo que usan los routers."""

    auth = _Auth()

    def table(self, name: str) -> _Query:
        return _Query(name)
