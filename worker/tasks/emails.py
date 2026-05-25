from tenacity import retry, stop_after_attempt, wait_exponential

from celery_app import app
from config import settings
from mailer import render, send_email


@app.task(name="tasks.emails.bienvenida", bind=True, max_retries=3)
def bienvenida(self, *, user_id: str, email: str, nombre: str) -> dict:
    """Email de bienvenida tras confirmar la cuenta.

    Nota: la confirmación de cuenta y reset de password los maneja Supabase
    Auth nativamente — este task es solo para el email de bienvenida posterior.
    """
    try:
        html = render(
            "bienvenida.html",
            nombre=nombre,
            app_url=settings.app_base_url,
        )
        send_email(to=email, subject="¡Bienvenido a AppSalon!", html_body=html)
        return {"ok": True, "user_id": user_id}
    except Exception as exc:
        raise self.retry(exc=exc, countdown=2 ** self.request.retries * 30) from exc


@app.task(name="tasks.emails.notificar_cita", bind=True, max_retries=3)
@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=10, max=120))
def notificar_cita(self, *, email: str, nombre: str, fecha: str, hora: str) -> dict:
    """Confirmación inmediata de cita creada."""
    html = render("cita_creada.html", nombre=nombre, fecha=fecha, hora=hora)
    send_email(to=email, subject="Tu cita en AppSalon", html_body=html)
    return {"ok": True}
