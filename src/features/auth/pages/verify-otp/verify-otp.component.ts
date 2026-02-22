import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';

@Component({
    standalone: true,
    selector: 'app-verify-otp',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './verify-otp.component.html',
    styleUrls: ['./verify-otp.component.scss']
})
export class VerifyOtpComponent implements OnInit {
    otpForm!: FormGroup;
    isLoading = false;
    isResending = false;
    errorMessage = '';
    successMessage = '';
    identifier = '';

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private apiService: ApiService
    ) { }

    ngOnInit(): void {
        // Get identifier from query params
        this.route.queryParams.subscribe(params => {
            this.identifier = params['identifier'] || '';
            if (!this.identifier) {
                // No identifier provided, redirect back to forgot password
                this.router.navigate(['/auth/forgot-password']);
            }
        });
        this.initializeForm();
    }

    initializeForm(): void {
        this.otpForm = this.fb.group({
            otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6), Validators.pattern(/^[0-9]+$/)]]
        });
    }

    get otp() {
        return this.otpForm.get('otp');
    }

    onSubmit(): void {
        if (this.otpForm.valid) {
            this.isLoading = true;
            this.errorMessage = '';
            this.successMessage = '';

            const payload = {
                identifier: this.identifier,
                otp: this.otpForm.get('otp')?.value
            };

            this.apiService.post('/settings/password-reset/verify', payload).subscribe({
                next: (response) => {
                    this.isLoading = false;
                    this.successMessage = response?.message || 'OTP verified successfully!';

                    // Navigate to reset password page with identifier and otp
                    setTimeout(() => {
                        this.router.navigate(['/auth/reset-password'], {
                            queryParams: {
                                identifier: this.identifier,
                                otp: payload.otp
                            }
                        });
                    }, 1000);
                },
                error: (error) => {
                    this.isLoading = false;
                    const errorBody = error?.error;
                    this.errorMessage =
                        (typeof errorBody?.error?.details === 'string' ? errorBody.error.details : null)
                        || errorBody?.message
                        || error?.message
                        || 'Invalid OTP. Please try again.';
                }
            });
        } else {
            this.otpForm.markAllAsTouched();
            this.errorMessage = 'Please enter a valid 6-digit OTP';
        }
    }

    resendOtp(): void {
        this.isResending = true;
        this.errorMessage = '';
        this.successMessage = '';

        const payload = {
            identifier: this.identifier
        };

        this.apiService.post('/settings/password-reset/request', payload).subscribe({
            next: (response) => {
                this.isResending = false;
                this.successMessage = response?.message || 'A new OTP has been sent to your email.';
            },
            error: (error) => {
                this.isResending = false;
                const errorBody = error?.error;
                this.errorMessage =
                    (typeof errorBody?.error?.details === 'string' ? errorBody.error.details : null)
                    || errorBody?.message
                    || error?.message
                    || 'Failed to resend OTP. Please try again.';
            }
        });
    }

    navigateToSignIn(): void {
        this.router.navigate(['/auth/login']);
    }

    navigateToForgotPassword(): void {
        this.router.navigate(['/auth/forgot-password']);
    }
}
