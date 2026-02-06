import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';
import { ApiService } from './api.service';
import { NotificationService } from './notification.service';
import {
    AuthResponse,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    RefreshTokenRequest,
    ResetPasswordRequest,
    SignUpRequest,
    User,
} from '../models/auth.model';
import { ApiResponse } from '../models/api.model';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly TOKEN_KEY = 'auth_token';
    private readonly REFRESH_TOKEN_KEY = 'refresh_token';
    private readonly CURRENT_USER_KEY = 'current_user';

    private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
    public currentUser$ = this.currentUserSubject.asObservable();

    private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
    public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

    constructor(
        private apiService: ApiService,
        private notificationService: NotificationService
    ) {
        this.checkTokenExpiry();
    }

    /**
     * Login user
     */
    login(credentials: LoginRequest): Observable<User> {
        return this.apiService.post<AuthResponse>('/auth/login', credentials).pipe(
            tap((response) => {
                console.log('Login response:', response);
                console.log('Token from response:', response.data.token);

                if (response.data.token) {
                    console.log('Storing token:', response.data.token);
                    localStorage.setItem(this.TOKEN_KEY, response.data.token);
                    console.log('Token stored. Retrieved:', localStorage.getItem(this.TOKEN_KEY));
                } else {
                    console.warn('No token in response!');
                }

                // Store user data with role and name
                const user = response.data.user;
                localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));

                this.currentUserSubject.next(user);
                this.isAuthenticatedSubject.next(true);

                // Show success notification with user name
                this.notificationService.success(`Welcome back, ${user.full_name}!`);
            }),
            map((response) => response.data.user),
            catchError((error) => this.handleAuthError(error))
        );
    }

    /**
     * Sign up user
     */
    signUp(data: SignUpRequest): Observable<User> {
        return this.apiService.post<AuthResponse>('/auth/register', data).pipe(
            tap((response) => {
                if (response.data.token) {
                    localStorage.setItem(this.TOKEN_KEY, response.data.token);
                }
                this.currentUserSubject.next(response.data.user);
                this.isAuthenticatedSubject.next(true);
            }),
            map((response) => response.data.user),
            catchError((error) => this.handleAuthError(error))
        );
    }

    /**
     * Logout user
     */
    logout(): void {
        const userName = this.currentUserSubject.value?.full_name || 'User';

        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
        localStorage.removeItem(this.CURRENT_USER_KEY);

        this.currentUserSubject.next(null);
        this.isAuthenticatedSubject.next(false);

        // Show logout notification
        this.notificationService.success(`Goodbye, ${userName}!`);
    }

    /**
     * Refresh access token
     */
    refreshToken(): Observable<AuthResponse> {
        const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);

        if (!refreshToken) {
            this.logout();
            return throwError(() => new Error('No refresh token available'));
        }

        const request: RefreshTokenRequest = { refreshToken };
        return this.apiService.post<AuthResponse>('/auth/refresh', request).pipe(
            tap((response) => {
                localStorage.setItem(this.TOKEN_KEY, response.data.accessToken);
                if (response.data.refreshToken) {
                    localStorage.setItem(this.REFRESH_TOKEN_KEY, response.data.refreshToken);
                }
            }),
            map((response) => response.data),
            catchError((error) => {
                this.logout();
                return throwError(() => error);
            })
        );
    }

    /**
     * Get current user
     */
    getCurrentUser(): Observable<User | null> {
        return this.currentUser$;
    }

    /**
     * Get current user synchronously
     */
    getCurrentUserSync(): User | null {
        return this.currentUserSubject.value;
    }

    /**
     * Get user profile from API
     */
    getProfile(): Observable<User> {
        return this.apiService.get<AuthResponse>('/auth/profile').pipe(
            tap((response) => {
                this.currentUserSubject.next(response.data.user);
            }),
            map((response) => response.data.user),
            catchError((error) => this.handleAuthError(error))
        );
    }

    /**
     * Get users list with filters and pagination
     */
    getUsers(params?: {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
        role?: string;
    }): Observable<any> {
        const { page = 1, limit = 10, search = '', status = '', role = '' } = params || {};

        let httpParams = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());

        if (search) {
            httpParams = httpParams.set('search', search);
        }
        if (status) {
            httpParams = httpParams.set('status', status);
        }
        if (role) {
            httpParams = httpParams.set('role', role);
        }

        return this.apiService.get<any>('/auth/users', { params: httpParams }).pipe(
            catchError((error) => this.handleAuthError(error))
        );
    }

    /**
     * Change password
     */
    changePassword(request: ChangePasswordRequest): Observable<ApiResponse<string>> {
        const { confirmPassword, ...payload } = request;
        return this.apiService.post<string>('/auth/change-password', payload).pipe(
            catchError((error) => this.handleAuthError(error))
        );
    }

    /**
     * Forgot password
     */
    forgotPassword(request: ForgotPasswordRequest): Observable<ApiResponse<string>> {
        return this.apiService.post<string>('/auth/forgot-password', request).pipe(
            catchError((error) => this.handleAuthError(error))
        );
    }

    /**
     * Reset password
     */
    resetPassword(request: ResetPasswordRequest): Observable<ApiResponse<string>> {
        const { confirmPassword, ...payload } = request;
        return this.apiService.post<string>('/auth/reset-password', payload).pipe(
            catchError((error) => this.handleAuthError(error))
        );
    }

    /**
     * Get access token
     */
    getAccessToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        return this.hasValidToken();
    }

    /**
     * Handle successful authentication
     */
    private handleAuthSuccess(authResponse: { user: User; token?: string }): void {
        if (authResponse.token) {
            localStorage.setItem(this.TOKEN_KEY, authResponse.token);
        }
        this.currentUserSubject.next(authResponse.user);
        this.isAuthenticatedSubject.next(true);
    }

    /**
     * Handle authentication errors
     */
    private handleAuthError(error: any): Observable<never> {
        const errorMessage = error?.error?.message || 'An authentication error occurred';
        return throwError(() => new Error(errorMessage));
    }

    /**
     * Get user from storage
     */
    private getUserFromStorage(): User | null {
        const token = localStorage.getItem(this.TOKEN_KEY);
        if (!token) return null;

        // Get user from localStorage if available
        const userData = localStorage.getItem('current_user');
        if (userData) {
            try {
                return JSON.parse(userData);
            } catch {
                return null;
            }
        }

        return null;
    }

    /**
     * Check if token is valid
     */
    private hasValidToken(): boolean {
        const token = localStorage.getItem(this.TOKEN_KEY);
        if (!token) return false;

        try {
            // For JWT tokens, check expiry
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expiresAt = payload.exp * 1000;
            return Date.now() < expiresAt;
        } catch {
            // If we can't parse, assume valid if token exists
            return !!token;
        }
    }

    /**
     * Check token expiry and refresh if needed
     */
    private checkTokenExpiry(): void {
        const token = localStorage.getItem(this.TOKEN_KEY);
        if (!token) return;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expiresAt = payload.exp * 1000;
            const now = Date.now();
            const timeUntilExpiry = expiresAt - now;

            // Refresh token 5 minutes before expiry
            if (timeUntilExpiry > 0) {
                setTimeout(() => {
                    if (this.hasValidToken()) {
                        this.refreshToken().subscribe(
                            () => this.checkTokenExpiry(),
                            () => this.logout()
                        );
                    }
                }, timeUntilExpiry - 5 * 60 * 1000);
            }
        } catch {
            this.logout();
        }
    }

    /**
     * Update user by ID
     */
    updateUser(userId: string, data: any): Observable<any> {
        return this.apiService.patch(`/auth/users/${userId}`, data).pipe(
            catchError((error) => this.handleAuthError(error))
        );
    }

    /**
     * Delete user by ID
     */
    deleteUser(userId: string): Observable<any> {
        return this.apiService.delete(`/auth/users/${userId}`).pipe(
            catchError((error) => this.handleAuthError(error))
        );
    }

    /**
     * Get current user's role
     */
    getCurrentUserRole(): string {
        return this.currentUserSubject.value?.role || '';
    }

    /**
     * Get current user's full name
     */
    getCurrentUserName(): string {
        return this.currentUserSubject.value?.full_name || '';
    }

    /**
     * Check if user has specific role
     */
    hasRole(role: string): boolean {
        return this.getCurrentUserRole() === role;
    }

    /**
     * Get all payment types
     */
    getPaymentTypes(): Observable<any> {
        return this.apiService.get('/payments/payment-types').pipe(
            catchError((error) => {
                console.error('Error fetching payment types:', error);
                return throwError(() => error);
            })
        );
    }

    /**
     * Create a new payment type
     */
    createPaymentType(data: any): Observable<any> {
        return this.apiService.post('/payments/payment-types', data).pipe(
            catchError((error) => {
                console.error('Error creating payment type:', error);
                return throwError(() => error);
            })
        );
    }

    /**
     * Update a payment type
     */
    updatePaymentType(paymentTypeId: string, data: any): Observable<any> {
        return this.apiService.patch(`/payments/payment-types/${paymentTypeId}`, data).pipe(
            catchError((error) => {
                console.error('Error updating payment type:', error);
                return throwError(() => error);
            })
        );
    }

    /**
     * Delete a payment type
     */
    deletePaymentType(paymentTypeId: string): Observable<any> {
        return this.apiService.delete(`/payments/payment-types/${paymentTypeId}`).pipe(
            catchError((error) => {
                console.error('Error deleting payment type:', error);
                return throwError(() => error);
            })
        );
    }
}

