from datetime import date as date_type

from fastapi import APIRouter, HTTPException, status

from app.api.deps import AdminDB, AdminUser, CurrentUser, OptionalUser, UserDB
from app.core import pg
from app.schemas.promo import PromoCliente, PromoCreate, PromoOut, PromoUpdate

router = APIRouter()


# --------------------------------------------------------------------- ADMIN

@router.get("/admin", response_model=list[PromoOut])
def listar_todas_admin(_admin: AdminUser, db: UserDB):
    """Admin ve todas las promos (activas e inactivas)."""
    resp = (
        db.table("appsalon_promos")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )
    return resp.data or []


@router.post("", response_model=PromoOut, status_code=status.HTTP_201_CREATED)
def crear(payload: PromoCreate, _admin: AdminUser):
    body = payload.model_dump(mode="json")
    cols = ", ".join(body.keys())
    vals = ", ".join(pg.quote_literal(v) for v in body.values())
    rows = pg.execute_sql(
        f"insert into public.appsalon_promos ({cols}) values ({vals}) returning *"
    )
    return rows[0]


@router.put("/{promo_id}", response_model=PromoOut)
def actualizar(promo_id: str, payload: PromoUpdate, _admin: AdminUser):
    body = payload.model_dump(mode="json", exclude_none=True)
    if not body:
        raise HTTPException(status_code=400, detail="Sin cambios")
    set_clause = ", ".join(f"{k} = {pg.quote_literal(v)}" for k, v in body.items())
    rows = pg.execute_sql(
        f"update public.appsalon_promos set {set_clause} "
        f"where id = {pg.quote_literal(promo_id)} returning *"
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Promo no encontrada")
    return rows[0]


@router.delete("/{promo_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(promo_id: str, _admin: AdminUser):
    pg.execute_sql(
        f"delete from public.appsalon_promos where id = {pg.quote_literal(promo_id)}"
    )
    return None


# --------------------------------------------------------------------- CLIENTE

@router.get("", response_model=list[PromoCliente])
def listar_cliente(user: CurrentUser, admin_db: AdminDB):
    """Devuelve promos activas y vigentes, con flag de elegibilidad
    calculada contra el historial del cliente (visitas, puntos, canjes)."""
    today = date_type.today().isoformat()

    promos_resp = (
        admin_db.table("appsalon_promos")
        .select("*")
        .eq("activa", True)
        .order("destacada", desc=True)
        .order("created_at", desc=True)
        .execute()
    )
    promos = promos_resp.data or []
    # Filtrar por vigencia
    promos = [
        p for p in promos
        if (not p.get("vigencia_inicio") or p["vigencia_inicio"] <= today)
        and (not p.get("vigencia_fin") or p["vigencia_fin"] >= today)
    ]
    if not promos:
        return []

    # Stats del cliente: visitas completadas + puntos actuales
    visitas_resp = (
        admin_db.table("appsalon_citas")
        .select("id", count="exact")
        .eq("usuario_id", user.id)
        .eq("estado", "completada")
        .execute()
    )
    visitas = visitas_resp.count or 0

    prof_resp = (
        admin_db.table("appsalon_profiles")
        .select("puntos")
        .eq("id", user.id)
        .single()
        .execute()
    )
    puntos = (prof_resp.data or {}).get("puntos", 0) or 0

    # Canjes ya hechos por esta persona (por promo)
    canjes_resp = (
        admin_db.table("appsalon_promo_canjes")
        .select("promo_id")
        .eq("usuario_id", user.id)
        .execute()
    )
    canjes_por_promo: dict[str, int] = {}
    for c in (canjes_resp.data or []):
        canjes_por_promo[c["promo_id"]] = canjes_por_promo.get(c["promo_id"], 0) + 1

    out: list[dict] = []
    for p in promos:
        usados = canjes_por_promo.get(p["id"], 0)
        elegible = True
        motivo = None
        if usados >= p["max_canjes_por_usuario"]:
            elegible = False
            motivo = "Ya canjeaste esta promoción"
        elif visitas < p["min_visitas"]:
            elegible = False
            faltan = p["min_visitas"] - visitas
            motivo = f"Te faltan {faltan} visita{'s' if faltan != 1 else ''}"
        elif puntos < p["min_puntos"]:
            elegible = False
            motivo = f"Te faltan {p['min_puntos'] - puntos} puntos"
        out.append({**p, "elegible": elegible, "canjes_usados": usados,
                    "motivo_no_elegible": motivo})

    return out


# Endpoint para que el cliente registre un canje (lo aplica al confirmar cita
# o lo marca para usarlo en sucursal). MVP: solo registra, no descuenta.
@router.post("/{promo_id}/canjear", status_code=status.HTTP_201_CREATED)
def canjear(promo_id: str, user: CurrentUser, admin_db: AdminDB):
    promo_resp = (
        admin_db.table("appsalon_promos")
        .select("*")
        .eq("id", promo_id)
        .single()
        .execute()
    )
    promo = promo_resp.data
    if not promo or not promo.get("activa"):
        raise HTTPException(status_code=404, detail="Promo no disponible")

    canjes_resp = (
        admin_db.table("appsalon_promo_canjes")
        .select("id", count="exact")
        .eq("promo_id", promo_id)
        .eq("usuario_id", user.id)
        .execute()
    )
    if (canjes_resp.count or 0) >= promo["max_canjes_por_usuario"]:
        raise HTTPException(status_code=409, detail="Ya canjeaste esta promo el máximo de veces")

    rows = pg.execute_sql(
        "insert into public.appsalon_promo_canjes (promo_id, usuario_id) values ("
        f"{pg.quote_literal(promo_id)}, {pg.quote_literal(user.id)}) returning *"
    )
    return {"canje_id": rows[0]["id"], "promo_id": promo_id}
