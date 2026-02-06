import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '../../../../core/services/auth.service';

interface Stat {
    label: string;
    value: string;
    icon: SafeHtml;
    iconPath: string;
    iconBg: string;
    iconColor: string;
    change: string;
    changePositive: boolean;
    badge?: string;
    badgeClass?: string;
}

interface QuickAction {
    id: string;
    title: string;
    description: string;
    bgColor: string;
    iconColor: string;
    iconPath: string;
    route: string;
}

interface Activity {
    type: string;
    timestamp: string;
    iconPath: string;
    bgColor: string;
    iconColor: string;
    status: string;
    statusClass: string;
}

@Component({
    standalone: true,
    selector: 'app-dashboard-home',
    imports: [CommonModule],
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class DashboardHomeComponent implements OnInit {
    stats: Stat[] = [];
    quickActions: QuickAction[] = [];
    recentActivities: Activity[] = [];

    constructor(
        private router: Router,
        private sanitizer: DomSanitizer,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        this.initializeStats();
        this.initializeQuickActions();
        this.initializeActivities();
    }

    private initializeStats(): void {
        this.stats = [
            {
                label: 'Active Licenses',
                value: '1',
                icon: this.sanitizer.bypassSecurityTrustHtml(''),
                iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
                iconBg: 'bg-blue-100',
                iconColor: 'text-blue-600',
                change: '+0%',
                changePositive: true,
                badge: 'Active',
                badgeClass: 'bg-green-100 text-green-700'
            },
            {
                label: 'Total Payments',
                value: '₦0',
                icon: this.sanitizer.bypassSecurityTrustHtml(''),
                iconPath: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
                iconBg: 'bg-green-100',
                iconColor: 'text-green-600',
                change: '+0%',
                changePositive: true
            },
            {
                label: 'Profile Completion',
                value: '100%',
                icon: this.sanitizer.bypassSecurityTrustHtml(''),
                iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
                iconBg: 'bg-purple-100',
                iconColor: 'text-purple-600',
                change: '+100%',
                changePositive: true,
                badge: 'Complete',
                badgeClass: 'bg-purple-100 text-purple-700'
            },
            {
                label: 'Pending Renewals',
                value: '1',
                icon: this.sanitizer.bypassSecurityTrustHtml(''),
                iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
                iconBg: 'bg-orange-100',
                iconColor: 'text-orange-600',
                change: '+1',
                changePositive: false,
                badge: 'Due Soon',
                badgeClass: 'bg-orange-100 text-orange-700'
            }
        ];
    }

    private initializeQuickActions(): void {
        this.quickActions = [
            {
                id: 'profile',
                title: 'Update Profile',
                description: 'Edit your personal information',
                bgColor: 'bg-blue-50',
                iconColor: 'text-blue-600',
                iconPath: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
                route: '/dashboard/profile'
            },
            {
                id: 'payment',
                title: 'Make Payment',
                description: 'Pay for license renewal',
                bgColor: 'bg-green-50',
                iconColor: 'text-green-600',
                iconPath: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
                route: '/dashboard/payments'
            },
            {
                id: 'license',
                title: 'View License',
                description: 'Check license details & status',
                bgColor: 'bg-purple-50',
                iconColor: 'text-purple-600',
                iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
                route: '/dashboard/license'
            },
            {
                id: 'certificate',
                title: 'Verify Certificate',
                description: 'Share your credentials',
                bgColor: 'bg-orange-50',
                iconColor: 'text-orange-600',
                iconPath: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
                route: '/dashboard/certificate'
            }
        ];
    }

    private initializeActivities(): void {
        this.recentActivities = [
            {
                type: 'Successful Login',
                timestamp: '2 hours ago',
                iconPath: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
                bgColor: 'bg-green-50',
                iconColor: 'text-green-600',
                status: 'Success',
                statusClass: 'bg-green-100 text-green-700'
            },
            {
                type: 'Profile Updated',
                timestamp: '1 day ago',
                iconPath: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
                bgColor: 'bg-blue-50',
                iconColor: 'text-blue-600',
                status: 'Completed',
                statusClass: 'bg-blue-100 text-blue-700'
            },
            {
                type: 'Payment Processed',
                timestamp: '5 days ago',
                iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
                bgColor: 'bg-purple-50',
                iconColor: 'text-purple-600',
                status: 'Verified',
                statusClass: 'bg-purple-100 text-purple-700'
            },
            {
                type: 'License Renewed',
                timestamp: '2 weeks ago',
                iconPath: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
                bgColor: 'bg-orange-50',
                iconColor: 'text-orange-600',
                status: 'Active',
                statusClass: 'bg-orange-100 text-orange-700'
            }
        ];
    }

    getUserFirstName(): string {
        const fullName = this.authService.getCurrentUserName();
        if (!fullName) {
            return 'User';
        }
        return fullName.split(' ')[0];
    }

    getCurrentDate(): string {
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return new Date().toLocaleDateString('en-US', options);
    }

    handleQuickAction(actionId: string): void {
        const action = this.quickActions.find(a => a.id === actionId);
        if (action) {
            this.router.navigate([action.route]);
        }
    }
}