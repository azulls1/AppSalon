import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (_route, state): Promise<boolean | UrlTree> => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Espera a que Supabase haya intentado leer la sesión persistida.
  // Sin esto, al refrescar una ruta privada el guard vería session=null
  // antes de que getSession() resuelva.
  await auth.ready();

  if (auth.isAuthenticated()) return true;
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
