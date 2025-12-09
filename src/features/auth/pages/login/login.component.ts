import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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
        private router: Router
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

            // Simulate API call
            setTimeout(() => {
                const { email, password } = this.signInForm.value;

                // Add your authentication logic here
                console.log('Sign In Attempt:', { email, password });

                // Navigate to dashboard on success
                // this.router.navigate(['/dashboard']);

                this.isLoading = false;
            }, 1500);
        } else {
            // Mark all fields as touched to show validation errors
            Object.keys(this.signInForm.controls).forEach(key => {
                this.signInForm.get(key)?.markAsTouched();
            });
        }
    }

    navigateToForgotPassword(): void {
        this.router.navigate(['/forgot-password']);
    }

    navigateToSignUp(): void {
        this.router.navigate(['/sign-up']);
    }
}