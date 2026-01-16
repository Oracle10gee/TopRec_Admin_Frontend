import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);

    // Add token to request headers if it exists
    const token = authService.getAccessToken();

    console.log('authInterceptor - Token:', token);
    console.log('authInterceptor - Request URL:', req.url);

    if (token) {
        console.log('authInterceptor - Adding token to request');
        req = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`,
            },
        });
    } else {
        console.log('authInterceptor - No token found!');
    }

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            console.log('authInterceptor - Error status:', error.status);

            // Handle 401 Unauthorized errors
            if (error.status === 401) {
                console.log('authInterceptor - Handling 401 error');
                return throwError(() => error);
            }

            return throwError(() => error);
        })
    );
};
