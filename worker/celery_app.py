from celery import Celery

from config import settings

app = Celery(
    "appsalon",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=[
        "tasks.emails",
        "tasks.recordatorios",
        "tasks.sms",
    ],
)

app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="America/Mexico_City",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_default_retry_delay=60,
    task_default_max_retries=3,
)

if __name__ == "__main__":
    app.start()
