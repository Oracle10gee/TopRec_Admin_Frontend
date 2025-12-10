import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
    standalone: true,
    selector: 'app-dashboard-settings',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss']
})
export class DashboardSettingsComponent implements OnInit {
    securityForm!: FormGroup;
    notificationForm!: FormGroup;
    showCurrentPassword = false;
    showNewPassword = false;
    showConfirmPassword = false;
    isSaving = false;
    successMessage = '';
    errorMessage = '';

    constructor(private fb: FormBuilder) { }

    ngOnInit(): void {
        this.initializeForms();
    }

    initializeForms(): void {
        this.securityForm = this.fb.group({
            currentPassword: ['', Validators.required],
            newPassword: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', Validators.required]
        }, {
            validators: this.passwordMatchValidator
        });

        this.notificationForm = this.fb.group({
            emailNotifications: [true],
            smsNotifications: [false],
            paymentReminders: [true],
            renewalReminders: [true],
            newsletters: [false]
        });
    }

    passwordMatchValidator(group: FormGroup): { [key: string]: any } | null {
        const password = group.get('newPassword')?.value;
        const confirmPassword = group.get('confirmPassword')?.value;

        if (password && confirmPassword && password !== confirmPassword) {
            return { passwordMismatch: true };
        }
        return null;
    }

    onPasswordChange(): void {
        if (this.securityForm.valid) {
            this.isSaving = true;
            this.errorMessage = '';

            setTimeout(() => {
                console.log('Password Changed');
                this.successMessage = 'Password changed successfully!';
                this.isSaving = false;
                this.securityForm.reset();

                setTimeout(() => {
                    this.successMessage = '';
                }, 3000);
            }, 1500);
        }
    }

    onNotificationSave(): void {
        this.isSaving = true;
        this.errorMessage = '';

        setTimeout(() => {
            console.log('Notifications Updated:', this.notificationForm.value);
            this.successMessage = 'Notification preferences updated successfully!';
            this.isSaving = false;

            setTimeout(() => {
                this.successMessage = '';
            }, 3000);
        }, 1500);
    }

    deleteAccount(): void {
        if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            console.log('Account deletion initiated');
        }
    }
}
