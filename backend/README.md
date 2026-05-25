# backend — FastAPI

## Setup

```powershell
cd backend
Copy-Item .env.example .env   # editar con valores reales
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

Docs interactivas: http://localhost:8000/docs

## Estructura

```
app/
├── main.py             FastAPI app, CORS, routers
├── core/
│   ├── config.py       Settings (pydantic-settings)
│   ├── security.py     Verificación de JWT de Supabase
│   └── supabase.py     Clientes (admin / user)
├── api/
│   ├── deps.py         Dependencies (auth, db, admin)
│   └── v1/
│       ├── profile.py      GET/PUT /me
│       ├── servicios.py    CRUD servicios
│       ├── citas.py        Crear/listar/cancelar citas
│       └── admin.py        Citas por fecha (panel admin)
├── schemas/            Pydantic models
└── tasks.py            Encolar tareas a Celery
```

## Auth

El frontend (Angular) usa **supabase-js** para registro/login y obtiene un JWT.
Ese JWT se envía como `Authorization: Bearer <token>` a esta API.
La API verifica el JWT con `SUPABASE_JWT_SECRET` y delega RLS a Supabase.
```
