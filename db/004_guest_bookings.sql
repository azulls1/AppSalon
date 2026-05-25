-- 004_guest_bookings.sql
-- Permite reservar citas sin cuenta. usuario_id pasa a NULLABLE y se
-- agregan campos de contacto guest. La cita siempre tiene o usuario_id
-- (cliente registrado) o los 3 campos guest_* (invitado).

-- 1. Hacer usuario_id nullable
alter table public.appsalon_citas
    alter column usuario_id drop not null;

-- 2. Agregar campos guest
alter table public.appsalon_citas
    add column if not exists guest_nombre   text,
    add column if not exists guest_email    text,
    add column if not exists guest_telefono text;

-- 3. Constraint: o tienes usuario_id O tienes datos guest completos
alter table public.appsalon_citas
    drop constraint if exists chk_appsalon_cita_owner;
alter table public.appsalon_citas
    add constraint chk_appsalon_cita_owner check (
        usuario_id is not null
        or (guest_nombre is not null
            and guest_email is not null
            and guest_telefono is not null)
    );

-- 4. Indice para buscar citas guest por email/telefono (admin)
create index if not exists idx_appsalon_citas_guest_email
    on public.appsalon_citas(guest_email)
    where guest_email is not null;
