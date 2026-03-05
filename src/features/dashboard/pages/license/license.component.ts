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
    certificateDescription: string = '';
    certificateBodyText: string = '';
    displayName: string = '';

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
                    this.setCertificateDescription(user);
                    this.setCertificateBodyText(user);
                    this.displayName = this.normalizeName(user.full_name || '');
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
     * Set the certificate description text based on user role.
     */
    private setCertificateDescription(user: User): void {
        switch (user.role) {
            case 'Consulting Firm':
                this.certificateDescription = 'has been duly registered and licensed as a Consulting Firm';
                break;
            case 'Practice Firm':
                this.certificateDescription = 'has been duly registered and licensed as a Practice Firm';
                break;
            default:
                this.certificateDescription = 'has been duly registered and licensed as a Town Planner';
                break;
        }
    }

    /**
     * Set the certificate body text based on user role.
     * - Member: SECTION 5(1) provisions, practice as REGISTERED TOWN PLANNER
     * - Consulting Firm: Schedule 1 provisions (EIS, Master Plan, etc.)
     * - Practice Firm: Schedule 1 provisions (Site Analysis, Layouts < 10 Hectares, etc.)
     */
    private setCertificateBodyText(user: User): void {
        switch (user.role) {
            case 'Consulting Firm':
                this.certificateBodyText =
                    'Having complied with the provisions of schedule 1 Rules and Regulation for the Control Town Planning Practice are expected to carry out, Environmental Impact Statement, Master Plan, Structure Plans, Special Area Plans, Campus Plans, Subset Plans including Layouts/Subdivision of more than 10 Hectares.';
                break;
            case 'Practice Firm':
                this.certificateBodyText =
                    'Having complied with the provisions of schedule 1 Rules and Regulation for the Control Town Planning Practice are expected to carry out, Site Analysis Report and Plan, Layouts/subdivision of less than 10 Hectares, Processing of Physical Planning development permit, Planning report on Advisory and advocacy.';
                break;
            default:
                this.certificateBodyText =
                    'Having complied with the provisions of SECTION (5) (1) Town Planners (Registration, etc.) Act, CAP T7 LFN 2004, and Section (5) (b) Rules and Regulation for the Control Town Planning Practice, is hereby authorized to practice as a REGISTERED TOWN PLANNER within the Federal Republic of Nigeria.';
                break;
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
     * Convert a string to title case (first letter uppercase, rest lowercase per word).
     * e.g. "KABIRU PETERS" → "Kabiru Peters"
     */
    private toTitleCase(str: string): string {
        return str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
    }

    /**
     * Convert name to title case then fix special prefixes.
     * "TPL" must always remain fully capitalised regardless of the source casing.
     * e.g. "TPL KABIRU PETERS" → "TPL Kabiru Peters"
     *      "tpl kabiru peters" → "TPL Kabiru Peters"
     */
    private normalizeName(name: string): string {
        const titleCased = this.toTitleCase(name);
        // Replace "Tpl" (produced by toTitleCase) back to "TPL" wherever it appears
        return titleCased.replace(/\bTpl\b/g, 'TPL');
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
