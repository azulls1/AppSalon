from datetime import date as date_type
from decimal import Decimal

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.api.deps import AdminDB, AdminUser
from app.core import pg
from app.schemas.cita import CitaAdminOut, CitaServicioOut

router = APIRouter()


class CompletarOut(BaseModel):
    cita_id: str
    puntos_otorgados: int


@router.post("/citas/{cita_id}/completar", response_model=CompletarOut)
def completar_cita(cita_id: str, _admin: AdminUser):
    """Marca la cita como completada y otorga puntos al cliente."""
    try:
        rows = pg.execute_sql(
            f"select * from public.appsalon_completar_cita({pg.quote_literal(cita_id)}::uuid)"
        )
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not rows:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    return rows[0]


@router.get("/citas", response_model=list[CitaAdminOut])
def citas_por_fecha(
    _admin: AdminUser,
    db: AdminDB,
    fecha: date_type = Query(..., description="Fecha YYYY-MM-DD"),
):
    """Citas del día con cliente, servicios y total. Hacemos los joins en
    Python porque PostgREST en este Supabase compartido no garantiza
    embedded resources hasta que se reinicie su schema cache."""
    citas = (
        db.table("appsalon_citas")
        .select("id, usuario_id, fecha, hora, estado, notas, staff_id, created_at")
        .eq("fecha", fecha.isoformat())
        .neq("estado", "cancelada")
        .order("hora")
        .execute()
        .data
        or []
    )
    if not citas:
        return []

    cita_ids = [c["id"] for c in citas]
    usuario_ids = list({c["usuario_id"] for c in citas})

    # profiles del cliente
    profiles_rows = (
        db.table("appsalon_profiles")
        .select("id, nombre, apellido, telefono")
        .in_("id", usuario_ids)
        .execute()
        .data
        or []
    )
    profiles = {p["id"]: p for p in profiles_rows}

    # email vive en auth.users (admin api)
    users_resp = db.auth.admin.list_users()
    emails = {u.id: u.email for u in users_resp if u.id in usuario_ids}

    # pivote + nombres de servicios
    pivots = (
        db.table("appsalon_citas_servicios")
        .select("cita_id, servicio_id, precio_snapshot")
        .in_("cita_id", cita_ids)
        .execute()
        .data
        or []
    )
    servicio_ids = list({p["servicio_id"] for p in pivots})
    servicio_rows = (
        db.table("appsalon_servicios")
        .select("id, nombre")
        .in_("id", servicio_ids)
        .execute()
        .data
        or []
    ) if servicio_ids else []
    servicio_nombres = {s["id"]: s["nombre"] for s in servicio_rows}

    # Staff nombres
    staff_ids = list({c["staff_id"] for c in citas if c.get("staff_id")})
    staff_rows = (
        db.table("appsalon_staff")
        .select("id, nombre, apellido")
        .in_("id", staff_ids)
        .execute()
        .data
        or []
    ) if staff_ids else []
    staff_nombres = {r["id"]: f"{r['nombre']} {r['apellido']}".strip() for r in staff_rows}

    out: list[CitaAdminOut] = []
    for c in citas:
        prof = profiles.get(c["usuario_id"], {})
        cs_rows = [p for p in pivots if p["cita_id"] == c["id"]]
        servicios = []
        total = Decimal("0.00")
        for p in cs_rows:
            precio = Decimal(str(p["precio_snapshot"]))
            servicios.append(
                CitaServicioOut(
                    servicio_id=p["servicio_id"],
                    nombre=servicio_nombres.get(p["servicio_id"], ""),
                    precio_snapshot=precio,
                )
            )
            total += precio

        out.append(
            CitaAdminOut(
                id=c["id"],
                usuario_id=c["usuario_id"],
                fecha=c["fecha"],
                hora=c["hora"],
                estado=c["estado"],
                notas=c.get("notas"),
                staff_id=c.get("staff_id"),
                staff_nombre=staff_nombres.get(c.get("staff_id")) if c.get("staff_id") else None,
                created_at=c["created_at"],
                servicios=servicios,
                total=total,
                cliente_nombre=prof.get("nombre", ""),
                cliente_apellido=prof.get("apellido", ""),
                cliente_telefono=prof.get("telefono"),
                cliente_email=emails.get(c["usuario_id"]),
            )
        )
    return out
