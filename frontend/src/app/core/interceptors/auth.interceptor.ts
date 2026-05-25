import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.accessToken();
  const isAuthed = !!token;
  const authedReq = isAuthed
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authedReq).pipe(
    catchError((err: HttpErrorResponse) => {
      // 401 en request autenticado = token caducado/inválido.
      // Cerrar sesión local y mandar a login con returnUrl actual.
      if (err.status === 401 && isAuthed) {
        const returnUrl = router.url;
        auth.signOut().finally(() => {
          router.navigate(['/login'], { queryParams: { returnUrl } });
        });
      }
      return throwError(() => err);
    }),
  );
};
