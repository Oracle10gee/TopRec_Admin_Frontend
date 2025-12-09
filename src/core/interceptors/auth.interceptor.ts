import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor,
    HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    constructor(private authService: AuthService) { }

    intercept(
        request: HttpRequest<unknown>,
        next: HttpHandler
    ): Observable<HttpEvent<unknown>> {
        // Add token to request headers if it exists
        const token = this.authService.getAccessToken();

        if (token) {
            request = request.clone({
                setHeaders: {
                    Authorization: `Bearer ${token}`,
                },
            });
        }

        return next.handle(request).pipe(
            catchError((error: HttpErrorResponse) => {
                // Handle 401 Unauthorized errors
                if (error.status === 401) {
                    return this.handle401Error(request, next);
                }

                return throwError(() => error);
            })
        );
    }

    /**
     * Handle 401 errors by attempting to refresh token
     */
    private handle401Error(
        request: HttpRequest<any>,
        next: HttpHandler
    ): Observable<HttpEvent<any>> {
        return this.authService.refreshToken().pipe(
            switchMap(() => {
                const token = this.authService.getAccessToken();
                if (token) {
                    request = request.clone({
                        setHeaders: {
                            Authorization: `Bearer ${token}`,
                        },
                    });
                }
                return next.handle(request);
            }),
            catchError((error) => {
                this.authService.logout();
                return throwError(() => error);
            })
        );
    }
}
