import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ApiService } from '../../../../core/services/api.service';
import { State, Qualification } from '../../../../core/models/auth.model';

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
    selectedRole: string = '';
    states: State[] = [];
    qualifications: Qualification[] = [];

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private authService: AuthService,
        private apiService: ApiService
    ) { }

    ngOnInit(): void {
        this.initializeForm();
        this.fetchStates();
        this.fetchQualifications();
    }

    initializeForm(): void {
        this.signUpForm = this.fb.group({
            role: ['', Validators.required],
            full_name: ['', [Validators.required, Validators.minLength(3)]],
            membership_number: ['', Validators.required],
            qualification: [''],
            gender: [''],
            state_of_practice: ['', Validators.required],
            registration_date: ['', Validators.required],
            address: ['', [Validators.required, Validators.minLength(5)]],
            phone_number: ['', [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirm_password: ['', Validators.required]
        }, {
            validators: [this.passwordMatchValidator, this.qualificationRequiredValidator.bind(this)]
        });

        // Subscribe to role changes to update qualification and gender requirement
        this.signUpForm.get('role')?.valueChanges.subscribe((role) => {
            this.selectedRole = role;
            this.updateQualificationValidation(role);
            this.updateGenderValidation(role);

            // Auto-set qualification and gender defaults for non-Member roles
            const qualificationControl = this.signUpForm.get('qualification');
            const genderControl = this.signUpForm.get('gender');
            if (role === 'Consulting Firm' || role === 'Practice Firm') {
                qualificationControl?.setValue('Associate', { emitEvent: false });
                genderControl?.setValue('prefer_not_to_say', { emitEvent: false });
            }
        });
    }

    private fetchStates(): void {
        this.apiService.get<any>('/states').subscribe({
            next: (response) => {
                this.states = response.data.states;
            },
            error: (error) => {
                console.error('Failed to fetch states:', error);
            }
        });
    }

    private fetchQualifications(): void {
        this.apiService.get<any>('/auth/qualifications').subscribe({
            next: (response) => {
                this.qualifications = response.data.qualifications;
            },
            error: (error) => {
                console.error('Failed to fetch qualifications:', error);
            }
        });
    }

    /**
     * Update qualification field validation based on role
     */
    private updateQualificationValidation(role: string): void {
        const qualificationControl = this.signUpForm.get('qualification');
        if (role === 'Member') {
            qualificationControl?.setValidators([Validators.required]);
        } else {
            qualificationControl?.setValidators([]);
            qualificationControl?.reset();
        }
        qualificationControl?.updateValueAndValidity();
    }

    /**
     * Update gender field validation based on role
     */
    private updateGenderValidation(role: string): void {
        const genderControl = this.signUpForm.get('gender');
        if (role === 'Member') {
            genderControl?.setValidators([Validators.required]);
        } else {
            genderControl?.setValidators([]);
            genderControl?.reset();
        }
        genderControl?.updateValueAndValidity();
    }

    /**
     * Custom validator to require qualification for Members
     */
    private qualificationRequiredValidator(): { [key: string]: any } | null {
        const role = this.signUpForm?.get('role')?.value;
        const qualification = this.signUpForm?.get('qualification')?.value;

        if (role === 'Member' && !qualification) {
            return { qualificationRequired: true };
        }
        return null;
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

    get role() {
        return this.signUpForm.get('role');
    }

    get gender() {
        return this.signUpForm.get('gender');
    }

    get state_of_practice() {
        return this.signUpForm.get('state_of_practice');
    }

    /**
     * Check if qualification field should be visible
     */
    isQualificationVisible(): boolean {
        return this.selectedRole === 'Member';
    }

    /**
     * Check if gender field should be visible (only for Members)
     */
    isGenderVisible(): boolean {
        return this.selectedRole === 'Member';
    }

    onSubmit(): void {
        if (this.signUpForm.valid) {
            this.isLoading = true;
            this.errorMessage = '';
            this.successMessage = '';

            const formData = this.signUpForm.value;
            const signUpData = {
                ...formData
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
