-- =====================================================================
-- AppSalon v2 — Esquema Postgres (Supabase compartido)
-- IMPORTANTE: prefijo `appsalon_` porque esta BD aloja varias apps.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- appsalon_profiles: extiende auth.users
-- ---------------------------------------------------------------------
create table if not exists public.appsalon_profiles (
    id           uuid primary key references auth.users(id) on delete cascade,
    nombre       text        not null,
    apellido     text        not null,
    telefono     text,
    is_admin     boolean     not null default false,
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now()
);

create index if not exists idx_appsalon_profiles_is_admin
    on public.appsalon_profiles(is_admin) where is_admin = true;

-- ---------------------------------------------------------------------
-- appsalon_servicios
-- ---------------------------------------------------------------------
create table if not exists public.appsalon_servicios (
    id            uuid primary key default gen_random_uuid(),
    nombre        text          not null,
    precio        numeric(10,2) not null check (precio >= 0),
    duracion_min  int           not null default 30 check (duracion_min between 5 and 480),
    activo        boolean       not null default true,
    created_at    timestamptz   not null default now(),
    updated_at    timestamptz   not null default now()
);

create index if not exists idx_appsalon_servicios_activo
    on public.appsalon_servicios(activo);

-- ---------------------------------------------------------------------
-- appsalon_citas
-- ---------------------------------------------------------------------
create table if not exists public.appsalon_citas (
    id          uuid primary key default gen_random_uuid(),
    usuario_id  uuid          not null references public.appsalon_profiles(id) on delete cascade,
    fecha       date          not null,
    hora        time          not null,
    estado      text          not null default 'pendiente'
                              check (estado in ('pendiente','confirmada','cancelada','completada')),
    notas       text,
    created_at  timestamptz   not null default now(),
    updated_at  timestamptz   not null default now(),

    constraint chk_appsalon_horario check (hora >= '10:00' and hora < '18:00'),
    constraint chk_appsalon_dia_semana check (extract(isodow from fecha) between 1 and 5)
);

create index if not exists idx_appsalon_citas_usuario on public.appsalon_citas(usuario_id);
create index if not exists idx_appsalon_citas_fecha   on public.appsalon_citas(fecha);
create unique index if not exists uq_appsalon_citas_slot on public.appsalon_citas(fecha, hora)
    where estado <> 'cancelada';

-- ---------------------------------------------------------------------
-- appsalon_citas_servicios (pivote N:M)
-- ---------------------------------------------------------------------
create table if not exists public.appsalon_citas_servicios (
    id              uuid primary key default gen_random_uuid(),
    cita_id         uuid not null references public.appsalon_citas(id)     on delete cascade,
    servicio_id     uuid not null references public.appsalon_servicios(id) on delete restrict,
    precio_snapshot numeric(10,2) not null,
    created_at      timestamptz not null default now(),

    constraint uq_appsalon_cita_servicio unique (cita_id, servicio_id)
);

create index if not exists idx_appsalon_cs_cita     on public.appsalon_citas_servicios(cita_id);
create index if not exists idx_appsalon_cs_servicio on public.appsalon_citas_servicios(servicio_id);

-- ---------------------------------------------------------------------
-- Trigger updated_at — función con prefijo para no chocar con otras apps
-- ---------------------------------------------------------------------
create or replace function public.appsalon_touch_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at := now();
    return new;
end $$;

drop trigger if exists trg_appsalon_profiles_updated on public.appsalon_profiles;
create trigger trg_appsalon_profiles_updated
    before update on public.appsalon_profiles
    for each row execute function public.appsalon_touch_updated_at();

drop trigger if exists trg_appsalon_servicios_updated on public.appsalon_servicios;
create trigger trg_appsalon_servicios_updated
    before update on public.appsalon_servicios
    for each row execute function public.appsalon_touch_updated_at();

drop trigger if exists trg_appsalon_citas_updated on public.appsalon_citas;
create trigger trg_appsalon_citas_updated
    before update on public.appsalon_citas
    for each row execute function public.appsalon_touch_updated_at();

-- NOTA: en la BD compartida NO se instala el trigger on_auth_user_created
-- porque dispararía para signups de TODAS las apps. El backend FastAPI hace
-- lazy-create del profile leyendo raw_user_meta_data al primer GET /profile/me.
