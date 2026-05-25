from datetime import date as date_type
from decimal import Decimal

from fastapi import APIRouter, HTTPException, Path, status

from app.api.deps import AdminDB, CurrentUser, UserDB
from app.core import pg
from app.schemas.cita import CitaCreate, CitaOut, CitaServicioOut, DisponibilidadOut
from app.tasks import (
    enqueue_notificar_cita,
    enqueue_recordatorio_cita,
    enqueue_sms_confirmacion,
    enqueue_sms_recordatorio,
)

router = APIRouter()


@router.get("", response_model=list[CitaOut])
def listar_mis_citas(user: CurrentUser, db: UserDB, admin_db: AdminDB):
    citas_resp = (
        db.table("appsalon_citas")
        .select("*")
        .eq("usuario_id", user.id)
        .order("fecha", desc=True)
        .execute()
    )
    citas = citas_resp.data or []
    if not citas:
        return []

    cita_ids = [c["id"] for c in citas]
    pivots = (
        admin_db.table("appsalon_citas_servicios")
        .select("cita_id, servicio_id, precio_snapshot")
        .in_("cita_id", cita_ids)
        .execute()
        .data
        or []
    )
    servicio_ids = list({p["servicio_id"] for p in pivots})
    nombres = _fetch_servicio_nombres(admin_db, servicio_ids)
    staff_ids = list({c["staff_id"] for c in citas if c.get("staff_id")})
    staff_nombres = _fetch_staff_nombres(admin_db, staff_ids)
    return [_build_cita(c, pivots, nombres, staff_nombres) for c in citas]


@router.get("/disponibilidad/{fecha}", response_model=DisponibilidadOut)
def disponibilidad(
    _user: CurrentUser,
    admin_db: AdminDB,
    fecha: date_type = Path(..., description="YYYY-MM-DD"),
):
    """Devuelve las horas ya tomadas (no canceladas) en esa fecha."""
    rows = (
        admin_db.table("appsalon_citas")
        .select("hora")
        .eq("fecha", fecha.isoformat())
        .neq("estado", "cancelada")
        .execute()
        .data
        or []
    )
    ocupados = sorted({r["hora"][:5] for r in rows if r.get("hora")})
    return DisponibilidadOut(fecha=fecha, ocupados=ocupados)


@router.post("", response_model=CitaOut, status_code=status.HTTP_201_CREATED)
def crear_cita(payload: CitaCreate, user: CurrentUser, db: UserDB, admin_db: AdminDB):
    servicios_resp = (
        admin_db.table("appsalon_servicios")
        .select("id, nombre, precio, duracion_min")
        .in_("id", payload.servicio_ids)
        .eq("activo", True)
        .execute()
    )
    servicios = servicios_resp.data or []
    if len(servicios) != len(payload.servicio_ids):
        raise HTTPException(status_code=400, detail="Algún servicio no existe o está inactivo")

    # Validar disponibilidad en el slot (si staff específico, validar por staff)
    existente_q = (
        admin_db.table("appsalon_citas")
        .select("id, staff_id")
        .eq("fecha", payload.fecha.isoformat())
        .eq("hora", payload.hora.isoformat())
        .neq("estado", "cancelada")
        .execute()
        .data
        or []
    )
    if payload.staff_id:
        if any(c.get("staff_id") == payload.staff_id for c in existente_q):
            raise HTTPException(status_code=409, detail="Ese estilista ya está reservado en ese horario")
    else:
        # Si no eligió staff, verificamos que haya al menos un staff disponible
        total_staff = (
            admin_db.table("appsalon_staff")
            .select("id")
            .eq("activo", True)
            .execute()
            .data
            or []
        )
        if total_staff and len([c for c in existente_q if c.get("staff_id")]) >= len(total_staff):
            raise HTTPException(status_code=409, detail="Todos los estilistas están reservados ese horario")

    cita_rows = pg.execute_sql(
        "insert into public.appsalon_citas (usuario_id, fecha, hora, staff_id, notas) values ("
        f"{pg.quote_literal(user.id)}, "
        f"{pg.quote_literal(payload.fecha.isoformat())}, "
        f"{pg.quote_literal(payload.hora.isoformat())}, "
        f"{pg.quote_literal(payload.staff_id)}, "
        f"{pg.quote_literal(payload.notas)}) returning *"
    )
    if not cita_rows:
        raise HTTPException(status_code=400, detail="No se pudo crear la cita")
    cita = cita_rows[0]

    if servicios:
        values_sql = ", ".join(
            f"({pg.quote_literal(cita['id'])}, "
            f"{pg.quote_literal(s['id'])}, "
            f"{pg.quote_literal(str(s['precio']))})"
            for s in servicios
        )
        pg.execute_sql(
            "insert into public.appsalon_citas_servicios "
            f"(cita_id, servicio_id, precio_snapshot) values {values_sql}"
        )

    profile_resp = (
        admin_db.table("appsalon_profiles")
        .select("nombre, apellido, telefono")
        .eq("id", user.id)
        .single()
        .execute()
    )
    prof = profile_resp.data or {}
    nombre = prof.get("nombre", "")
    telefono = prof.get("telefono") or ""

    if user.email:
        enqueue_notificar_cita(
            email=user.email,
            nombre=nombre,
            fecha=payload.fecha.isoformat(),
            hora=payload.hora.isoformat(),
        )
    enqueue_recordatorio_cita(cita["id"], payload.fecha.isoformat(), payload.hora.isoformat())
    enqueue_sms_confirmacion(
        telefono=telefono, nombre=nombre,
        fecha=payload.fecha.isoformat(), hora=payload.hora.isoformat(),
    )
    enqueue_sms_recordatorio(
        telefono=telefono, nombre=nombre,
        fecha=payload.fecha.isoformat(), hora=payload.hora.isoformat(),
    )

    total = sum(Decimal(str(s["precio"])) for s in servicios)
    staff_nombre = None
    if cita.get("staff_id"):
        st = (
            admin_db.table("appsalon_staff")
            .select("nombre, apellido")
            .eq("id", cita["staff_id"])
            .single()
            .execute()
            .data
        )
        if st:
            staff_nombre = f"{st['nombre']} {st['apellido']}".strip()
    return CitaOut(
        id=cita["id"],
        usuario_id=cita["usuario_id"],
        fecha=cita["fecha"],
        hora=cita["hora"],
        estado=cita["estado"],
        notas=cita.get("notas"),
        staff_id=cita.get("staff_id"),
        staff_nombre=staff_nombre,
        created_at=cita["created_at"],
        servicios=[
            CitaServicioOut(
                servicio_id=s["id"], nombre=s["nombre"], precio_snapshot=Decimal(str(s["precio"]))
            )
            for s in servicios
        ],
        total=total,
    )


@router.delete("/{cita_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancelar_cita(cita_id: str, user: CurrentUser):
    rows = pg.execute_sql(
        "update public.appsalon_citas set estado = 'cancelada' "
        f"where id = {pg.quote_literal(cita_id)} "
        f"  and usuario_id = {pg.quote_literal(user.id)} "
        "returning id"
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    return None


# --------------------------------------------------------------------- helpers


def _fetch_servicio_nombres(admin_db, servicio_ids: list[str]) -> dict[str, str]:
    if not servicio_ids:
        return {}
    rows = (
        admin_db.table("appsalon_servicios")
        .select("id, nombre")
        .in_("id", servicio_ids)
        .execute()
        .data
        or []
    )
    return {r["id"]: r["nombre"] for r in rows}


def _fetch_staff_nombres(admin_db, staff_ids: list[str]) -> dict[str, str]:
    if not staff_ids:
        return {}
    rows = (
        admin_db.table("appsalon_staff")
        .select("id, nombre, apellido")
        .in_("id", staff_ids)
        .execute()
        .data
        or []
    )
    return {r["id"]: f"{r['nombre']} {r['apellido']}".strip() for r in rows}


def _build_cita(c: dict, pivots: list[dict], nombres: dict[str, str],
                staff_nombres: dict[str, str] | None = None) -> CitaOut:
    cs = [p for p in pivots if p["cita_id"] == c["id"]]
    servicios = []
    total = Decimal("0.00")
    for p in cs:
        precio = Decimal(str(p["precio_snapshot"]))
        servicios.append(
            CitaServicioOut(
                servicio_id=p["servicio_id"],
                nombre=nombres.get(p["servicio_id"], ""),
                precio_snapshot=precio,
            )
        )
        total += precio
    staff_id = c.get("staff_id")
    return CitaOut(
        id=c["id"],
        usuario_id=c["usuario_id"],
        fecha=c["fecha"],
        hora=c["hora"],
        estado=c["estado"],
        notas=c.get("notas"),
        staff_id=staff_id,
        staff_nombre=(staff_nombres or {}).get(staff_id) if staff_id else None,
        created_at=c["created_at"],
        servicios=servicios,
        total=total,
    )
