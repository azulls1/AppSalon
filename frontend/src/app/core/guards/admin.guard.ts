import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = async (_route, state): Promise<boolean | UrlTree> => {
  const auth = inject(AuthService);
  const api = inject(ApiService);
  const router = inject(Router);

  await auth.ready();

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }
  try {
    const profile = await firstValueFrom(api.getMe());
    if (profile.is_admin) return true;
  } catch {
    /* fallthrough — sin perfil o backend caído, no es admin */
  }
  return router.createUrlTree(['/cita']);
};
