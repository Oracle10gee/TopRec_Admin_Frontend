import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';

@Component({
    standalone: true,
    selector: 'app-forgot-password',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './forgot-password.component.html',
    styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit {
    forgotPasswordForm!: FormGroup;
    isLoading = false;
    errorMessage = '';
    successMessage = '';

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private apiService: ApiService
    ) { }

    ngOnInit(): void {
        this.initializeForm();
    }

    initializeForm(): void {
        this.forgotPasswordForm = this.fb.group({
            identifier: ['', [Validators.required]]
        });
    }

    get identifier() {
        return this.forgotPasswordForm.get('identifier');
    }

    onSubmit(): void {
        if (this.forgotPasswordForm.valid) {
            this.isLoading = true;
            this.errorMessage = '';
            this.successMessage = '';

            const payload = {
                identifier: this.forgotPasswordForm.get('identifier')?.value
            };

            this.apiService.post('/settings/password-reset/request', payload).subscribe({
                next: (response) => {
                    this.isLoading = false;
                    this.successMessage = response?.message || 'If an account exists with this email/membership number, an OTP has been sent.';

                    // Navigate to OTP verification page after a short delay
                    setTimeout(() => {
                        this.router.navigate(['/auth/verify-otp'], {
                            queryParams: { identifier: payload.identifier }
                        });
                    }, 1500);
                },
                error: (error) => {
                    this.isLoading = false;
                    const errorBody = error?.error;
                    this.errorMessage =
                        (typeof errorBody?.error?.details === 'string' ? errorBody.error.details : null)
                        || errorBody?.message
                        || error?.message
                        || 'Failed to send reset link. Please try again.';
                }
            });
        } else {
            this.forgotPasswordForm.markAllAsTouched();
            this.errorMessage = 'Please enter your email or membership number';
        }
    }

    navigateToSignIn(): void {
        this.router.navigate(['/auth/login']);
    }
}
