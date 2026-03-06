import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            let errorMessage = 'An error occurred';

            if (error.error instanceof ErrorEvent) {
                // Client-side error
                errorMessage = error.error.message;
            } else {
                // Server-side error - prefer detailed error from backend
                const errorDetails = error.error?.error?.details;
                if (errorDetails && typeof errorDetails === 'object' && Object.keys(errorDetails).length > 0) {
                    errorMessage = Object.values(errorDetails).join(' ');
                } else {
                    errorMessage = error.error?.message
                        || `Error Code: ${error.status}\nMessage: ${error.message}`;
                }
            }

            console.error('HTTP Error:', errorMessage);
            return throwError(() => new Error(errorMessage));
        })
    );
};
