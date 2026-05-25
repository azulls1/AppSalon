from datetime import date as date_type
from decimal import Decimal

from fastapi import APIRouter, HTTPException, Path, status

from app.api.deps import AdminDB, CurrentUser, OptionalUser, UserDB
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
    admin_db: AdminDB,
    fecha: date_type = Path(..., description="YYYY-MM-DD"),
    _user: OptionalUser = None,
):
    """Devuelve las horas ya tomadas (no canceladas) en esa fecha.
    Endpoint público — el booking de invitados también consulta aquí."""
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
def crear_cita(
    payload: CitaCreate,
    admin_db: AdminDB,
    user: OptionalUser = None,
):
    """Crea una cita. Si viene token Bearer válido, queda ligada al
    usuario_id del JWT. Si no, requiere guest_nombre/email/telefono y
    queda como cita de invitado (sin user, sin acumulación de puntos)."""
    # Validar guest si no hay user autenticado
    if user is None:
        missing = [k for k in ("guest_nombre", "guest_email", "guest_telefono")
                   if not getattr(payload, k, None)]
        if missing:
            raise HTTPException(
                status_code=400,
                detail=f"Para reservar sin cuenta se requiere: {', '.join(missing)}",
            )

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

    # Validar promo ANTES de crear la cita: si no es elegible cancelamos
    # todo para no dejar la cita huérfana.
    promo = None
    if user and payload.promo_id:
        promo_resp = (
            admin_db.table("appsalon_promos")
            .select("*")
            .eq("id", payload.promo_id)
            .single()
            .execute()
        )
        promo = promo_resp.data
        if not promo or not promo.get("activa"):
            raise HTTPException(status_code=400, detail="Promoción no disponible")
        today_iso = payload.fecha.isoformat()
        if promo.get("vigencia_inicio") and promo["vigencia_inicio"] > today_iso:
            raise HTTPException(status_code=400, detail="Promoción aún no vigente")
        if promo.get("vigencia_fin") and promo["vigencia_fin"] < today_iso:
            raise HTTPException(status_code=400, detail="Promoción ya expiró")
        canjes_resp = (
            admin_db.table("appsalon_promo_canjes")
            .select("id", count="exact")
            .eq("promo_id", payload.promo_id)
            .eq("usuario_id", user.id)
            .execute()
        )
        if (canjes_resp.count or 0) >= promo["max_canjes_por_usuario"]:
            raise HTTPException(status_code=409, detail="Ya usaste esta promo el máximo de veces")

    cita_rows = pg.execute_sql(
        "insert into public.appsalon_citas "
        "(usuario_id, fecha, hora, staff_id, notas, "
        " guest_nombre, guest_email, guest_telefono) values ("
        f"{pg.quote_literal(user.id if user else None)}, "
        f"{pg.quote_literal(payload.fecha.isoformat())}, "
        f"{pg.quote_literal(payload.hora.isoformat())}, "
        f"{pg.quote_literal(payload.staff_id)}, "
        f"{pg.quote_literal(payload.notas)}, "
        f"{pg.quote_literal(None if user else payload.guest_nombre)}, "
        f"{pg.quote_literal(None if user else payload.guest_email)}, "
        f"{pg.quote_literal(None if user else payload.guest_telefono)}) returning *"
    )
    if not cita_rows:
        raise HTTPException(status_code=400, detail="No se pudo crear la cita")
    cita = cita_rows[0]

    # Registrar el canje de la promo ligado a esta cita
    if promo and user:
        pg.execute_sql(
            "insert into public.appsalon_promo_canjes (promo_id, usuario_id, cita_id) values ("
            f"{pg.quote_literal(promo['id'])}, "
            f"{pg.quote_literal(user.id)}, "
            f"{pg.quote_literal(cita['id'])})"
        )

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

    # Datos de contacto para notificaciones (perfil o guest según el caso)
    if user:
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
        email = user.email
    else:
        nombre = payload.guest_nombre or ""
        telefono = payload.guest_telefono or ""
        email = payload.guest_email

    if email:
        enqueue_notificar_cita(
            email=email,
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
