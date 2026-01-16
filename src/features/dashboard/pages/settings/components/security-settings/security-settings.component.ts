import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';

@Component({
    standalone: true,
    selector: 'app-security-settings',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './security-settings.component.html',
    styleUrls: ['./security-settings.component.scss']
})
export class SecuritySettingsComponent implements OnInit {
    securityForm!: FormGroup;
    showCurrentPassword = false;
    showNewPassword = false;
    showConfirmPassword = false;
    isSaving = false;
    successMessage = '';
    errorMessage = '';

    constructor(private fb: FormBuilder) {}

    ngOnInit(): void {
        this.initializeForm();
    }

    private initializeForm(): void {
        this.securityForm = this.fb.group(
            {
                currentPassword: ['', [Validators.required]],
                newPassword: ['', [
                    Validators.required,
                    Validators.minLength(8),
                    this.passwordStrengthValidator
                ]],
                confirmPassword: ['', [Validators.required]]
            },
            {
                validators: this.passwordMatchValidator
            }
        );
    }

    /**
     * Custom validator for password strength
     */
    private passwordStrengthValidator(control: AbstractControl): { [key: string]: any } | null {
        const value = control.value;
        if (!value) {
            return null;
        }

        const hasUpperCase = /[A-Z]/.test(value);
        const hasLowerCase = /[a-z]/.test(value);
        const hasNumeric = /[0-9]/.test(value);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
        const isValidLength = value.length >= 8;

        const passwordValid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecialChar && isValidLength;

        return !passwordValid ? { passwordStrength: true } : null;
    }

    /**
     * Validator to check if passwords match
     */
    private passwordMatchValidator(group: FormGroup): { [key: string]: any } | null {
        const password = group.get('newPassword')?.value;
        const confirmPassword = group.get('confirmPassword')?.value;

        if (password && confirmPassword && password !== confirmPassword) {
            return { passwordMismatch: true };
        }
        return null;
    }

    /**
     * Submit form to change password
     */
    onPasswordChange(): void {
        if (this.securityForm.invalid) {
            this.errorMessage = 'Please fill in all required fields correctly';
            this.clearMessage('error', 5000);
            return;
        }

        this.isSaving = true;
        this.errorMessage = '';
        this.successMessage = '';

        // Simulate API call
        setTimeout(() => {
            // Simulate successful password change
            this.successMessage = 'Password updated successfully! Your account is now more secure.';
            this.isSaving = false;
            this.securityForm.reset();

            // Clear success message after 5 seconds
            this.clearMessage('success', 5000);
        }, 2000);
    }

    /**
     * Toggle password visibility
     */
    togglePasswordVisibility(field: 'current' | 'new' | 'confirm'): void {
        switch (field) {
            case 'current':
                this.showCurrentPassword = !this.showCurrentPassword;
                break;
            case 'new':
                this.showNewPassword = !this.showNewPassword;
                break;
            case 'confirm':
                this.showConfirmPassword = !this.showConfirmPassword;
                break;
        }
    }

    /**
     * Reset form to initial state
     */
    resetForm(): void {
        this.securityForm.reset();
        this.errorMessage = '';
        this.successMessage = '';
    }

    /**
     * Clear message after timeout
     */
    private clearMessage(type: 'success' | 'error', delay: number): void {
        setTimeout(() => {
            if (type === 'success') {
                this.successMessage = '';
            } else {
                this.errorMessage = '';
            }
        }, delay);
    }

    // Password Strength Indicators

    /**
     * Check if password has minimum length
     */
    hasMinLength(): boolean {
        const password = this.securityForm.get('newPassword')?.value || '';
        return password.length >= 8;
    }

    /**
     * Check if password has uppercase letter
     */
    hasUpperCase(): boolean {
        const password = this.securityForm.get('newPassword')?.value || '';
        return /[A-Z]/.test(password);
    }

    /**
     * Check if password has lowercase letter
     */
    hasLowerCase(): boolean {
        const password = this.securityForm.get('newPassword')?.value || '';
        return /[a-z]/.test(password);
    }

    /**
     * Check if password has number
     */
    hasNumber(): boolean {
        const password = this.securityForm.get('newPassword')?.value || '';
        return /[0-9]/.test(password);
    }

    /**
     * Check if password has special character
     */
    hasSpecialChar(): boolean {
        const password = this.securityForm.get('newPassword')?.value || '';
        return /[!@#$%^&*(),.?":{}|<>]/.test(password);
    }

    /**
     * Calculate password strength percentage
     */
    private calculatePasswordStrength(): number {
        let strength = 0;
        if (this.hasMinLength()) strength += 20;
        if (this.hasUpperCase()) strength += 20;
        if (this.hasLowerCase()) strength += 20;
        if (this.hasNumber()) strength += 20;
        if (this.hasSpecialChar()) strength += 20;
        return strength;
    }

    /**
     * Get password strength as text
     */
    getPasswordStrengthText(): string {
        const strength = this.calculatePasswordStrength();
        if (strength === 0) return '';
        if (strength <= 40) return 'Weak';
        if (strength <= 60) return 'Fair';
        if (strength <= 80) return 'Good';
        return 'Strong';
    }

    /**
     * Get password strength bar width
     */
    getPasswordStrengthWidth(): string {
        return this.calculatePasswordStrength() + '%';
    }

    /**
     * Get password strength bar color class
     */
    getPasswordStrengthClass(): string {
        const strength = this.calculatePasswordStrength();
        if (strength === 0) return 'bg-gray-300';
        if (strength <= 40) return 'bg-red-500';
        if (strength <= 60) return 'bg-yellow-500';
        if (strength <= 80) return 'bg-blue-500';
        return 'bg-green-500';
    }

    /**
     * Get password strength text color class
     */
    getPasswordStrengthTextClass(): string {
        const strength = this.calculatePasswordStrength();
        if (strength === 0) return 'text-gray-500';
        if (strength <= 40) return 'text-red-600';
        if (strength <= 60) return 'text-yellow-600';
        if (strength <= 80) return 'text-blue-600';
        return 'text-green-600';
    }
}