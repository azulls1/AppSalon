from fastapi import APIRouter, HTTPException, status

from app.api.deps import AdminUser, UserDB
from app.core import pg
from app.schemas.galeria import GaleriaCreate, GaleriaOut, GaleriaUpdate

router = APIRouter()


@router.get("", response_model=list[GaleriaOut])
def listar(db: UserDB):
    """RLS filtra activa=true para no-admin."""
    resp = db.table("appsalon_galeria").select("*").order("created_at", desc=True).execute()
    return resp.data or []


@router.post("", response_model=GaleriaOut, status_code=status.HTTP_201_CREATED)
def crear(payload: GaleriaCreate, _admin: AdminUser):
    body = payload.model_dump(mode="json")
    cols = ", ".join(body.keys())
    vals = ", ".join(pg.quote_literal(v) for v in body.values())
    rows = pg.execute_sql(
        f"insert into public.appsalon_galeria ({cols}) values ({vals}) returning *"
    )
    return rows[0]


@router.put("/{galeria_id}", response_model=GaleriaOut)
def actualizar(galeria_id: str, payload: GaleriaUpdate, _admin: AdminUser):
    body = payload.model_dump(mode="json", exclude_none=True)
    if not body:
        raise HTTPException(status_code=400, detail="Sin cambios")
    set_clause = ", ".join(f"{k} = {pg.quote_literal(v)}" for k, v in body.items())
    rows = pg.execute_sql(
        f"update public.appsalon_galeria set {set_clause} "
        f"where id = {pg.quote_literal(galeria_id)} returning *"
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    return rows[0]


@router.delete("/{galeria_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(galeria_id: str, _admin: AdminUser):
    pg.execute_sql(
        f"delete from public.appsalon_galeria where id = {pg.quote_literal(galeria_id)}"
    )
    return None
