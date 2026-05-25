-- 005_promos.sql
-- Sistema de promociones para clientes registrados (separado del catálogo
-- de recompensas con puntos). Ejemplos: "20% off en tu cumple",
-- "Corte gratis tras 5 visitas", "$50 off en producto X".

create table if not exists public.appsalon_promos (
    id          uuid primary key default gen_random_uuid(),
    titulo      text not null,
    descripcion text,
    tipo        text not null check (tipo in (
        'descuento_pct',
        'descuento_fijo',
        'servicio_gratis',
        'producto_gratis'
    )),
    valor       numeric(10,2) not null default 0,
    vigencia_inicio date,
    vigencia_fin    date,
    min_visitas int not null default 0,
    min_puntos  int not null default 0,
    max_canjes_por_usuario int not null default 1,
    codigo      text,
    imagen_url  text,
    destacada   boolean not null default false,
    activa      boolean not null default true,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

create index if not exists idx_appsalon_promos_activa
    on public.appsalon_promos(activa) where activa = true;

create index if not exists idx_appsalon_promos_vigencia
    on public.appsalon_promos(vigencia_fin) where vigencia_fin is not null;

-- Pivote: quién canjeó qué promo (para tope max_canjes_por_usuario y reporte)
create table if not exists public.appsalon_promo_canjes (
    id         uuid primary key default gen_random_uuid(),
    promo_id   uuid not null references public.appsalon_promos(id) on delete cascade,
    usuario_id uuid not null references public.appsalon_profiles(id) on delete cascade,
    cita_id    uuid references public.appsalon_citas(id) on delete set null,
    created_at timestamptz not null default now()
);

create index if not exists idx_appsalon_promo_canjes_promo
    on public.appsalon_promo_canjes(promo_id);
create index if not exists idx_appsalon_promo_canjes_usuario
    on public.appsalon_promo_canjes(usuario_id);

-- updated_at trigger
drop trigger if exists trg_appsalon_promos_updated on public.appsalon_promos;
create trigger trg_appsalon_promos_updated
    before update on public.appsalon_promos
    for each row execute function public.appsalon_touch_updated_at();
