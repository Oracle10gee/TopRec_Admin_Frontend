import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SecuritySettingsComponent } from './components/security-settings/security-settings.component';
import { NotificationSettingsComponent } from './components/notification-settings/notification-settings.component';
import { UsersSettingsComponent } from './components/users-settings/users-settings.component';
import { PaymentSettingsComponent } from './components/payment-settings/payment-settings.component';
import { AuthService } from '../../../../core/services/auth.service';

type SettingsTab = 'security' | 'notifications' | 'users' | 'payments' | 'account';

@Component({
    standalone: true,
    selector: 'app-dashboard-settings',
    imports: [CommonModule, SecuritySettingsComponent, NotificationSettingsComponent, UsersSettingsComponent, PaymentSettingsComponent],
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss']
})
export class DashboardSettingsComponent implements OnInit {
    activeTab: SettingsTab = 'security';
    availableTabs: SettingsTab[] = [];

    private unreadNotifications = true;

    constructor(private authService: AuthService) { }

    ngOnInit(): void {
        // Initialize available tabs based on user role
        this.initializeAvailableTabs();
        // Load user preferences
        this.loadUserPreferences();
    }

    /**
     * Initialize tabs based on user role
     */
    private initializeAvailableTabs(): void {
        const userRole = this.authService.getCurrentUserRole();

        if (userRole === 'Member' || userRole === 'Consulting Firm' || userRole === 'Practice Firm') {
            // Members, Consulting Firms, and Practice Firms only see Security Settings and Notifications tabs
            this.availableTabs = ['security', 'notifications'];
        } else if (userRole === 'Superadmin') {
            // Superadmin sees Security, Notifications and Payments only.
            // 'users' and 'account' are redundant — managed via Members Directory.
            this.availableTabs = ['security', 'notifications', 'payments'];
        } else {
            // Other roles see: Security, Notifications, Users
            this.availableTabs = ['security', 'notifications', 'users', 'account'];
        }
    }

    /**
     * Load user preferences from localStorage or API
     */
    private loadUserPreferences(): void {
        const savedTab = localStorage.getItem('settings_active_tab');
        if (savedTab && this.isValidTab(savedTab)) {
            this.activeTab = savedTab as SettingsTab;
        }
    }

    /**
     * Validate tab name
     */
    private isValidTab(tab: string): boolean {
        return this.availableTabs.includes(tab as SettingsTab);
    }

    /**
     * Check if tab is visible to user
     */
    isTabVisible(tab: SettingsTab): boolean {
        return this.availableTabs.includes(tab);
    }

    /**
     * Set active tab and save preference
     */
    setActiveTab(tab: SettingsTab): void {
        this.activeTab = tab;
        // Save preference
        localStorage.setItem('settings_active_tab', tab);

        // Optional: Track analytics
        console.log(`Settings tab changed to: ${tab}`);
    }

    /**
     * Check if there are unread notifications
     */
    hasUnreadNotifications(): boolean {
        return this.unreadNotifications;
    }

    /**
     * Reset all settings to defaults
     */
    resetAllSettings(): void {
        const confirmed = confirm(
            'Are you sure you want to reset all settings to their default values? This action cannot be undone.'
        );

        if (confirmed) {
            console.log('Resetting all settings...');

            // Clear localStorage settings
            localStorage.removeItem('settings_active_tab');

            // Reset to default tab
            this.activeTab = 'security';

            // Show success message
            alert('All settings have been reset to defaults.');

            // Reload the page to apply changes
            window.location.reload();
        }
    }

}