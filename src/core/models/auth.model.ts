// Login/SignUp Request Models
export interface LoginRequest {
    identifier: string; // email or username
    password: string;
}

export interface SignUpRequest {
    full_name: string;
    email: string;
    phone_number: string;
    address: string;
    membership_number: string;
    qualification: string;
    role: string;
    registration_date: string;
    gender?: string;
    state_of_practice: string;
    password: string;
    confirm_password: string;
}

export interface State {
    id: string;
    name: string;
    code: string;
    zone: string;
}

export interface StatesResponse {
    success: boolean;
    message: string;
    data: {
        states: State[];
    };
    error: null | string;
    meta: {
        requestId: string;
        timestamp: string;
    };
}

// API Response Models
export interface AuthResponse {
    success: boolean;
    message: string;
    data: {
        user: User;
        token?: string;
    };
    error: null | string;
    meta: {
        requestId: string;
        timestamp: string;
    };
}

export interface User {
    id: string;
    full_name: string;
    email: string;
    phone_number: string;
    address: string;
    membership_number: string;
    qualification: string;
    role: string;
    registration_date: string;
    current_financial_status: null | string;
    status: 'active' | 'inactive';
    created_at: string;
}

export type UserRole = 'Member' | 'Admin';

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
    confirmPassword: string;
}
