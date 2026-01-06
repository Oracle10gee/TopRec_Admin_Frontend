import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
    standalone: true,
    selector: 'app-sign-up',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './signup.component.html',
    styleUrls: ['./signup.component.scss']
})
export class SignUpComponent implements OnInit {
    signUpForm!: FormGroup;
    showPassword = false;
    showConfirmPassword = false;
    isLoading = false;
    errorMessage = '';
    successMessage = '';

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        this.initializeForm();
    }

    initializeForm(): void {
        this.signUpForm = this.fb.group({
            full_name: ['', [Validators.required, Validators.minLength(3)]],
            membership_number: ['', Validators.required],
            qualification: ['', Validators.required],
            registration_date: ['', Validators.required],
            address: ['', [Validators.required, Validators.minLength(5)]],
            phone_number: ['', [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirm_password: ['', Validators.required]
        }, {
            validators: this.passwordMatchValidator
        });
    }

    passwordMatchValidator(group: FormGroup): { [key: string]: any } | null {
        const password = group.get('password')?.value;
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

    get full_name() {
        return this.signUpForm.get('full_name');
    }

    get membership_number() {
        return this.signUpForm.get('membership_number');
    }

    get qualification() {
        return this.signUpForm.get('qualification');
    }

    get registration_date() {
        return this.signUpForm.get('registration_date');
    }

    get address() {
        return this.signUpForm.get('address');
    }

    get phone_number() {
        return this.signUpForm.get('phone_number');
    }

    get email() {
        return this.signUpForm.get('email');
    }

    get password() {
        return this.signUpForm.get('password');
    }

    get confirm_password() {
        return this.signUpForm.get('confirm_password');
    }

    onSubmit(): void {
        if (this.signUpForm.valid) {
            this.isLoading = true;
            this.errorMessage = '';
            this.successMessage = '';

            const formData = this.signUpForm.value;
            const signUpData = {
                ...formData,
                role: 'Member'  // Default role for new users
            };

            this.authService.signUp(signUpData).subscribe({
                next: (user) => {
                    this.successMessage = 'Account created successfully! Redirecting to dashboard...';
                    // Store user data
                    localStorage.setItem('current_user', JSON.stringify(user));
                    this.isLoading = false;
                    // Navigate to dashboard after 1.5 seconds
                    setTimeout(() => {
                        this.router.navigate(['/dashboard/home']);
                    }, 1500);
                },
                error: (error) => {
                    this.isLoading = false;
                    this.errorMessage = error.message || 'Registration failed. Please try again.';
                }
            });
        } else {
            this.errorMessage = 'Please fill in all required fields correctly';
        }
    }

    navigateToSignIn(): void {
        this.router.navigate(['/auth/login']);
    }
}
