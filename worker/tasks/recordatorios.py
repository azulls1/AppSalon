"""Recordatorios programados de citas — uso real para Celery.

Estrategia: cuando se crea una cita, el backend encola un task `recordar_cita`
con ETA = fecha/hora de la cita menos 24 horas. Celery lo dispara automáticamente.
"""
from datetime import datetime, timedelta, timezone

from supabase import create_client

from celery_app import app
from config import settings
from mailer import render, send_email


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


@app.task(name="tasks.recordatorios.recordar_cita", bind=True, max_retries=3)
def recordar_cita(self, *, cita_id: str, fecha: str, hora: str) -> dict:
    """Envía recordatorio 24h antes de la cita.

    Se autoreprograma con `apply_async(eta=...)` desde el backend al crearse.
    Si lo invocamos ahora, manda inmediato; si quieres delay real,
    el backend debe llamar `recordar_cita.apply_async(kwargs=..., eta=t-24h)`.
    """
    db = create_client(settings.supabase_url, settings.supabase_service_role_key)

    cita_resp = (
        db.table("citas")
        .select("id, estado, usuario_id, profiles(nombre, apellido)")
        .eq("id", cita_id)
        .single()
        .execute()
    )
    cita = cita_resp.data
    if not cita or cita["estado"] == "cancelada":
        return {"skipped": True, "reason": "cita cancelada o inexistente"}

    user_resp = db.auth.admin.get_user_by_id(cita["usuario_id"])
    if not user_resp or not user_resp.user or not user_resp.user.email:
        return {"skipped": True, "reason": "sin email"}

    prof = cita.get("profiles") or {}
    html = render(
        "recordatorio.html",
        nombre=prof.get("nombre", ""),
        fecha=fecha,
        hora=hora,
    )
    send_email(to=user_resp.user.email, subject="Recordatorio: tu cita es mañana", html_body=html)
    return {"sent": True, "cita_id": cita_id}


def schedule_recordatorio(cita_id: str, fecha: str, hora: str) -> None:
    """Helper para programar el recordatorio 24h antes."""
    dt = datetime.fromisoformat(f"{fecha}T{hora}").replace(tzinfo=timezone.utc)
    eta = dt - timedelta(hours=24)
    if eta <= _now_utc():
        # cita muy próxima; dispara ya
        recordar_cita.delay(cita_id=cita_id, fecha=fecha, hora=hora)
    else:
        recordar_cita.apply_async(
            kwargs={"cita_id": cita_id, "fecha": fecha, "hora": hora}, eta=eta
        )
