import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const api = inject(ApiService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    router.navigateByUrl('/login');
    return false;
  }
  try {
    const profile = await firstValueFrom(api.getMe());
    if (profile.is_admin) return true;
  } catch {
    /* fallthrough */
  }
  router.navigateByUrl('/cita');
  return false;
};
