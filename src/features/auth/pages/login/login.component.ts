import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth.service';
import { ApiService } from '../../../../core/services/api.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { User, State, Qualification } from '../../../../core/models/auth.model';

@Component({
    standalone: true,
    selector: 'app-sign-in',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
    signInForm!: FormGroup;
    existingUserForm!: FormGroup;
    showPassword = false;
    isLoading = false;
    errorMessage = '';

    // Existing user modal state
    showExistingUserModal = false;
    isUpdating = false;
    updateErrorMessage = '';
    existingUser: User | null = null;
    states: State[] = [];
    qualifications: Qualification[] = [];
    selectedRole = '';

    private destroy$ = new Subject<void>();

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private authService: AuthService,
        private apiService: ApiService,
        private notificationService: NotificationService
    ) { }

    ngOnInit(): void {
        this.initializeForm();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    initializeForm(): void {
        this.signInForm = this.fb.group({
            identifier: ['', [Validators.required]],
            password: ['', [Validators.required, Validators.minLength(6)]]
        });
    }

    private initializeExistingUserForm(user: User): void {
        this.selectedRole = user.role || '';

        this.existingUserForm = this.fb.group({
            role: [{ value: user.role || '', disabled: true }],
            full_name: [user.full_name || '', [Validators.required, Validators.minLength(3)]],
            membership_number: [{ value: user.membership_number || '', disabled: true }],
            qualification: [user.qualification || ''],
            // Cleared so the user must actively select — required for Members via role block below
            gender: [''],
            state_of_practice: [user.state_of_practice || '', Validators.required],
            registration_date: [user.registration_date ? this.formatDateForInput(user.registration_date) : '', Validators.required],
            address: [user.address || '', [Validators.required, Validators.minLength(5)]],
            // Cleared so the user must re-enter — must be exactly 11 digits
            phone_number: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
            email: [user.email || '', [Validators.required, Validators.email]],
        });

        // Qualification and gender are only required for Members
        if (this.selectedRole === 'Member') {
            this.existingUserForm.get('qualification')?.setValidators([Validators.required]);
            this.existingUserForm.get('gender')?.setValidators([Validators.required]);
        }
        this.existingUserForm.get('qualification')?.updateValueAndValidity();
        this.existingUserForm.get('gender')?.updateValueAndValidity();
    }

    /**
     * Format a date string to YYYY-MM-DD for input[type="date"]
     */
    private formatDateForInput(dateStr: string): string {
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch {
            return dateStr;
        }
    }

    private fetchStates(): void {
        this.apiService.get<any>('/states')
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    this.states = response.data.states;
                },
                error: (error) => {
                    console.error('Failed to fetch states:', error);
                }
            });
    }

    private fetchQualifications(): void {
        this.apiService.get<any>('/auth/qualifications')
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    this.qualifications = response.data.qualifications;
                },
                error: (error) => {
                    console.error('Failed to fetch qualifications:', error);
                }
            });
    }

    togglePasswordVisibility(): void {
        this.showPassword = !this.showPassword;
    }

    get identifier() {
        return this.signInForm.get('identifier');
    }

    get password() {
        return this.signInForm.get('password');
    }

    // Existing user form getters
    get eu_full_name() { return this.existingUserForm?.get('full_name'); }
    get eu_email() { return this.existingUserForm?.get('email'); }
    get eu_phone_number() { return this.existingUserForm?.get('phone_number'); }
    get eu_address() { return this.existingUserForm?.get('address'); }
    get eu_gender() { return this.existingUserForm?.get('gender'); }
    get eu_membership_number() { return this.existingUserForm?.get('membership_number'); }
    get eu_state_of_practice() { return this.existingUserForm?.get('state_of_practice'); }
    get eu_qualification() { return this.existingUserForm?.get('qualification'); }
    get eu_registration_date() { return this.existingUserForm?.get('registration_date'); }
    get eu_role() { return this.existingUserForm?.get('role'); }

    /**
     * Check if qualification field should be visible (only for Members)
     */
    isQualificationVisible(): boolean {
        return this.selectedRole === 'Member';
    }

    /**
     * Gender is only collected for Members.
     */
    isGenderVisible(): boolean {
        return this.selectedRole === 'Member';
    }

    onSubmit(): void {
        if (this.signInForm.valid) {
            this.isLoading = true;
            this.errorMessage = '';

            const credentials = this.signInForm.value;

            this.authService.login(credentials)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (user: any) => {
                        this.isLoading = false;

                        // Check if user is an existing user that needs profile update
                        if (user?.is_existing === true) {
                            this.existingUser = user;
                            this.fetchStates();
                            this.fetchQualifications();
                            this.initializeExistingUserForm(user);
                            this.showExistingUserModal = true;
                        } else {
                            // Normal login flow
                            const route = user?.role === 'Superadmin' ? '/dashboard/member' : '/dashboard/home';
                            this.router.navigate([route]);
                        }
                    },
                    error: (error) => {
                        this.isLoading = false;
                        this.errorMessage = error.message || 'Login failed. Please try again.';
                        this.notificationService.error(this.errorMessage);
                    }
                });
        } else {
            // Mark all fields as touched to show validation errors
            Object.keys(this.signInForm.controls).forEach(key => {
                this.signInForm.get(key)?.markAsTouched();
            });
        }
    }

    /**
     * Submit existing user profile update
     */
    onUpdateProfile(): void {
        if (this.existingUserForm.valid && this.existingUser) {
            this.isUpdating = true;
            this.updateErrorMessage = '';

            // Get form values including disabled fields
            const formData = this.existingUserForm.getRawValue();

            // Build payload for PUT request
            const payload: any = {
                full_name: formData.full_name,
                email: formData.email,
                phone_number: formData.phone_number,
                address: formData.address,
                state_of_practice: formData.state_of_practice,
                registration_date: formData.registration_date,
                role: formData.role,
                membership_number: formData.membership_number,
            };

            // Gender and qualification are only collected from Members
            if (this.selectedRole === 'Member') {
                payload.gender = formData.gender;
                payload.qualification = formData.qualification;
            } else {
                payload.gender = 'prefer_not_to_say';
                payload.qualification = 'Associate';
            }

            this.authService.updateUser(this.existingUser.id, payload)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: () => {
                        this.isUpdating = false;
                        this.showExistingUserModal = false;
                        this.notificationService.success('Profile updated successfully!');

                        // Route to dashboard
                        const route = this.existingUser?.role === 'Superadmin' ? '/dashboard/member' : '/dashboard/home';
                        this.router.navigate([route]);
                    },
                    error: (error) => {
                        this.isUpdating = false;
                        this.updateErrorMessage = error.message || 'Failed to update profile. Please try again.';
                        this.notificationService.error(this.updateErrorMessage);
                    }
                });
        } else {
            // Mark all fields as touched to show validation errors
            if (this.existingUserForm) {
                Object.keys(this.existingUserForm.controls).forEach(key => {
                    this.existingUserForm.get(key)?.markAsTouched();
                });
            }
        }
    }

    navigateToForgotPassword(): void {
        this.router.navigate(['/auth/forgot-password']);
    }

    navigateToSignUp(): void {
        this.router.navigate(['/auth/signup']);
    }
}
