import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { ApiService } from '../../../../../../core/services/api.service';
import { AuthService } from '../../../../../../core/services/auth.service';
import { NotificationService } from '../../../../../../core/services/notification.service';

@Component({
    standalone: true,
    selector: 'app-security-settings',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './security-settings.component.html',
    styleUrls: ['./security-settings.component.scss']
})
export class SecuritySettingsComponent implements OnInit, OnDestroy {

    // ── Modal visibility ──────────────────────────────────────────────────────
    showOtpRequestModal = false;
    showOtpVerifyModal = false;
    showPasswordResetModal = false;

    // ── Shared state ──────────────────────────────────────────────────────────
    isSubmitting = false;
    userIdentifier = '';   // pre-filled from logged-in user's email
    capturedOtp = '';      // OTP kept after verification, used in step 3

    // ── Resend OTP cooldown ───────────────────────────────────────────────────
    resendCooldown = 0;
    private resendTimer: any = null;

    // ── Forms (one per step) ──────────────────────────────────────────────────
    otpVerifyForm!: FormGroup;
    resetPasswordForm!: FormGroup;

    // ── New password field visibility ─────────────────────────────────────────
    showNewPassword = false;
    showConfirmPassword = false;

    constructor(
        private fb: FormBuilder,
        private apiService: ApiService,
        private authService: AuthService,
        private notificationService: NotificationService
    ) {}

    ngOnInit(): void {
        this.initializeForms();
    }

    ngOnDestroy(): void {
        if (this.resendTimer) {
            clearInterval(this.resendTimer);
        }
    }

    private initializeForms(): void {
        // Step 2 – OTP input (6-digit code)
        this.otpVerifyForm = this.fb.group({
            otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6), Validators.pattern(/^\d{6}$/)]]
        });

        // Step 3 – New password + confirm
        this.resetPasswordForm = this.fb.group(
            {
                new_password: ['', [
                    Validators.required,
                    Validators.minLength(8),
                    this.passwordStrengthValidator
                ]],
                confirm_password: ['', [Validators.required]]
            },
            { validators: this.passwordMatchValidator }
        );
    }

    // ── Step control ──────────────────────────────────────────────────────────

    /**
     * Open the change-password flow at step 1.
     * Pre-fills the identifier from the currently logged-in user's email.
     */
    openChangePasswordModal(): void {
        const currentUser = this.authService.getCurrentUserSync();
        this.userIdentifier = currentUser?.email || '';

        if (!this.userIdentifier) {
            this.notificationService.error(
                'Unable to retrieve your email address. Please log out and log back in.',
                6000
            );
            return;
        }

        // Reset any previous state
        this.otpVerifyForm.reset();
        this.resetPasswordForm.reset();
        this.capturedOtp = '';
        this.isSubmitting = false;

        this.showOtpRequestModal = true;
    }

    /** Close whichever modal is open and reset all state. */
    closeModal(): void {
        this.showOtpRequestModal = false;
        this.showOtpVerifyModal = false;
        this.showPasswordResetModal = false;
        this._resetState();
    }

    // ── API calls ─────────────────────────────────────────────────────────────

    /**
     * Step 1 – Request an OTP to the user's registered email.
     * Endpoint: POST /settings/password-reset/request  { identifier }
     */
    submitOtpRequest(): void {
        this.isSubmitting = true;

        this.apiService
            .post('/settings/password-reset/request', { identifier: this.userIdentifier })
            .subscribe({
                next: () => {
                    this.isSubmitting = false;
                    this.notificationService.success(
                        `OTP sent to ${this.userIdentifier}. Please check your inbox.`,
                        6000
                    );
                    this.showOtpRequestModal = false;
                    this.showOtpVerifyModal = true;
                    this.startResendCooldown();
                },
                error: (err: Error) => {
                    this.isSubmitting = false;
                    this.notificationService.error(
                        err.message || 'Failed to send OTP. Please try again.',
                        6000
                    );
                }
            });
    }

    /**
     * Step 2 – Verify the OTP the user entered.
     * Endpoint: POST /settings/password-reset/verify  { identifier, otp }
     */
    submitOtpVerify(): void {
        if (this.otpVerifyForm.invalid) {
            this.otpVerifyForm.markAllAsTouched();
            return;
        }

        this.isSubmitting = true;
        const otp: string = this.otpVerifyForm.get('otp')?.value;

        this.apiService
            .post('/settings/password-reset/verify', {
                identifier: this.userIdentifier,
                otp
            })
            .subscribe({
                next: () => {
                    this.isSubmitting = false;
                    this.capturedOtp = otp;
                    this.showOtpVerifyModal = false;
                    this.showPasswordResetModal = true;
                },
                error: (err: Error) => {
                    this.isSubmitting = false;
                    this.notificationService.error(
                        err.message || 'Invalid OTP. Please check the code and try again.',
                        6000
                    );
                }
            });
    }

    /**
     * Step 3 – Reset the password using the verified OTP.
     * Endpoint: POST /settings/password-reset/reset  { identifier, otp, new_password, confirm_password }
     */
    submitPasswordReset(): void {
        if (this.resetPasswordForm.invalid) {
            this.resetPasswordForm.markAllAsTouched();
            return;
        }

        this.isSubmitting = true;
        const { new_password, confirm_password } = this.resetPasswordForm.value;

        this.apiService
            .post('/settings/password-reset/reset', {
                identifier: this.userIdentifier,
                otp: this.capturedOtp,
                new_password,
                confirm_password
            })
            .subscribe({
                next: () => {
                    this.isSubmitting = false;
                    this.showPasswordResetModal = false;
                    this.notificationService.success(
                        'Password changed successfully! Your account is now more secure.',
                        7000
                    );
                    this._resetState();
                },
                error: (err: Error) => {
                    this.isSubmitting = false;
                    this.notificationService.error(
                        err.message || 'Failed to reset password. Please try again.',
                        6000
                    );
                }
            });
    }

    /**
     * Resend OTP – reuses the request endpoint and restarts the cooldown timer.
     */
    resendOtp(): void {
        if (this.resendCooldown > 0) return;

        this.apiService
            .post('/settings/password-reset/request', { identifier: this.userIdentifier })
            .subscribe({
                next: () => {
                    this.notificationService.success('OTP resent to your email address.', 5000);
                    this.otpVerifyForm.reset();
                    this.startResendCooldown();
                },
                error: (err: Error) => {
                    this.notificationService.error(
                        err.message || 'Failed to resend OTP. Please try again.',
                        6000
                    );
                }
            });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private _resetState(): void {
        this.otpVerifyForm?.reset();
        this.resetPasswordForm?.reset();
        this.capturedOtp = '';
        this.isSubmitting = false;
        if (this.resendTimer) {
            clearInterval(this.resendTimer);
            this.resendTimer = null;
            this.resendCooldown = 0;
        }
    }

    private startResendCooldown(): void {
        this.resendCooldown = 60;
        if (this.resendTimer) clearInterval(this.resendTimer);

        this.resendTimer = setInterval(() => {
            this.resendCooldown--;
            if (this.resendCooldown <= 0) {
                clearInterval(this.resendTimer);
                this.resendTimer = null;
            }
        }, 1000);
    }

    // ── Password visibility toggles ───────────────────────────────────────────

    toggleNewPasswordVisibility(): void {
        this.showNewPassword = !this.showNewPassword;
    }

    toggleConfirmPasswordVisibility(): void {
        this.showConfirmPassword = !this.showConfirmPassword;
    }

    // ── Password strength helpers (bound to resetPasswordForm.new_password) ───

    private passwordStrengthValidator(control: AbstractControl): { [key: string]: any } | null {
        const value = control.value;
        if (!value) return null;
        const ok =
            /[A-Z]/.test(value) &&
            /[a-z]/.test(value) &&
            /[0-9]/.test(value) &&
            /[!@#$%^&*(),.?":{}|<>]/.test(value) &&
            value.length >= 8;
        return ok ? null : { passwordStrength: true };
    }

    private passwordMatchValidator(group: AbstractControl): { [key: string]: any } | null {
        const pw = group.get('new_password')?.value;
        const cpw = group.get('confirm_password')?.value;
        return pw && cpw && pw !== cpw ? { passwordMismatch: true } : null;
    }

    hasMinLength(): boolean {
        return (this.resetPasswordForm.get('new_password')?.value || '').length >= 8;
    }

    hasUpperCase(): boolean {
        return /[A-Z]/.test(this.resetPasswordForm.get('new_password')?.value || '');
    }

    hasLowerCase(): boolean {
        return /[a-z]/.test(this.resetPasswordForm.get('new_password')?.value || '');
    }

    hasNumber(): boolean {
        return /[0-9]/.test(this.resetPasswordForm.get('new_password')?.value || '');
    }

    hasSpecialChar(): boolean {
        return /[!@#$%^&*(),.?":{}|<>]/.test(this.resetPasswordForm.get('new_password')?.value || '');
    }

    private calculatePasswordStrength(): number {
        let s = 0;
        if (this.hasMinLength()) s += 20;
        if (this.hasUpperCase()) s += 20;
        if (this.hasLowerCase()) s += 20;
        if (this.hasNumber()) s += 20;
        if (this.hasSpecialChar()) s += 20;
        return s;
    }

    getPasswordStrengthText(): string {
        const s = this.calculatePasswordStrength();
        if (s === 0) return '';
        if (s <= 40) return 'Weak';
        if (s <= 60) return 'Fair';
        if (s <= 80) return 'Good';
        return 'Strong';
    }

    getPasswordStrengthWidth(): string {
        return this.calculatePasswordStrength() + '%';
    }

    getPasswordStrengthClass(): string {
        const s = this.calculatePasswordStrength();
        if (s === 0) return 'bg-gray-300';
        if (s <= 40) return 'bg-red-500';
        if (s <= 60) return 'bg-yellow-500';
        if (s <= 80) return 'bg-blue-500';
        return 'bg-green-500';
    }

    getPasswordStrengthTextClass(): string {
        const s = this.calculatePasswordStrength();
        if (s === 0) return 'text-gray-500';
        if (s <= 40) return 'text-red-600';
        if (s <= 60) return 'text-yellow-600';
        if (s <= 80) return 'text-blue-600';
        return 'text-green-600';
    }
}
