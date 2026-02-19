import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';

@Component({
    standalone: true,
    selector: 'app-reset-password',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './reset-password.component.html',
    styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
    resetPasswordForm!: FormGroup;
    showPassword = false;
    showConfirmPassword = false;
    isLoading = false;
    errorMessage = '';
    successMessage = '';
    identifier = '';
    otp = '';

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private apiService: ApiService
    ) { }

    ngOnInit(): void {
        // Get identifier and otp from query params
        this.route.queryParams.subscribe(params => {
            this.identifier = params['identifier'] || '';
            this.otp = params['otp'] || '';
            if (!this.identifier || !this.otp) {
                // Missing required params, redirect back to forgot password
                this.router.navigate(['/auth/forgot-password']);
            }
        });
        this.initializeForm();
    }

    initializeForm(): void {
        this.resetPasswordForm = this.fb.group({
            new_password: ['', [Validators.required, Validators.minLength(6)]],
            confirm_password: ['', Validators.required]
        }, {
            validators: this.passwordMatchValidator
        });
    }

    passwordMatchValidator(group: FormGroup): { [key: string]: any } | null {
        const password = group.get('new_password')?.value;
        const confirmPassword = group.get('confirm_password')?.value;

        if (password && confirmPassword && password !== confirmPassword) {
            return { passwordMismatch: true };
        }
        return null;
    }

    togglePasswordVisibility(): void {
        this.showPassword = !this.showPassword;
    }

    toggleConfirmPasswordVisibility(): void {
        this.showConfirmPassword = !this.showConfirmPassword;
    }

    get new_password() {
        return this.resetPasswordForm.get('new_password');
    }

    get confirm_password() {
        return this.resetPasswordForm.get('confirm_password');
    }

    onSubmit(): void {
        if (this.resetPasswordForm.valid) {
            this.isLoading = true;
            this.errorMessage = '';
            this.successMessage = '';

            const payload = {
                identifier: this.identifier,
                otp: this.otp,
                new_password: this.resetPasswordForm.get('new_password')?.value,
                confirm_password: this.resetPasswordForm.get('confirm_password')?.value
            };

            this.apiService.post('/settings/password-reset/reset', payload).subscribe({
                next: (response) => {
                    this.isLoading = false;
                    this.successMessage = response?.message || 'Password reset successfully! Redirecting to sign in...';

                    // Navigate to login after 2 seconds
                    setTimeout(() => {
                        this.router.navigate(['/auth/login']);
                    }, 2000);
                },
                error: (error) => {
                    this.isLoading = false;
                    const errorBody = error?.error;
                    this.errorMessage =
                        (typeof errorBody?.error?.details === 'string' ? errorBody.error.details : null)
                        || errorBody?.message
                        || error?.message
                        || 'Failed to reset password. Please try again.';
                }
            });
        } else {
            this.resetPasswordForm.markAllAsTouched();
            this.errorMessage = 'Please fill in all required fields correctly';
        }
    }

    navigateToSignIn(): void {
        this.router.navigate(['/auth/login']);
    }
}
