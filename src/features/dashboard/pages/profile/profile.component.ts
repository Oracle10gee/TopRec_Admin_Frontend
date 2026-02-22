import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { ApiService } from '../../../../core/services/api.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { State, Qualification } from '../../../../core/models/auth.model';

@Component({
    standalone: true,
    selector: 'app-dashboard-profile',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss']
})
export class DashboardProfileComponent implements OnInit {
    profileForm!: FormGroup;
    isEditing = false;
    isSaving = false;
    isLoading = true;
    successMessage = '';
    errorMessage = '';
    userRole = '';

    states: State[] = [];
    qualifications: Qualification[] = [];

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private apiService: ApiService,
        private notificationService: NotificationService
    ) { }

    ngOnInit(): void {
        this.initializeForm();
        this.fetchStates();
        this.fetchQualifications();
        this.loadProfile();
    }

    initializeForm(): void {
        this.profileForm = this.fb.group({
            full_name: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(3)]],
            email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
            phone_number: [{ value: '', disabled: true }, [Validators.required, Validators.pattern(/^[0-9+\s\-()]+$/)]],
            membership_number: [{ value: '', disabled: true }, Validators.required],
            qualification: [{ value: '', disabled: true }, Validators.required],
            address: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(5)]],
            registration_date: [{ value: '', disabled: true }, Validators.required],
            gender: [{ value: '', disabled: true }],
            state_of_practice: [{ value: '', disabled: true }, Validators.required],
            bio: [{ value: '', disabled: true }]
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

    loadProfile(): void {
        this.isLoading = true;
        this.errorMessage = '';

        this.authService.getProfile().subscribe({
            next: (user) => {
                this.userRole = user.role || '';
                this.profileForm.patchValue({
                    full_name: user.full_name,
                    email: user.email,
                    phone_number: user.phone_number,
                    membership_number: user.membership_number,
                    qualification: user.qualification,
                    address: user.address,
                    registration_date: user.registration_date,
                    gender: user.gender || '',
                    state_of_practice: user.state_of_practice || ''
                });
                // Ensure form is in disabled state after loading
                if (!this.isEditing) {
                    this.disableAllFields();
                }
                this.isLoading = false;
            },
            error: (error) => {
                this.isLoading = false;
                this.errorMessage = error.message || 'Failed to load profile';
                console.error('Profile load error:', error);
            }
        });
    }

    /**
     * Check if gender field should be visible (only for Members)
     */
    isGenderVisible(): boolean {
        return this.userRole === 'Member';
    }

    /**
     * Check if qualification field should be visible (only for Members)
     */
    isQualificationVisible(): boolean {
        return this.userRole === 'Member';
    }

    /**
     * Get the display label for a state ID
     */
    getStateName(stateId: string): string {
        if (!stateId) return '';
        const state = this.states.find(s => s.id === stateId);
        return state ? state.name : stateId;
    }

    /**
     * Get the display label for a qualification value
     */
    getQualificationLabel(qualValue: string): string {
        if (!qualValue) return '';
        const qual = this.qualifications.find(q => q.value === qualValue);
        return qual ? qual.label : qualValue;
    }

    /**
     * Get the display label for a gender value
     */
    getGenderLabel(genderValue: string): string {
        const genderMap: Record<string, string> = {
            'male': 'Male',
            'female': 'Female',
            'other': 'Other',
            'prefer_not_to_say': 'Prefer not to say'
        };
        return genderMap[genderValue] || genderValue || '';
    }

    toggleEdit(): void {
        this.isEditing = !this.isEditing;

        if (this.isEditing) {
            // Enable only editable fields
            this.profileForm.get('email')?.enable();
            this.profileForm.get('phone_number')?.enable();
            this.profileForm.get('address')?.enable();
            this.profileForm.get('state_of_practice')?.enable();

            // Enable role-specific fields
            if (this.userRole === 'Member') {
                this.profileForm.get('qualification')?.enable();
                this.profileForm.get('gender')?.enable();
            }

            // Keep these fields disabled (read-only)
            this.profileForm.get('full_name')?.disable();
            this.profileForm.get('membership_number')?.disable();
            this.profileForm.get('registration_date')?.disable();
        } else {
            // Disable all fields when canceling
            this.disableAllFields();
            // Reset form to original values if canceling
            this.loadProfile();
        }
    }

    private disableAllFields(): void {
        this.profileForm.get('full_name')?.disable();
        this.profileForm.get('email')?.disable();
        this.profileForm.get('phone_number')?.disable();
        this.profileForm.get('membership_number')?.disable();
        this.profileForm.get('qualification')?.disable();
        this.profileForm.get('address')?.disable();
        this.profileForm.get('registration_date')?.disable();
        this.profileForm.get('gender')?.disable();
        this.profileForm.get('state_of_practice')?.disable();
    }

    onSubmit(): void {
        // Mark all enabled fields as touched to show validation errors
        Object.keys(this.profileForm.controls).forEach(key => {
            const control = this.profileForm.get(key);
            if (control && !control.disabled) {
                control.markAsTouched();
            }
        });

        // Check if editable fields are valid
        const emailValid = this.profileForm.get('email')?.valid;
        const phoneValid = this.profileForm.get('phone_number')?.valid;
        const addressValid = this.profileForm.get('address')?.valid;
        const stateValid = this.profileForm.get('state_of_practice')?.valid;

        let allEditableFieldsValid = emailValid && phoneValid && addressValid && stateValid;

        // Check role-specific fields
        if (this.userRole === 'Member') {
            const qualificationValid = this.profileForm.get('qualification')?.valid;
            allEditableFieldsValid = allEditableFieldsValid && qualificationValid;
        }

        if (!allEditableFieldsValid) {
            this.errorMessage = 'Please fill in all required fields correctly';
            setTimeout(() => {
                this.errorMessage = '';
            }, 5000);
            return;
        }

        this.isSaving = true;
        this.errorMessage = '';
        this.successMessage = '';

        // Get the current user ID
        const currentUser = this.authService.getCurrentUserSync();
        const userId = currentUser?.id;

        if (!userId) {
            this.isSaving = false;
            this.errorMessage = 'User ID not found. Please log in again.';
            this.notificationService.error(this.errorMessage);
            return;
        }

        // Prepare the update payload (only editable fields)
        const updateData: any = {
            email: this.profileForm.get('email')?.value,
            phone_number: this.profileForm.get('phone_number')?.value,
            address: this.profileForm.get('address')?.value,
            state_of_practice: this.profileForm.get('state_of_practice')?.value
        };

        // Include role-specific fields
        if (this.userRole === 'Member') {
            updateData.qualification = this.profileForm.get('qualification')?.value;
            updateData.gender = this.profileForm.get('gender')?.value;
        }

        console.log('Updating profile with data:', updateData);

        // Call the API to update the user profile
        this.authService.updateUser(userId, updateData).subscribe({
            next: (response) => {
                this.isSaving = false;
                this.successMessage = 'Profile updated successfully!';
                this.notificationService.success('Profile updated successfully!');
                this.isEditing = false;
                this.disableAllFields();

                // Refresh the profile data
                this.loadProfile();

                setTimeout(() => {
                    this.successMessage = '';
                }, 3000);
            },
            error: (error) => {
                this.isSaving = false;
                const errorMsg = error.error?.message || error.message || 'Failed to update profile';
                this.errorMessage = errorMsg;
                this.notificationService.error(errorMsg);
                console.error('Profile update error:', error);
            }
        });
    }

    /**
     * Check if form is valid for submission
     * Only checks enabled (editable) fields
     */
    isFormValid(): boolean {
        const emailValid = this.profileForm.get('email')?.valid ?? false;
        const phoneValid = this.profileForm.get('phone_number')?.valid ?? false;
        const addressValid = this.profileForm.get('address')?.valid ?? false;
        const stateValid = this.profileForm.get('state_of_practice')?.valid ?? false;

        let valid = emailValid && phoneValid && addressValid && stateValid;

        if (this.userRole === 'Member') {
            const qualificationValid = this.profileForm.get('qualification')?.valid ?? false;
            valid = valid && qualificationValid;
        }

        return valid;
    }

    get full_name() {
        return this.profileForm.get('full_name');
    }

    get email() {
        return this.profileForm.get('email');
    }

    get phone_number() {
        return this.profileForm.get('phone_number');
    }

    get membership_number() {
        return this.profileForm.get('membership_number');
    }

    get qualification() {
        return this.profileForm.get('qualification');
    }

    get address() {
        return this.profileForm.get('address');
    }

    get registration_date() {
        return this.profileForm.get('registration_date');
    }

    get gender() {
        return this.profileForm.get('gender');
    }

    get state_of_practice() {
        return this.profileForm.get('state_of_practice');
    }

    get bio() {
        return this.profileForm.get('bio');
    }
}
