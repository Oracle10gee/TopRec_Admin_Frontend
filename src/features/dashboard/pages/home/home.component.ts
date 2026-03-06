import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth.service';
import { ApiService } from '../../../../core/services/api.service';
import { User } from '../../../../core/models/auth.model';

interface QuickAction {
    id: string;
    title: string;
    description: string;
    bgColor: string;
    iconColor: string;
    iconPath: string;
    route: string;
}

@Component({
    standalone: true,
    selector: 'app-dashboard-home',
    imports: [CommonModule],
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class DashboardHomeComponent implements OnInit, OnDestroy {
    user: User | null = null;
    quickActions: QuickAction[] = [];
    isLoading = true;

    // License computed data
    licenseStatus: 'Active' | 'Expired' | 'Blocked' = 'Active';
    canViewLicense = false;
    validYear: number = new Date().getFullYear();
    daysUntilExpiry = 0;
    licenseProgressPercent = 0;

    // Financial status
    financialStatusLabel = 'Clear';
    financialStatusAmount = '₦0';
    hasOutstandingBalance = false;

    // Profile completion
    profileCompletionPercent = 0;
    profileFieldsFilled = 0;
    profileFieldsTotal = 6;

    // Member since
    memberSinceDate = '';

    // Recent payments
    recentPaymentsCount = 0;
    totalPaymentsAmount = '₦0';

    private destroy$ = new Subject<void>();

    constructor(
        private router: Router,
        private authService: AuthService,
        private apiService: ApiService
    ) {}

    ngOnInit(): void {
        this.initializeQuickActions();
        this.loadUserData();
        this.loadPaymentSummary();
        this.refreshUserProfile();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Load user data from AuthService and compute all derived values
     */
    private loadUserData(): void {
        this.authService.currentUser$
            .pipe(takeUntil(this.destroy$))
            .subscribe(user => {
                this.user = user;
                if (user) {
                    this.computeLicenseStatus(user);
                    this.computeFinancialStatus(user);
                    this.computeProfileCompletion(user);
                    this.computeMemberSince(user);
                }
                this.isLoading = false;
            });
    }

    /**
     * Fetch the latest user profile from the API so that real-time data
     * (levy balance, financial status, etc.) is always up to date when
     * navigating to the Home page.  getProfile() internally pushes the
     * refreshed user into currentUserSubject, which loadUserData() already
     * subscribes to via currentUser$, so the UI updates automatically.
     */
    private refreshUserProfile(): void {
        this.authService.getProfile().subscribe({
            error: () => {
                // Silently ignore — cached data is still displayed
            }
        });
    }

    /**
     * Load payment history summary
     */
    private loadPaymentSummary(): void {
        this.apiService.get<any>('/payments/history?page=1&limit=100').subscribe({
            next: (response: any) => {
                const payments = response.data?.payments || [];
                this.recentPaymentsCount = payments.length;

                const total = payments.reduce((sum: number, p: any) => {
                    return sum + (parseFloat(p.amount) || 0);
                }, 0);

                this.totalPaymentsAmount = `₦${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
            },
            error: () => {
                // Silently handle - payment data is supplementary
                this.recentPaymentsCount = 0;
                this.totalPaymentsAmount = '₦0.00';
            }
        });
    }

    /**
     * Compute license status from financial status and calendar dates
     * Reuses the same logic as license.component.ts
     */
    private computeLicenseStatus(user: User): void {
        const today = new Date();
        const currentYear = today.getFullYear();
        this.validYear = currentYear;

        const expiry = new Date(currentYear, 11, 31); // Dec 31
        const startOfYear = new Date(currentYear, 0, 1); // Jan 1
        const diffTime = expiry.getTime() - today.getTime();
        this.daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Calculate progress percentage through the year
        const totalDays = (expiry.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24);
        const elapsed = (today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24);
        this.licenseProgressPercent = Math.min(Math.round((elapsed / totalDays) * 100), 100);

        // Check financial status
        const status = user.current_financial_status;
        const isClear = status === null || status === '0' || status === '' || Number(status) === 0;

        if (this.daysUntilExpiry < 0) {
            this.licenseStatus = 'Expired';
            this.canViewLicense = false;
        } else if (!isClear) {
            this.licenseStatus = 'Blocked';
            this.canViewLicense = false;
        } else {
            this.licenseStatus = 'Active';
            this.canViewLicense = true;
        }
    }

    /**
     * Compute financial status display values
     */
    private computeFinancialStatus(user: User): void {
        const status = user.current_financial_status;
        const isClear = status === null || status === '0' || status === '' || Number(status) === 0;

        if (isClear) {
            this.hasOutstandingBalance = false;
            this.financialStatusLabel = 'Clear';
            this.financialStatusAmount = '₦0';
        } else {
            this.hasOutstandingBalance = true;
            const amount = parseFloat(status || '0');
            this.financialStatusLabel = 'Outstanding';
            this.financialStatusAmount = `₦${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        }
    }

    /**
     * Compute profile completion percentage based on filled fields
     */
    private computeProfileCompletion(user: User): void {
        const fields = [
            user.full_name,
            user.email,
            user.phone_number,
            user.address,
            user.membership_number,
            user.registration_date
        ];

        this.profileFieldsTotal = fields.length;
        this.profileFieldsFilled = fields.filter(f => f && f.trim() !== '').length;
        this.profileCompletionPercent = Math.round((this.profileFieldsFilled / this.profileFieldsTotal) * 100);
    }

    /**
     * Compute member since date from registration_date or created_at
     */
    private computeMemberSince(user: User): void {
        const dateStr = user.registration_date || user.created_at;
        if (dateStr) {
            const date = new Date(dateStr);
            this.memberSinceDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } else {
            this.memberSinceDate = 'N/A';
        }
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

    navigateToRenewal(): void {
        this.router.navigate(['/dashboard/payments']);
    }

    /**
     * Get the CSS class for the license status badge
     */
    getLicenseStatusClass(): string {
        switch (this.licenseStatus) {
            case 'Active': return 'bg-green-50 border-green-200 text-green-700';
            case 'Expired': return 'bg-red-50 border-red-200 text-red-700';
            case 'Blocked': return 'bg-orange-50 border-orange-200 text-orange-700';
            default: return 'bg-gray-50 border-gray-200 text-gray-700';
        }
    }

    getLicenseStatusDotClass(): string {
        switch (this.licenseStatus) {
            case 'Active': return 'bg-green-500';
            case 'Expired': return 'bg-red-500';
            case 'Blocked': return 'bg-orange-500';
            default: return 'bg-gray-500';
        }
    }
}
