import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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
        private router: Router
    ) { }

    ngOnInit(): void {
        this.initializeForm();
    }

    initializeForm(): void {
        this.signUpForm = this.fb.group({
            fullLegalName: ['', [Validators.required, Validators.minLength(3)]],
            rtp: ['', Validators.required],
            qualification: ['', Validators.required],
            dateOfRegistration: ['', Validators.required],
            address: ['', [Validators.required, Validators.minLength(5)]],
            phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]],
            email: ['', [Validators.required, Validators.email]],
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

    get fullLegalName() {
        return this.signUpForm.get('fullLegalName');
    }

    get rtp() {
        return this.signUpForm.get('rtp');
    }

    get qualification() {
        return this.signUpForm.get('qualification');
    }

    get dateOfRegistration() {
        return this.signUpForm.get('dateOfRegistration');
    }

    get address() {
        return this.signUpForm.get('address');
    }

    get phoneNumber() {
        return this.signUpForm.get('phoneNumber');
    }

    get email() {
        return this.signUpForm.get('email');
    }

    get password() {
        return this.signUpForm.get('password');
    }

    get confirmPassword() {
        return this.signUpForm.get('confirmPassword');
    }

    onSubmit(): void {
        if (this.signUpForm.valid) {
            this.isLoading = true;
            this.errorMessage = '';
            this.successMessage = '';

            // Simulate API call
            setTimeout(() => {
                const formData = this.signUpForm.value;

                // Remove confirmPassword from payload (not needed for backend)
                const { confirmPassword, ...payload } = formData;

                // Add your registration logic here
                console.log('Sign Up Attempt:', payload);

                // Show success message
                this.successMessage = 'Account created successfully! Redirecting to sign in...';
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
