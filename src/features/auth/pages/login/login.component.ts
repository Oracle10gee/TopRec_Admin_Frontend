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
            identifier: ['', [Validators.required]],
            password: ['', [Validators.required, Validators.minLength(6)]]
        });
    }

    togglePasswordVisibility(): void {
        this.showPassword = !this.showPassword;
    }

    get identifier() {
        return this.signInForm.get('identifier');
    }

    get password() {
        return this.signInForm.get('password');
    }

    onSubmit(): void {
        if (this.signInForm.valid) {
            this.isLoading = true;
            this.errorMessage = '';

            const credentials = this.signInForm.value;

            this.authService.login(credentials).subscribe({
                next: (user) => {
                    // Store user data for later use
                    localStorage.setItem('current_user', JSON.stringify(user));
                    this.isLoading = false;
                    this.router.navigate(['/dashboard/home']);
                },
                error: (error) => {
                    this.isLoading = false;
                    this.errorMessage = error.message || 'Login failed. Please try again.';
                }
            });
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