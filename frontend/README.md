# frontend — Angular 19 + Tailwind 4

## Setup

```powershell
cd frontend
# editar src/environments/environment.ts con tu Supabase URL + anon key
npm install
npm start
```

App: http://localhost:4200

## Stack

| Capa | Tech |
|---|---|
| Framework | Angular 19 (standalone components, signals) |
| Estilos | Tailwind CSS v4 (`@tailwindcss/postcss`) |
| Auth | `@supabase/supabase-js` (frontend) |
| HTTP | `HttpClient` con `authInterceptor` que añade `Bearer <jwt>` |
| Routing | Lazy loading con `loadComponent` + guards |

## Estructura

```
src/app/
├── core/
│   ├── services/      supabase, auth, api
│   ├── models/        Profile, Servicio, Cita
│   ├── guards/        authGuard, adminGuard
│   └── interceptors/  authInterceptor
├── shared/            AuthLayout, AppLayout, BarraNav, Alerta
├── features/
│   ├── auth/          login, registro, olvide, recuperar, mensaje, confirmar
│   ├── citas/         booking (3 pasos), mis-citas
│   ├── admin/         admin-dashboard
│   ├── servicios/     servicios-list, servicio-form
│   └── not-found
└── app.{component,config,routes}.ts
```

## Patrones clave

- **Signals** para estado reactivo en cada componente (`signal`, `computed`).
- **Standalone components** — sin NgModules; cada componente declara sus propios `imports`.
- **Lazy loading** vía `loadComponent` en rutas — bundles separados por feature.
- **Interceptor de auth**: añade `Authorization: Bearer <jwt>` automáticamente a toda llamada HTTP a la API.
- **Guards async**: `adminGuard` consulta `/profile/me` para verificar `is_admin`.
- **Layouts compartidos**: `AuthLayoutComponent` (2 columnas + imagen para login/registro), `AppLayoutComponent` (centrado para cliente/admin).
