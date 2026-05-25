from fastapi import APIRouter, HTTPException, status

from app.api.deps import AdminUser, UserDB
from app.core import pg
from app.schemas.servicio import ServicioCreate, ServicioOut, ServicioUpdate

router = APIRouter()


@router.get("", response_model=list[ServicioOut])
def listar(db: UserDB):
    """Lectura via PostgREST (RLS aplica)."""
    resp = db.table("appsalon_servicios").select("*").order("nombre").execute()
    return resp.data or []


@router.post("", response_model=ServicioOut, status_code=status.HTTP_201_CREATED)
def crear(payload: ServicioCreate, _admin: AdminUser):
    rows = pg.execute_sql(
        "insert into public.appsalon_servicios (nombre, precio, activo) values ("
        f"{pg.quote_literal(payload.nombre)}, "
        f"{pg.quote_literal(str(payload.precio))}, "
        f"{pg.quote_literal(payload.activo)}) returning *"
    )
    return rows[0]


@router.put("/{servicio_id}", response_model=ServicioOut)
def actualizar(servicio_id: str, payload: ServicioUpdate, _admin: AdminUser):
    body = payload.model_dump(mode="json", exclude_none=True)
    if not body:
        raise HTTPException(status_code=400, detail="Sin cambios")
    set_clause = ", ".join(f"{k} = {pg.quote_literal(v)}" for k, v in body.items())
    rows = pg.execute_sql(
        f"update public.appsalon_servicios set {set_clause} "
        f"where id = {pg.quote_literal(servicio_id)} returning *"
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    return rows[0]


@router.delete("/{servicio_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(servicio_id: str, _admin: AdminUser):
    pg.execute_sql(
        f"delete from public.appsalon_servicios where id = {pg.quote_literal(servicio_id)}"
    )
    return None
