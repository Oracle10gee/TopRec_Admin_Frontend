import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

interface NotificationOption {
    id: string;
    label: string;
    description: string;
    iconPath: string;
    iconBg: string;
    iconColor: string;
    additionalInfo?: string;
}

@Component({
    standalone: true,
    selector: 'app-notification-settings',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './notification-settings.component.html',
    styleUrls: ['./notification-settings.component.scss']
})
export class NotificationSettingsComponent implements OnInit {
    notificationForm!: FormGroup;
    isSaving = false;
    successMessage = '';
    errorMessage = '';

    notificationOptions: NotificationOption[] = [
        {
            id: 'emailNotifications',
            label: 'Email Notifications',
            description: 'Receive important updates and announcements via email',
            iconPath: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
            additionalInfo: 'Sent to your registered email address'
        },
        {
            id: 'smsNotifications',
            label: 'SMS Notifications',
            description: 'Get instant text message alerts for urgent matters',
            iconPath: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
            iconBg: 'bg-green-100',
            iconColor: 'text-green-600',
            additionalInfo: 'Standard messaging rates may apply'
        },
        {
            id: 'paymentReminders',
            label: 'Payment Reminders',
            description: 'Stay on top of payment deadlines and due dates',
            iconPath: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-600',
            additionalInfo: 'Sent 7 days before due date'
        },
        {
            id: 'renewalReminders',
            label: 'License Renewal Reminders',
            description: 'Never miss your license renewal deadline',
            iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
            iconBg: 'bg-orange-100',
            iconColor: 'text-orange-600',
            additionalInfo: 'Sent 30 days before expiry'
        },
        {
            id: 'newsletters',
            label: 'TOPREC Newsletter',
            description: 'Subscribe to monthly updates and industry news',
            iconPath: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z',
            iconBg: 'bg-pink-100',
            iconColor: 'text-pink-600',
            additionalInfo: 'Sent monthly on the 1st'
        },
        {
            id: 'systemAlerts',
            label: 'System Alerts',
            description: 'Critical system notifications and security updates',
            iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
            iconBg: 'bg-red-100',
            iconColor: 'text-red-600',
            additionalInfo: 'Important security updates'
        }
    ];

    // Default notification states
    private defaultPreferences = {
        emailNotifications: true,
        smsNotifications: false,
        paymentReminders: true,
        renewalReminders: true,
        newsletters: false,
        systemAlerts: true
    };

    constructor(private fb: FormBuilder) {}

    ngOnInit(): void {
        this.initializeForm();
    }

    private initializeForm(): void {
        this.notificationForm = this.fb.group({
            emailNotifications: [true],
            smsNotifications: [false],
            paymentReminders: [true],
            renewalReminders: [true],
            newsletters: [false],
            systemAlerts: [true]
        });
    }

    /**
     * Save notification preferences
     */
    onNotificationSave(): void {
        if (this.notificationForm.invalid) {
            this.errorMessage = 'Please check your preferences';
            this.clearMessage('error', 5000);
            return;
        }

        this.isSaving = true;
        this.errorMessage = '';
        this.successMessage = '';

        // Simulate API call
        setTimeout(() => {
            const enabledCount = this.getEnabledCount();
            this.successMessage = `Notification preferences updated successfully! ${enabledCount} notification(s) enabled.`;
            this.isSaving = false;

            // Clear success message after 5 seconds
            this.clearMessage('success', 5000);
        }, 1500);
    }

    /**
     * Enable all notifications
     */
    enableAll(): void {
        const allEnabled: any = {};
        this.notificationOptions.forEach(option => {
            allEnabled[option.id] = true;
        });
        this.notificationForm.patchValue(allEnabled);
    }

    /**
     * Disable all notifications
     */
    disableAll(): void {
        const allDisabled: any = {};
        this.notificationOptions.forEach(option => {
            allDisabled[option.id] = false;
        });
        this.notificationForm.patchValue(allDisabled);
    }

    /**
     * Reset to default preferences
     */
    resetToDefaults(): void {
        this.notificationForm.patchValue(this.defaultPreferences);
    }

    /**
     * Get count of enabled notifications
     */
    getEnabledCount(): number {
        let count = 0;
        this.notificationOptions.forEach(option => {
            if (this.notificationForm.get(option.id)?.value) {
                count++;
            }
        });
        return count;
    }

    /**
     * Get percentage of enabled notifications
     */
    getEnabledPercentage(): number {
        const enabled = this.getEnabledCount();
        const total = this.notificationOptions.length;
        return Math.round((enabled / total) * 100);
    }

    /**
     * Get icon background class for notification type
     */
    getIconBgClass(optionId: string): string {
        const option = this.notificationOptions.find(o => o.id === optionId);
        return option?.iconBg || 'bg-gray-100';
    }

    /**
     * Get icon color class for notification type
     */
    getIconColorClass(optionId: string): string {
        const option = this.notificationOptions.find(o => o.id === optionId);
        return option?.iconColor || 'text-gray-600';
    }

    /**
     * Clear message after timeout
     */
    private clearMessage(type: 'success' | 'error', delay: number): void {
        setTimeout(() => {
            if (type === 'success') {
                this.successMessage = '';
            } else {
                this.errorMessage = '';
            }
        }, delay);
    }
}