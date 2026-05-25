from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import AdminDB, CurrentUser
from app.core import pg
from app.schemas.staff import ResenaCreate, ResenaOut

router = APIRouter()


@router.get("", response_model=list[ResenaOut])
def listar(admin_db: AdminDB, staff_id: str | None = Query(default=None)):
    """Lista de reseñas (todas o filtradas por staff)."""
    where = ""
    if staff_id:
        where = f"where r.staff_id = {pg.quote_literal(staff_id)}"
    rows = pg.execute_sql(
        "select r.id, r.cita_id, r.usuario_id, r.staff_id, r.rating, r.comentario, r.created_at,"
        " p.nombre as cliente_nombre "
        "from public.appsalon_resenas r "
        "left join public.appsalon_profiles p on p.id = r.usuario_id "
        f"{where} "
        "order by r.created_at desc "
        "limit 60"
    )
    return rows


@router.post("", response_model=ResenaOut, status_code=status.HTTP_201_CREATED)
def crear(payload: ResenaCreate, user: CurrentUser, admin_db: AdminDB):
    """Solo se puede reseñar una cita propia ya completada o pasada."""
    cita_resp = (
        admin_db.table("appsalon_citas")
        .select("usuario_id, staff_id, fecha, estado")
        .eq("id", payload.cita_id)
        .single()
        .execute()
    )
    cita = cita_resp.data
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    if cita["usuario_id"] != user.id:
        raise HTTPException(status_code=403, detail="No puedes reseñar la cita de otro usuario")
    if cita["estado"] == "cancelada":
        raise HTTPException(status_code=400, detail="No puedes reseñar una cita cancelada")

    staff_lit = pg.quote_literal(cita.get("staff_id"))
    rows = pg.execute_sql(
        "insert into public.appsalon_resenas (cita_id, usuario_id, staff_id, rating, comentario) values ("
        f"{pg.quote_literal(payload.cita_id)}, "
        f"{pg.quote_literal(user.id)}, "
        f"{staff_lit}, "
        f"{pg.quote_literal(payload.rating)}, "
        f"{pg.quote_literal(payload.comentario)}) "
        "on conflict (cita_id, usuario_id) do update set "
        "  rating = excluded.rating, comentario = excluded.comentario "
        "returning *, null::text as cliente_nombre"
    )
    return rows[0]
