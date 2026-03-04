import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface ProfileImageResponse {
    success: boolean;
    message: string;
    data: {
        profile_image_url: string;
    };
}

@Injectable({
    providedIn: 'root'
})
export class ProfileImageService {
    private readonly apiUrl = environment.apiUrl;

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) {}

    /**
     * Upload profile image.
     * POST /api/v1/profile/image
     * Body: form-data with 'profile_image' file field
     */
    uploadProfileImage(file: File): Observable<ProfileImageResponse> {
        const formData = new FormData();
        formData.append('profile_image', file);

        return this.http.post<ProfileImageResponse>(
            `${this.apiUrl}/profile/image`,
            formData
        ).pipe(
            tap(response => {
                if (response?.data?.profile_image_url) {
                    this.updateStoredUserImage(response.data.profile_image_url);
                }
            }),
            catchError(error => {
                const errorMsg = error?.error?.message || error?.message || 'Failed to upload profile image';
                return throwError(() => new Error(errorMsg));
            })
        );
    }

    /**
     * Get profile image URL.
     * GET /api/v1/profile/image
     */
    getProfileImage(): Observable<ProfileImageResponse> {
        return this.http.get<ProfileImageResponse>(
            `${this.apiUrl}/profile/image`
        ).pipe(
            tap(response => {
                if (response?.data?.profile_image_url) {
                    this.updateStoredUserImage(response.data.profile_image_url);
                }
            }),
            catchError(error => {
                const errorMsg = error?.error?.message || error?.message || 'Failed to get profile image';
                return throwError(() => new Error(errorMsg));
            })
        );
    }

    /**
     * Delete profile image.
     * DELETE /api/v1/profile/image
     */
    deleteProfileImage(): Observable<any> {
        return this.http.delete<any>(
            `${this.apiUrl}/profile/image`
        ).pipe(
            tap(() => {
                this.updateStoredUserImage(null);
            }),
            catchError(error => {
                const errorMsg = error?.error?.message || error?.message || 'Failed to delete profile image';
                return throwError(() => new Error(errorMsg));
            })
        );
    }

    /**
     * Build full image URL from relative path.
     * The API returns paths like /uploads/profile-images/...
     *
     * In development the Angular dev-server proxy (proxy.conf.js) forwards
     * /uploads/* to api.toprec.gov.ng and strips the
     * Cross-Origin-Resource-Policy: same-origin header that would otherwise
     * block cross-origin image loads in the browser.
     *
     * In production, nginx must proxy /uploads/* to the backend and also
     * strip / override that header (see proxy.conf.js comments).
     */
    getFullImageUrl(relativePath: string): string {
        if (!relativePath) return '';
        // If already an absolute URL, use it as-is
        if (relativePath.startsWith('http')) return relativePath;
        // Return the relative path so the same-origin proxy handles it
        return relativePath;
    }

    /**
     * Update the stored user data with the new profile image URL
     */
    private updateStoredUserImage(imageUrl: string | null): void {
        const currentUser = this.authService.getCurrentUserSync();
        if (currentUser) {
            currentUser.profile_image_url = imageUrl;
            localStorage.setItem('current_user', JSON.stringify(currentUser));
        }
    }
}
