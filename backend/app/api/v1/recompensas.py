from fastapi import APIRouter, HTTPException, status

from app.api.deps import AdminUser, CurrentUser, UserDB
from app.core import pg
from app.schemas.recompensa import (
    CanjearOut,
    CanjeOut,
    RecompensaCreate,
    RecompensaOut,
    RecompensaUpdate,
)

router = APIRouter()


@router.get("", response_model=list[RecompensaOut])
def listar(db: UserDB):
    resp = (
        db.table("appsalon_recompensas")
        .select("*")
        .order("puntos_costo")
        .execute()
    )
    return resp.data or []


@router.post("", response_model=RecompensaOut, status_code=status.HTTP_201_CREATED)
def crear(payload: RecompensaCreate, _admin: AdminUser):
    body = payload.model_dump(mode="json")
    cols = ", ".join(body.keys())
    vals = ", ".join(pg.quote_literal(v) for v in body.values())
    rows = pg.execute_sql(
        f"insert into public.appsalon_recompensas ({cols}) values ({vals}) returning *"
    )
    return rows[0]


@router.put("/{rec_id}", response_model=RecompensaOut)
def actualizar(rec_id: str, payload: RecompensaUpdate, _admin: AdminUser):
    body = payload.model_dump(mode="json", exclude_none=True)
    if not body:
        raise HTTPException(status_code=400, detail="Sin cambios")
    set_clause = ", ".join(f"{k} = {pg.quote_literal(v)}" for k, v in body.items())
    rows = pg.execute_sql(
        f"update public.appsalon_recompensas set {set_clause} "
        f"where id = {pg.quote_literal(rec_id)} returning *"
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Recompensa no encontrada")
    return rows[0]


@router.delete("/{rec_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(rec_id: str, _admin: AdminUser):
    pg.execute_sql(
        f"delete from public.appsalon_recompensas where id = {pg.quote_literal(rec_id)}"
    )
    return None


@router.post("/{rec_id}/canjear", response_model=CanjearOut, status_code=status.HTTP_201_CREATED)
def canjear(rec_id: str, user: CurrentUser):
    """Canjea una recompensa. Descuenta puntos y emite código transaccionalmente."""
    try:
        rows = pg.execute_sql(
            "select * from public.appsalon_canjear_recompensa("
            f"{pg.quote_literal(rec_id)}::uuid, "
            f"{pg.quote_literal(user.id)}::uuid)"
        )
    except RuntimeError as e:
        msg = str(e)
        for token in ("SQL error:", "ERROR:"):
            if token in msg:
                msg = msg.split(token, 1)[-1]
        raise HTTPException(status_code=400, detail=msg.strip()[:200])
    if not rows:
        raise HTTPException(status_code=404, detail="No se pudo canjear")
    return rows[0]


@router.get("/canjes/mios", response_model=list[CanjeOut])
def mis_canjes(user: CurrentUser):
    rows = pg.execute_sql(
        "select c.*, r.nombre as recompensa_nombre "
        "from public.appsalon_canjes c "
        "left join public.appsalon_recompensas r on r.id = c.recompensa_id "
        f"where c.usuario_id = {pg.quote_literal(user.id)} "
        "order by c.created_at desc"
    )
    return rows
