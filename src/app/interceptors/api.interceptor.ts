import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, throwError } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { AuthService, LOGIN_ROUTE } from '../services/auth.service';
import { LoadingService } from '../services/loading.service';

/**
 * - Adds the Authorization header (Bearer) to API requests when a token exists.
 * - Shows the global loader while any request is in flight.
 * - Redirects to the login route on 401 / 403.
 */
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const loading = inject(LoadingService);
  const router = inject(Router);
  const token = auth.token();

  const authReq =
    token && req.url.startsWith(inject(API_BASE_URL))
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  loading.start();
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if ((error.status === 401 || error.status === 403) && !router.url.startsWith(LOGIN_ROUTE)) {
        auth.clear();
        router.navigate([LOGIN_ROUTE]);
      }
      return throwError(() => error);
    }),
    finalize(() => loading.stop())
  );
};
