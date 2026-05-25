from fastapi import APIRouter, HTTPException, status

from app.api.deps import AdminDB, AdminUser, UserDB
from app.core import pg
from app.schemas.staff import StaffConStats, StaffCreate, StaffOut, StaffUpdate

router = APIRouter()


@router.get("", response_model=list[StaffConStats])
def listar(db: UserDB):
    """Lista del equipo + rating promedio agregado de sus reseñas."""
    rows = (
        db.table("appsalon_staff")
        .select("*")
        .order("nombre")
        .execute()
        .data
        or []
    )
    if not rows:
        return []

    ids = [r["id"] for r in rows]
    # Agregado de reseñas por staff
    stats_rows = pg.execute_sql(
        "select staff_id, avg(rating)::float as avg_rating, count(*) as n "
        "from public.appsalon_resenas "
        f"where staff_id = any (array[{','.join(pg.quote_literal(i) for i in ids)}]::uuid[]) "
        "group by staff_id"
    )
    stats = {r["staff_id"]: r for r in (stats_rows or [])}

    out = []
    for r in rows:
        s = stats.get(r["id"], {})
        out.append({**r, "rating_promedio": s.get("avg_rating"), "total_resenas": int(s.get("n", 0))})
    return out


@router.post("", response_model=StaffOut, status_code=status.HTTP_201_CREATED)
def crear(payload: StaffCreate, _admin: AdminUser):
    body = payload.model_dump(mode="json")
    cols = ", ".join(body.keys())
    vals = ", ".join(pg.quote_literal(v) for v in body.values())
    rows = pg.execute_sql(
        f"insert into public.appsalon_staff ({cols}) values ({vals}) returning *"
    )
    return rows[0]


@router.put("/{staff_id}", response_model=StaffOut)
def actualizar(staff_id: str, payload: StaffUpdate, _admin: AdminUser):
    body = payload.model_dump(mode="json", exclude_none=True)
    if not body:
        raise HTTPException(status_code=400, detail="Sin cambios")
    set_clause = ", ".join(f"{k} = {pg.quote_literal(v)}" for k, v in body.items())
    rows = pg.execute_sql(
        f"update public.appsalon_staff set {set_clause} "
        f"where id = {pg.quote_literal(staff_id)} returning *"
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Staff no encontrado")
    return rows[0]


@router.delete("/{staff_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(staff_id: str, _admin: AdminUser):
    pg.execute_sql(
        f"delete from public.appsalon_staff where id = {pg.quote_literal(staff_id)}"
    )
    return None
