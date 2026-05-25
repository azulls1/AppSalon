"""Tareas Celery para envío de SMS vía Twilio.

Si las credenciales de Twilio no están configuradas (TWILIO_* vacíos en .env),
las tareas hacen log y retornan sin error — útil para demos sin cuenta Twilio.
"""
from __future__ import annotations

import logging

from celery_app import app
from config import settings

log = logging.getLogger(__name__)


def _twilio_listo() -> bool:
    return bool(
        settings.twilio_account_sid
        and settings.twilio_auth_token
        and settings.twilio_from_number
    )


def _enviar(numero: str, mensaje: str) -> dict:
    """Envía SMS si Twilio está configurado. Si no, log y simula éxito."""
    if not _twilio_listo():
        log.info("[SMS demo] %s → %r", numero, mensaje)
        return {"status": "demo_logged", "to": numero, "preview": mensaje[:80]}

    # Import perezoso para no requerir twilio si no se usa
    try:
        from twilio.rest import Client  # type: ignore
    except Exception as e:
        log.warning("twilio no instalado (%s); cayendo a modo log", e)
        log.info("[SMS demo] %s → %r", numero, mensaje)
        return {"status": "twilio_not_installed", "to": numero}

    client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
    resp = client.messages.create(
        body=mensaje,
        from_=settings.twilio_from_number,
        to=numero,
    )
    return {"status": "sent", "sid": resp.sid, "to": numero}


@app.task(name="tasks.sms.confirmacion_cita", bind=True, max_retries=2)
def confirmacion_cita(self, telefono: str, nombre: str, fecha: str, hora: str) -> dict:
    if not telefono:
        return {"status": "no_phone"}
    msg = (
        f"Hola {nombre or 'cliente'}, tu cita en AppSalon quedó confirmada "
        f"para el {fecha} a las {hora}. ¡Te esperamos!"
    )
    return _enviar(telefono, msg)


@app.task(name="tasks.sms.recordatorio", bind=True, max_retries=2)
def recordatorio(self, telefono: str, nombre: str, fecha: str, hora: str) -> dict:
    if not telefono:
        return {"status": "no_phone"}
    msg = (
        f"Recordatorio: tu cita en AppSalon es el {fecha} a las {hora}. "
        f"Si no puedes asistir, cancela desde la app. ¡Nos vemos {nombre or ''}!"
    )
    return _enviar(telefono, msg)
