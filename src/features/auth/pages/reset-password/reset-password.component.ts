import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

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
    resetToken = '';

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit(): void {
        // Get reset token from URL parameters
        this.route.queryParams.subscribe(params => {
            this.resetToken = params['token'] || '';
        });
        this.initializeForm();
    }

    initializeForm(): void {
        this.resetPasswordForm = this.fb.group({
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', Validators.required]
        }, {
            validators: this.passwordMatchValidator
        });
    }

    passwordMatchValidator(group: FormGroup): { [key: string]: any } | null {
        const password = group.get('password')?.value;
        const confirmPassword = group.get('confirmPassword')?.value;

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

    get password() {
        return this.resetPasswordForm.get('password');
    }

    get confirmPassword() {
        return this.resetPasswordForm.get('confirmPassword');
    }

    onSubmit(): void {
        if (this.resetPasswordForm.valid) {
            this.isLoading = true;
            this.errorMessage = '';
            this.successMessage = '';

            // Simulate API call
            setTimeout(() => {
                const { password } = this.resetPasswordForm.value;

                // Add your password reset logic here with token
                console.log('Reset Password Request:', { token: this.resetToken, password });

                // Show success message
                this.successMessage = 'Password reset successfully! Redirecting to sign in...';
                this.isLoading = false;

                // Navigate to login after 2 seconds
                setTimeout(() => {
                    this.router.navigate(['/auth/login']);
                }, 2000);
            }, 1500);
        } else {
            this.errorMessage = 'Please fill in all required fields correctly';
        }
    }

    navigateToSignIn(): void {
        this.router.navigate(['/auth/login']);
    }
}
