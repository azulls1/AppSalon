# AppSalon v2

Sistema de citas para salón de belleza.

| Capa | Tecnología |
|---|---|
| Frontend | Angular 19 (standalone components, signals) + Tailwind CSS 4 |
| Backend API | Python 3.12+ / FastAPI |
| Tareas async | Celery + Redis |
| Base de datos | Supabase (Postgres) autohospedado |
| Auth | Supabase Auth (JWT) |
| Build / infra | Docker Compose, `uv` (Python), `npm` (Node) |

## Estructura

```
AppSalon_v2/
├── README.md
├── docker-compose.yml      Stack completo (Redis + backend + worker + beat + frontend + flower)
├── .env.example
├── .gitignore
│
├── db/                     SQL para Supabase
│   ├── 001_schema.sql      Tablas (UUID, triggers updated_at, handle_new_user)
│   ├── 002_rls.sql         Row Level Security (is_admin(), políticas)
│   ├── 003_seed.sql        11 servicios iniciales
│   └── README.md
│
├── backend/                FastAPI
│   ├── Dockerfile
│   ├── pyproject.toml
│   ├── app/
│   │   ├── main.py         App + CORS + routers
│   │   ├── core/           config, security (JWT), supabase (admin/user)
│   │   ├── api/
│   │   │   ├── deps.py     CurrentUser, AdminUser, UserDB, AdminDB
│   │   │   └── v1/         profile, servicios, citas, admin
│   │   ├── schemas/        Pydantic (profile, servicio, cita)
│   │   └── tasks.py        Cliente Celery → encola con ETA
│   └── tests/              health, auth, schemas (validaciones)
│
├── worker/                 Celery
│   ├── Dockerfile
│   ├── pyproject.toml
│   ├── celery_app.py
│   ├── mailer.py           SMTP wrapper + Jinja2
│   ├── tasks/              emails (bienvenida, notificar_cita), recordatorios
│   └── templates/          bienvenida.html, cita_creada.html, recordatorio.html
│
├── frontend/               Angular 19
│   ├── Dockerfile          Multi-stage (build + nginx)
│   ├── nginx.conf          SPA fallback + cache de assets
│   ├── package.json        @supabase/supabase-js, sweetalert2, tailwindcss v4
│   ├── .postcssrc.json     PostCSS con @tailwindcss/postcss
│   └── src/app/
│       ├── core/
│       │   ├── services/      supabase, auth (signals), api
│       │   ├── models/        Profile, Servicio, Cita, CitaAdmin
│       │   ├── guards/        authGuard, adminGuard
│       │   └── interceptors/  authInterceptor (Bearer JWT)
│       ├── shared/         AuthLayout, AppLayout, BarraNav, Alerta
│       ├── features/
│       │   ├── auth/          login, registro, olvide, recuperar, mensaje, confirmar
│       │   ├── citas/         booking (3 pasos), mis-citas
│       │   ├── admin/         admin-dashboard
│       │   ├── servicios/     list, form (crear/editar)
│       │   └── not-found
│       └── app.{component,config,routes}.ts
│
├── infra/
│   └── docker-compose.yml  Dev: solo Redis + Flower + redis-commander
│
└── scripts/
    ├── install.ps1         Instala todas las deps (uv + npm)
    └── dev.ps1             Arranca backend + worker + frontend en ventanas separadas
```

## Quick start

### Opción A — Local (3 procesos)

```powershell
# 1. Aplicar SQL en Supabase
#    db/001_schema.sql, db/002_rls.sql, db/003_seed.sql

# 2. Configurar .env (3 archivos)
Copy-Item .env.example .env
Copy-Item backend\.env.example backend\.env
Copy-Item worker\.env.example worker\.env
# editar frontend\src\environments\environment.ts con supabaseUrl + anon key

# 3. Instalar y arrancar
.\scripts\install.ps1
.\scripts\dev.ps1
```

### Opción B — Docker (todo en uno)

```powershell
# 1. Aplicar SQL en Supabase (igual que arriba)
# 2. Configurar backend\.env y worker\.env
# 3. Arrancar
docker compose up --build
```

URLs:
- Frontend: http://localhost:4200
- Backend docs: http://localhost:8000/docs
- Flower (Celery UI): http://localhost:5555

## Crear primer admin

Después de registrar tu primer usuario vía la UI:

```sql
update public.profiles set is_admin = true
where id = (select id from auth.users where email = 'tu@email.com');
```

## Funcionalidad

### Cliente
- Registro con confirmación por email (Supabase Auth)
- Login / logout / recuperación de password
- Reserva de cita en 3 pasos (servicios → fecha+hora → resumen)
- Mis citas (listado + cancelación)
- Validación cliente y servidor: lun-vie, horario 10:00–18:00, mínimo 1 servicio

### Admin
- Panel de citas filtradas por fecha (con cliente, servicios, total)
- CRUD de servicios (crear, editar, eliminar lógico vía `activo`)
- Promoción de admin desde SQL (`is_admin = true`)

### Async (Celery + Redis)
- Email de confirmación de cita (inmediato al reservar)
- Email recordatorio 24h antes (`apply_async(eta=...)`)
- Email de bienvenida tras confirmar cuenta

### Seguridad
- Supabase Auth maneja confirmación, reset y hashing de password (bcrypt)
- JWT verificado en backend con `SUPABASE_JWT_SECRET`
- Row Level Security en todas las tablas (función `is_admin()`)
- Queries parametrizadas (sin SQL injection)
- Constraints en BD: estado de cita, horario, día de semana
- `precio_snapshot` congela el precio al momento de reservar

## Tests

```powershell
cd backend
uv run pytest -v
```

Cubre: health, validación JWT, CORS, validaciones de schema (fines de semana, horario 10-18, mínimo de servicios).

## Modelo de datos

```
auth.users (Supabase)              servicios
    │  1                             │ 1
    │                                │
    ▼ 1                              ▼ N
profiles (is_admin)              citas_servicios (precio_snapshot)
    │ 1                              │ N
    │                                │
    └────────────► citas ◄───────────┘
                  (fecha, hora, estado)
```

- `citas.estado`: `pendiente | confirmada | cancelada | completada`
- `citas_servicios` guarda `precio_snapshot` para que el reporte histórico no se vea afectado si cambia el precio del servicio
- Unique index `(fecha, hora)` evita doble booking del mismo slot

## Riesgos / notas

1. **Python 3.14** — Si `uv sync` falla por wheels nativos:
   `uv python install 3.12` y editar `requires-python` a `">=3.12,<3.14"`.
2. **Node 24 + Angular 19** — funciona pero "Unsupported". Si rompe build: Node 22 LTS.
3. **Windows + Celery** — usar `--pool=solo` (incluido en `dev.ps1`); en Docker funciona prefork normal.
