import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

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
    successMessage = '';
    errorMessage = '';

    constructor(private fb: FormBuilder) { }

    ngOnInit(): void {
        this.initializeForm();
    }

    initializeForm(): void {
        this.profileForm = this.fb.group({
            fullName: ['Kunle Developer', [Validators.required, Validators.minLength(3)]],
            email: ['kunle@toprecng.org', [Validators.required, Validators.email]],
            phoneNumber: ['+2348012345678', [Validators.required, Validators.pattern(/^[0-9+\s\-()]+$/)]],
            rtp: ['RTP/2024/001', Validators.required],
            qualification: ['Master in Urban Planning', Validators.required],
            address: ['Lagos, Nigeria', [Validators.required, Validators.minLength(5)]],
            dateOfRegistration: ['2024-01-15', Validators.required],
            bio: ['Professional urban planner with 5 years experience', Validators.minLength(10)]
        });

        this.profileForm.disable();
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

    get fullName() {
        return this.profileForm.get('fullName');
    }

    get email() {
        return this.profileForm.get('email');
    }

    get phoneNumber() {
        return this.profileForm.get('phoneNumber');
    }

    get rtp() {
        return this.profileForm.get('rtp');
    }

    get qualification() {
        return this.profileForm.get('qualification');
    }

    get address() {
        return this.profileForm.get('address');
    }

    get dateOfRegistration() {
        return this.profileForm.get('dateOfRegistration');
    }

    get bio() {
        return this.profileForm.get('bio');
    }
}
