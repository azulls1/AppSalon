"""Cliente Celery — el backend solo encola tareas; el worker las ejecuta."""
from datetime import datetime, timedelta, timezone

from celery import Celery

from app.core.config import settings

celery_client = Celery(
    "appsalon",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)


def enqueue_recordatorio_cita(cita_id: str, fecha: str, hora: str) -> None:
    """Programa el recordatorio 24h antes de la cita.

    Si la cita es en menos de 24h, dispara el recordatorio inmediato.
    """
    dt = datetime.fromisoformat(f"{fecha}T{hora}").replace(tzinfo=timezone.utc)
    eta = dt - timedelta(hours=24)
    kwargs = {"cita_id": cita_id, "fecha": fecha, "hora": hora}

    if eta <= datetime.now(timezone.utc):
        celery_client.send_task("tasks.recordatorios.recordar_cita", kwargs=kwargs)
    else:
        celery_client.send_task("tasks.recordatorios.recordar_cita", kwargs=kwargs, eta=eta)


def enqueue_notificar_cita(email: str, nombre: str, fecha: str, hora: str) -> None:
    """Confirmación inmediata de cita creada."""
    celery_client.send_task(
        "tasks.emails.notificar_cita",
        kwargs={"email": email, "nombre": nombre, "fecha": fecha, "hora": hora},
    )


def enqueue_email_bienvenida(user_id: str, email: str, nombre: str) -> None:
    celery_client.send_task(
        "tasks.emails.bienvenida",
        kwargs={"user_id": user_id, "email": email, "nombre": nombre},
    )


def enqueue_sms_confirmacion(telefono: str, nombre: str, fecha: str, hora: str) -> None:
    if not telefono:
        return
    celery_client.send_task(
        "tasks.sms.confirmacion_cita",
        kwargs={"telefono": telefono, "nombre": nombre, "fecha": fecha, "hora": hora},
    )


def enqueue_sms_recordatorio(telefono: str, nombre: str, fecha: str, hora: str) -> None:
    if not telefono:
        return
    dt = datetime.fromisoformat(f"{fecha}T{hora}").replace(tzinfo=timezone.utc)
    eta = dt - timedelta(hours=2)
    kwargs = {"telefono": telefono, "nombre": nombre, "fecha": fecha, "hora": hora}
    if eta <= datetime.now(timezone.utc):
        celery_client.send_task("tasks.sms.recordatorio", kwargs=kwargs)
    else:
        celery_client.send_task("tasks.sms.recordatorio", kwargs=kwargs, eta=eta)
