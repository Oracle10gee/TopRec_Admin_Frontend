import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';

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

    constructor(
        private fb: FormBuilder,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        this.initializeForm();
        this.loadProfile();
    }

    initializeForm(): void {
        this.profileForm = this.fb.group({
            full_name: ['', [Validators.required, Validators.minLength(3)]],
            email: ['', [Validators.required, Validators.email]],
            phone_number: ['', [Validators.required, Validators.pattern(/^[0-9+\s\-()]+$/)]],
            membership_number: ['', Validators.required],
            qualification: ['', Validators.required],
            address: ['', [Validators.required, Validators.minLength(5)]],
            registration_date: ['', Validators.required],
            bio: ['', Validators.minLength(10)]
        });

        this.profileForm.disable();
    }

    loadProfile(): void {
        this.isLoading = true;
        this.errorMessage = '';

        // Debug: check if token exists
        const token = this.authService.getAccessToken();
        console.log('Token in ProfileComponent:', token);

        this.authService.getProfile().subscribe({
            next: (user) => {
                this.profileForm.patchValue({
                    full_name: user.full_name,
                    email: user.email,
                    phone_number: user.phone_number,
                    membership_number: user.membership_number,
                    qualification: user.qualification,
                    address: user.address,
                    registration_date: user.registration_date,
                    bio: ''
                });
                this.isLoading = false;
            },
            error: (error) => {
                this.isLoading = false;
                this.errorMessage = error.message || 'Failed to load profile';
                console.error('Profile load error:', error);
            }
        });
    }

    toggleEdit(): void {
        this.isEditing = !this.isEditing;
        if (this.isEditing) {
            this.profileForm.enable();
        } else {
            this.profileForm.disable();
        }
    }

    onSubmit(): void {
        if (this.profileForm.valid) {
            this.isSaving = true;
            this.errorMessage = '';
            this.successMessage = '';

            setTimeout(() => {
                console.log('Profile Updated:', this.profileForm.value);
                this.successMessage = 'Profile updated successfully!';
                this.isSaving = false;
                this.isEditing = false;
                this.profileForm.disable();

                setTimeout(() => {
                    this.successMessage = '';
                }, 3000);
            }, 1500);
        } else {
            this.errorMessage = 'Please fill in all required fields correctly';
        }
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

    get bio() {
        return this.profileForm.get('bio');
    }
}
