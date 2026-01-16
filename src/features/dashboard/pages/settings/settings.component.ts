import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SecuritySettingsComponent } from './components/security-settings/security-settings.component';
import { NotificationSettingsComponent } from './components/notification-settings/notification-settings.component';
import { UsersSettingsComponent } from './components/users-settings/users-settings.component';

type SettingsTab = 'security' | 'notifications' | 'users' | 'account';

@Component({
    standalone: true,
    selector: 'app-dashboard-settings',
    imports: [CommonModule, SecuritySettingsComponent, NotificationSettingsComponent, UsersSettingsComponent],
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss']
})
export class DashboardSettingsComponent implements OnInit {
    activeTab: SettingsTab = 'security';

    // Mock data - replace with actual API calls
    private lastPasswordChangeDate = new Date('2024-12-15');
    private activeSessions = 2;
    private unreadNotifications = true;

    ngOnInit(): void {
        // Load user preferences
        this.loadUserPreferences();
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
        return ['security', 'notifications', 'users', 'account'].includes(tab);
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
     * Get last password change date formatted
     */
    getLastPasswordChange(): string {
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - this.lastPasswordChangeDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
        } else if (diffDays < 365) {
            const months = Math.floor(diffDays / 30);
            return `${months} ${months === 1 ? 'month' : 'months'} ago`;
        } else {
            const years = Math.floor(diffDays / 365);
            return `${years} ${years === 1 ? 'year' : 'years'} ago`;
        }
    }

    /**
     * Get number of active sessions
     */
    getActiveSessions(): number {
        return this.activeSessions;
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

    /**
     * Export settings as JSON
     */
    exportSettings(): void {
        const settings = {
            activeTab: this.activeTab,
            lastPasswordChange: this.lastPasswordChangeDate.toISOString(),
            exportDate: new Date().toISOString()
        };

        const dataStr = JSON.stringify(settings, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `toprec-settings-${Date.now()}.json`;
        link.click();

        URL.revokeObjectURL(url);
    }

    /**
     * Import settings from JSON file
     */
    importSettings(): void {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';

        input.onchange = (event: any) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e: any) => {
                    try {
                        const settings = JSON.parse(e.target.result);
                        this.applyImportedSettings(settings);
                        alert('Settings imported successfully!');
                    } catch (error) {
                        alert('Error importing settings. Please check the file format.');
                        console.error('Import error:', error);
                    }
                };
                reader.readAsText(file);
            }
        };

        input.click();
    }

    /**
     * Apply imported settings
     */
    private applyImportedSettings(settings: any): void {
        if (settings.activeTab && this.isValidTab(settings.activeTab)) {
            this.setActiveTab(settings.activeTab);
        }
        // Apply other settings as needed
    }
}