import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);

    // Add token to request headers if it exists
    const token = authService.getAccessToken();

    console.log('🔐 authInterceptor - Request URL:', req.url);
    console.log('🔐 authInterceptor - Token:', token ? `✅ Found (${token.substring(0, 20)}...)` : '❌ NOT FOUND');

    if (token) {
        console.log('🔐 authInterceptor - Adding Authorization header');
        req = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`,
            },
        });
        console.log('🔐 authInterceptor - Headers after clone:', req.headers.get('Authorization') ? '✅ Authorization header set' : '❌ Authorization header NOT set');
    } else {
        console.log('🔐 authInterceptor - No token, skipping header');
    }

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            console.log('🔐 authInterceptor - Error status:', error.status);

            // Handle 401 Unauthorized errors
            if (error.status === 401) {
                console.log('🔐 authInterceptor - Handling 401 error');
                return throwError(() => error);
            }

            return throwError(() => error);
        })
    );
};
