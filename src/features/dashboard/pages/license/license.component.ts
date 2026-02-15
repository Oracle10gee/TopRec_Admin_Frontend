import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { User } from '../../../../core/models/auth.model';

@Component({
    standalone: true,
    selector: 'app-dashboard-license',
    imports: [CommonModule],
    templateUrl: './license.component.html',
    styleUrls: ['./license.component.scss']
})
export class DashboardLicenseComponent implements OnInit, OnDestroy {
    user: User | null = null;
    licenseStatus: 'Active' | 'Expired' = 'Active';
    issuedDate: string = '';
    expiryDate: string = '';
    daysUntilExpiry: number = 0;
    validYear: number = new Date().getFullYear();
    canViewLicense: boolean = false;
    financialBlockMessage: string = '';
    isLoading: boolean = true;

    private destroy$ = new Subject<void>();

    constructor(
        private router: Router,
        private authService: AuthService,
        private notificationService: NotificationService
    ) {}

    ngOnInit(): void {
        this.loadUserData();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private loadUserData(): void {
        this.authService.currentUser$
            .pipe(takeUntil(this.destroy$))
            .subscribe(user => {
                this.user = user;
                if (user) {
                    this.checkFinancialStatus(user);
                    this.calculateLicenseDates();
                }
                this.isLoading = false;
            });
    }

    /**
     * Check the user's current_financial_status.
     * If 0 or null => no outstanding levy => allow license view/download.
     * If any actual figure => user is owing => block license view/download.
     */
    private checkFinancialStatus(user: User): void {
        const status = user.current_financial_status;

        if (status === null || status === '0' || status === '' || Number(status) === 0) {
            this.canViewLicense = true;
            this.financialBlockMessage = '';
        } else {
            this.canViewLicense = false;
            this.financialBlockMessage =
                'You have an outstanding levy balance. Please settle your license fees before you can view or download your license.';
            this.notificationService.error(this.financialBlockMessage, 7000);
        }
    }

    /**
     * License expiry logic:
     * - Renewals run on a 12-month calendar period (Jan 1 - Dec 31).
     * - A license always expires on December 31st of every year.
     * - Issued date is January 1st of the current year (or the user's registration date).
     */
    private calculateLicenseDates(): void {
        const today = new Date();
        const currentYear = today.getFullYear();

        // License is always valid from Jan 1 to Dec 31 of the current year
        this.issuedDate = `${currentYear}-01-01`;
        this.expiryDate = `${currentYear}-12-31`;
        this.validYear = currentYear;

        const expiry = new Date(currentYear, 11, 31); // Dec 31
        const diffTime = expiry.getTime() - today.getTime();
        this.daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (this.daysUntilExpiry < 0) {
            this.licenseStatus = 'Expired';
        } else {
            this.licenseStatus = 'Active';
        }
    }

    /**
     * Download license as PDF (print-based)
     */
    downloadLicense(): void {
        if (!this.canViewLicense) {
            this.notificationService.error(
                'You have an outstanding levy balance. Please settle your license fees before downloading your license.'
            );
            return;
        }
        this.printLicense();
    }

    /**
     * Print the license certificate
     */
    printLicense(): void {
        if (!this.canViewLicense) {
            this.notificationService.error(
                'You have an outstanding levy balance. Please settle your license fees before printing your license.'
            );
            return;
        }
        window.print();
    }

    /**
     * Navigate to renewal/payment page
     */
    navigateToRenewal(): void {
        this.router.navigate(['/dashboard/payments']);
    }
}
