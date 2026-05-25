from fastapi import APIRouter, HTTPException, status

from app.api.deps import AdminDB, CurrentUser, UserDB
from app.core import pg
from app.schemas.profile import ProfileOut, ProfileUpdate

router = APIRouter()


def _ensure_profile(user_id: str, admin_db) -> dict:
    """Lazy-create: lee raw_user_meta_data de auth.users y crea el profile.
    Sin trigger porque la BD está compartida con otras apps.
    """
    rows = pg.execute_sql(
        f"select * from public.appsalon_profiles where id = {pg.quote_literal(user_id)}"
    )
    if rows:
        return rows[0]

    # leer metadata del usuario vía Supabase Auth admin
    user_obj = admin_db.auth.admin.get_user_by_id(user_id)
    user = getattr(user_obj, "user", user_obj)
    meta = getattr(user, "user_metadata", {}) or {}
    nombre = meta.get("nombre", "")
    apellido = meta.get("apellido", "")
    telefono = meta.get("telefono") or None

    inserted = pg.execute_sql(
        "insert into public.appsalon_profiles (id, nombre, apellido, telefono) "
        f"values ({pg.quote_literal(user_id)}, {pg.quote_literal(nombre)}, "
        f"{pg.quote_literal(apellido)}, {pg.quote_literal(telefono)}) "
        "returning *"
    )
    if not inserted:
        raise HTTPException(status_code=500, detail="No se pudo crear el profile")
    return inserted[0]


@router.get("/me", response_model=ProfileOut)
def get_me(user: CurrentUser, db: UserDB, admin_db: AdminDB):
    resp = db.table("appsalon_profiles").select("*").eq("id", user.id).single().execute()
    if not resp.data:
        return _ensure_profile(user.id, admin_db)
    return resp.data


@router.put("/me", response_model=ProfileOut)
def update_me(payload: ProfileUpdate, user: CurrentUser):
    body = payload.model_dump(exclude_none=True)
    if not body:
        raise HTTPException(status_code=400, detail="Sin cambios")
    set_clause = ", ".join(f"{k} = {pg.quote_literal(v)}" for k, v in body.items())
    rows = pg.execute_sql(
        f"update public.appsalon_profiles set {set_clause} "
        f"where id = {pg.quote_literal(user.id)} returning *"
    )
    if not rows:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile no encontrado")
    return rows[0]
