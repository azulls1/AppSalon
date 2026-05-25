-- =====================================================================
-- AppSalon v2 — Datos iniciales (catálogo de servicios)
-- =====================================================================

insert into public.appsalon_servicios (nombre, precio) values
    ('Corte de Cabello Mujer', 120.00),
    ('Corte de Cabello Hombre',  80.00),
    ('Corte de Cabello Niño',    60.00),
    ('Peinado Mujer',            80.00),
    ('Peinado Hombre',           60.00),
    ('Peinado Niño',             60.00),
    ('Corte de Barba',           60.00),
    ('Tinte Mujer',             300.00),
    ('Uñas',                    400.00),
    ('Lavado de Cabello',        50.00),
    ('Tratamiento Capilar',     150.00)
on conflict do nothing;

-- Para hacer admin a un usuario después de que se registre:
--   update public.appsalon_profiles set is_admin = true
--   where id = (select id from auth.users where email = 'admin@appsalon.com');
