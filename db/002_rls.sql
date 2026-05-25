-- =====================================================================
-- AppSalon v2 — Row Level Security (tablas con prefijo appsalon_)
-- =====================================================================

alter table public.appsalon_profiles        enable row level security;
alter table public.appsalon_servicios       enable row level security;
alter table public.appsalon_citas           enable row level security;
alter table public.appsalon_citas_servicios enable row level security;

-- ---------------------------------------------------------------------
-- Helper con prefijo (la versión sin prefijo podría chocar con otra app)
-- ---------------------------------------------------------------------
create or replace function public.appsalon_is_admin()
returns boolean language sql stable security definer set search_path = public as $$
    select coalesce(
        (select is_admin from public.appsalon_profiles where id = auth.uid()),
        false
    );
$$;

-- ---------------------------------------------------------------------
-- appsalon_profiles
-- ---------------------------------------------------------------------
drop policy if exists "appsalon_profiles: ver el propio" on public.appsalon_profiles;
create policy "appsalon_profiles: ver el propio"
    on public.appsalon_profiles for select
    using (auth.uid() = id or public.appsalon_is_admin());

drop policy if exists "appsalon_profiles: actualizar el propio" on public.appsalon_profiles;
create policy "appsalon_profiles: actualizar el propio"
    on public.appsalon_profiles for update
    using (auth.uid() = id);

drop policy if exists "appsalon_profiles: insert propio" on public.appsalon_profiles;
create policy "appsalon_profiles: insert propio"
    on public.appsalon_profiles for insert
    with check (auth.uid() = id);

-- ---------------------------------------------------------------------
-- appsalon_servicios
-- ---------------------------------------------------------------------
drop policy if exists "appsalon_servicios: lectura" on public.appsalon_servicios;
create policy "appsalon_servicios: lectura"
    on public.appsalon_servicios for select
    using (activo = true or public.appsalon_is_admin());

drop policy if exists "appsalon_servicios: admin crea" on public.appsalon_servicios;
create policy "appsalon_servicios: admin crea"
    on public.appsalon_servicios for insert
    with check (public.appsalon_is_admin());

drop policy if exists "appsalon_servicios: admin actualiza" on public.appsalon_servicios;
create policy "appsalon_servicios: admin actualiza"
    on public.appsalon_servicios for update
    using (public.appsalon_is_admin());

drop policy if exists "appsalon_servicios: admin elimina" on public.appsalon_servicios;
create policy "appsalon_servicios: admin elimina"
    on public.appsalon_servicios for delete
    using (public.appsalon_is_admin());

-- ---------------------------------------------------------------------
-- appsalon_citas
-- ---------------------------------------------------------------------
drop policy if exists "appsalon_citas: ver propias o admin" on public.appsalon_citas;
create policy "appsalon_citas: ver propias o admin"
    on public.appsalon_citas for select
    using (usuario_id = auth.uid() or public.appsalon_is_admin());

drop policy if exists "appsalon_citas: crear propias" on public.appsalon_citas;
create policy "appsalon_citas: crear propias"
    on public.appsalon_citas for insert
    with check (usuario_id = auth.uid());

drop policy if exists "appsalon_citas: actualizar propias o admin" on public.appsalon_citas;
create policy "appsalon_citas: actualizar propias o admin"
    on public.appsalon_citas for update
    using (usuario_id = auth.uid() or public.appsalon_is_admin());

drop policy if exists "appsalon_citas: eliminar admin" on public.appsalon_citas;
create policy "appsalon_citas: eliminar admin"
    on public.appsalon_citas for delete
    using (public.appsalon_is_admin());

-- ---------------------------------------------------------------------
-- appsalon_citas_servicios
-- ---------------------------------------------------------------------
drop policy if exists "appsalon_cs: ver según cita" on public.appsalon_citas_servicios;
create policy "appsalon_cs: ver según cita"
    on public.appsalon_citas_servicios for select
    using (exists (
        select 1 from public.appsalon_citas c
        where c.id = appsalon_citas_servicios.cita_id
          and (c.usuario_id = auth.uid() or public.appsalon_is_admin())
    ));

drop policy if exists "appsalon_cs: insertar en cita propia" on public.appsalon_citas_servicios;
create policy "appsalon_cs: insertar en cita propia"
    on public.appsalon_citas_servicios for insert
    with check (exists (
        select 1 from public.appsalon_citas c
        where c.id = cita_id and c.usuario_id = auth.uid()
    ));

drop policy if exists "appsalon_cs: eliminar admin" on public.appsalon_citas_servicios;
create policy "appsalon_cs: eliminar admin"
    on public.appsalon_citas_servicios for delete
    using (public.appsalon_is_admin());
