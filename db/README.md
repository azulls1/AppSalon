# db/

Migraciones SQL para Supabase (Postgres).

## Aplicar en orden

Desde el SQL Editor de Supabase (o psql):

```sql
\i 001_schema.sql
\i 002_rls.sql
\i 003_seed.sql
```

## Decisiones de modelado

- **IDs UUID** con `gen_random_uuid()` — evita enumeración de recursos.
- **Autenticación**: tabla `auth.users` (Supabase) + `profiles` (datos del salón). Trigger `handle_new_user` crea el profile cuando se registra alguien.
- **Confirmación de cuenta**: Supabase Auth la maneja nativamente (no hay columna `confirmado` ni `token`).
- **Admin**: columna `is_admin` boolean + función `is_admin()` usada en políticas RLS.
- **RLS** habilitado en todas las tablas. Cada usuario ve/modifica solo lo suyo; admin ve todo.
- **Validaciones en BD**:
  - `citas.hora`: `between 10:00 and 18:00`
  - `citas.fecha`: `extract(isodow) between 1 and 5` (lunes a viernes)
  - `citas.estado`: enum `pendiente | confirmada | cancelada | completada`
- **`precio_snapshot`** en `citas_servicios` congela el precio del servicio al momento de reservar; si después cambias el precio del servicio, los reportes históricos no se distorsionan.
- **`unique index (fecha, hora)` parcial** (excluye canceladas) evita doble booking.
- **snake_case** en todos los identificadores (convención Postgres).

## Crear un admin manualmente

1. Registrar el usuario vía la UI (`/crear-cuenta`).
2. En SQL Editor:
   ```sql
   update public.profiles set is_admin = true
   where id = (select id from auth.users where email = 'admin@appsalon.com');
   ```

## Tablas

| Tabla | Propósito |
|---|---|
| `auth.users` | Manejado por Supabase Auth (email, password bcrypt, confirmed_at, etc.) |
| `public.profiles` | Datos del usuario en el salón (nombre, apellido, teléfono, `is_admin`) |
| `public.servicios` | Catálogo de servicios (nombre, precio, `activo`) |
| `public.citas` | Reservas (fecha, hora, estado, usuario_id) |
| `public.citas_servicios` | Pivote N:M con `precio_snapshot` |
