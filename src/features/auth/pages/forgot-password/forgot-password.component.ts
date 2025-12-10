import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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
    emailSent = false;

    constructor(
        private fb: FormBuilder,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.initializeForm();
    }

    initializeForm(): void {
        this.forgotPasswordForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]]
        });
    }

    get email() {
        return this.forgotPasswordForm.get('email');
    }

    onSubmit(): void {
        if (this.forgotPasswordForm.valid) {
            this.isLoading = true;
            this.errorMessage = '';
            this.successMessage = '';

            // Simulate API call
            setTimeout(() => {
                const { email } = this.forgotPasswordForm.value;

                // Add your password reset request logic here
                console.log('Forgot Password Request:', { email });

                // Show success message
                this.successMessage = 'Password reset link sent to your email. Check your inbox.';
                this.emailSent = true;
                this.isLoading = false;

                // Navigate to login after 3 seconds
                setTimeout(() => {
                    this.router.navigate(['/auth/login']);
                }, 3000);
            }, 1500);
        } else {
            this.errorMessage = 'Please enter a valid email address';
        }
    }

    navigateToSignIn(): void {
        this.router.navigate(['/auth/login']);
    }
}
