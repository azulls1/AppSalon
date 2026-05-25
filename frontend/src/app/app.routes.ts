import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';
import { AppLayoutComponent } from './shared/app-layout.component';
import { AuthLayoutComponent } from './shared/auth-layout.component';

export const routes: Routes = [
  // landing pública — la home no requiere login
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/landing.component').then(m => m.LandingComponent),
  },
  // páginas públicas adicionales (sin auth layout)
  {
    path: 'equipo',
    loadComponent: () => import('./features/equipo.component').then(m => m.EquipoComponent),
  },
  {
    path: 'ubicacion',
    loadComponent: () => import('./features/ubicacion.component').then(m => m.UbicacionComponent),
  },
  {
    path: 'galeria',
    loadComponent: () => import('./features/galeria.component').then(m => m.GaleriaPublicaComponent),
  },

  // ---------------------------------------------------------- rutas públicas (auth)
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: 'login',        loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) },
      { path: 'crear-cuenta', loadComponent: () => import('./features/auth/registro.component').then(m => m.RegistroComponent) },
      { path: 'olvide',       loadComponent: () => import('./features/auth/olvide.component').then(m => m.OlvideComponent) },
      { path: 'recuperar',    loadComponent: () => import('./features/auth/recuperar.component').then(m => m.RecuperarComponent) },
      { path: 'mensaje',      loadComponent: () => import('./features/auth/mensaje.component').then(m => m.MensajeComponent) },
      { path: 'confirmar',    loadComponent: () => import('./features/auth/confirmar.component').then(m => m.ConfirmarComponent) },
    ],
  },

  // ---------------------------------------------------------- /cita es pública
  // El usuario puede explorar servicios, fechas y barberos sin login.
  // El check de auth se hace al pulsar "Reservar" (último paso).
  {
    path: '',
    component: AppLayoutComponent,
    children: [
      { path: 'cita', loadComponent: () => import('./features/citas/booking.component').then(m => m.BookingComponent) },
    ],
  },

  // ---------------------------------------------------------- rutas privadas (cliente)
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'mis-citas',    loadComponent: () => import('./features/citas/mis-citas.component').then(m => m.MisCitasComponent) },
      { path: 'recompensas',  loadComponent: () => import('./features/recompensas.component').then(m => m.RecompensasComponent) },
      { path: 'promociones',  loadComponent: () => import('./features/promociones.component').then(m => m.PromocionesComponent) },
    ],
  },

  // ---------------------------------------------------------- rutas privadas (admin)
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [adminGuard],
    children: [
      { path: 'admin',                  loadComponent: () => import('./features/admin/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'servicios',              loadComponent: () => import('./features/servicios/servicios-list.component').then(m => m.ServiciosListComponent) },
      { path: 'servicios/crear',        loadComponent: () => import('./features/servicios/servicio-form.component').then(m => m.ServicioFormComponent) },
      { path: 'servicios/editar/:id',   loadComponent: () => import('./features/servicios/servicio-form.component').then(m => m.ServicioFormComponent) },
      { path: 'admin/staff',            loadComponent: () => import('./features/admin/staff-list.component').then(m => m.StaffListComponent) },
      { path: 'admin/staff/crear',      loadComponent: () => import('./features/admin/staff-form.component').then(m => m.StaffFormComponent) },
      { path: 'admin/staff/editar/:id', loadComponent: () => import('./features/admin/staff-form.component').then(m => m.StaffFormComponent) },
      { path: 'admin/galeria',          loadComponent: () => import('./features/admin/galeria-list.component').then(m => m.GaleriaListComponent) },
      { path: 'admin/galeria/crear',    loadComponent: () => import('./features/admin/galeria-form.component').then(m => m.GaleriaFormComponent) },
      { path: 'admin/galeria/editar/:id', loadComponent: () => import('./features/admin/galeria-form.component').then(m => m.GaleriaFormComponent) },
      { path: 'admin/recompensas',            loadComponent: () => import('./features/admin/recompensas-list.component').then(m => m.RecompensasListComponent) },
      { path: 'admin/recompensas/crear',      loadComponent: () => import('./features/admin/recompensas-form.component').then(m => m.RecompensasFormComponent) },
      { path: 'admin/recompensas/editar/:id', loadComponent: () => import('./features/admin/recompensas-form.component').then(m => m.RecompensasFormComponent) },
      { path: 'admin/promos',                 loadComponent: () => import('./features/admin/promos-list.component').then(m => m.PromosListComponent) },
      { path: 'admin/promos/crear',           loadComponent: () => import('./features/admin/promos-form.component').then(m => m.PromosFormComponent) },
      { path: 'admin/promos/editar/:id',      loadComponent: () => import('./features/admin/promos-form.component').then(m => m.PromosFormComponent) },
    ],
  },

  // ---------------------------------------------------------- 404
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: '**', loadComponent: () => import('./features/not-found.component').then(m => m.NotFoundComponent) },
    ],
  },
];
