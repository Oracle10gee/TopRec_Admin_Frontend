import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
    standalone: true,
    selector: 'app-sign-in',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
    signInForm!: FormGroup;
    showPassword = false;
    isLoading = false;
    errorMessage = '';

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        this.initializeForm();
    }

    initializeForm(): void {
        this.signInForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]]
        });
    }

    togglePasswordVisibility(): void {
        this.showPassword = !this.showPassword;
    }

    get email() {
        return this.signInForm.get('email');
    }

    get password() {
        return this.signInForm.get('password');
    }

    onSubmit(): void {
        if (this.signInForm.valid) {
            this.isLoading = true;
            this.errorMessage = '';

            const { email, password } = this.signInForm.value;

            // Simulate API response with mock token and user data
            setTimeout(() => {
                // Set mock authentication token to pass AuthGuard
                localStorage.setItem('auth_token', 'mock_jwt_token_' + Date.now());

                // Create and set mock user data
                const mockUser = {
                    id: '1',
                    email: email,
                    firstName: 'User',
                    lastName: 'Admin',
                    role: 'ADMIN',
                    rtp: 'RTP001',
                    qualification: 'Professional',
                    dateOfRegistration: new Date().toISOString(),
                    address: '123 Test Street',
                    phoneNumber: '+1234567890',
                    fullLegalName: 'User Admin'
                };

                localStorage.setItem('current_user', JSON.stringify(mockUser));

                // Update auth service state
                // Use a small delay to ensure navigation happens after token is set
                setTimeout(() => {
                    this.router.navigate(['/dashboard/home']);
                    this.isLoading = false;
                }, 100);
            }, 1500);
        } else {
            // Mark all fields as touched to show validation errors
            Object.keys(this.signInForm.controls).forEach(key => {
                this.signInForm.get(key)?.markAsTouched();
            });
        }
    }

    navigateToForgotPassword(): void {
        this.router.navigate(['/auth/forgot-password']);
    }

    navigateToSignUp(): void {
        this.router.navigate(['/auth/signup']);
    }
}