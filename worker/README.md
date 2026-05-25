# worker — Celery

## Setup

```powershell
cd worker
Copy-Item .env.example .env  # editar
uv sync
# arrancar Redis primero (desde infra/): docker compose up -d redis
uv run celery -A celery_app worker -l info --pool=solo   # --pool=solo en Windows
```

Para monitor: http://localhost:5555 (Flower, incluido en infra/docker-compose.yml).

## Tareas registradas

| Nombre | Cuándo se dispara | Descripción |
|---|---|---|
| `tasks.emails.bienvenida` | Tras confirmar cuenta | Email de bienvenida (Supabase ya envió el de confirmación) |
| `tasks.emails.notificar_cita` | Al crear cita | Confirmación inmediata |
| `tasks.recordatorios.recordar_cita` | 24h antes de la cita (ETA) | Email recordatorio |

## Nota sobre Windows

Celery con `prefork` no funciona en Windows. Usar `--pool=solo` (1 worker) o
`--pool=threads`. En producción Linux usa `prefork` normal.
