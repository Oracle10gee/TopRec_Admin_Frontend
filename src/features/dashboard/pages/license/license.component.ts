import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface License {
    id: string;
    status: 'Active' | 'Expired' | 'Pending' | 'Suspended';
    issuedDate: string;
    expiryDate: string;
    qualification: string;
    verified: boolean;
    daysUntilExpiry: number;
    holderName?: string;
}

interface CertificateData {
    holderName: string;
    validTill: string;
    registrarName: string;
    registrarTitle: string;
    licenseId: string;
}

@Component({
    standalone: true,
    selector: 'app-dashboard-license',
    imports: [CommonModule],
    templateUrl: './license.component.html',
    styleUrls: ['./license.component.scss']
})
export class DashboardLicenseComponent implements OnInit {
    licenses: License[] = [
        {
            id: 'RTP/2024/001',
            status: 'Active',
            issuedDate: '2024-01-15',
            expiryDate: '2027-12-31',
            qualification: 'Professional Town Planner',
            verified: true,
            daysUntilExpiry: 30,
            holderName: 'Kabiru Peters'
        }
    ];

    // Certificate modal properties
    showCertificateModal = false;
    certificateData: CertificateData = {
        holderName: '',
        validTill: '',
        registrarName: 'Tpl. Uhiere Samuel',
        registrarTitle: 'Ag. Registrar',
        licenseId: ''
    };

    constructor(private router: Router) {}

    ngOnInit(): void {
        this.loadLicenseData();
        this.calculateDaysUntilExpiry();
    }

    /**
     * Load license data from API
     */
    private loadLicenseData(): void {
        // TODO: Implement API call to fetch licenses
        console.log('Loading license data...');
        
        // Mock data is already in the licenses array
        // In production, this would be an API call
    }

    /**
     * Calculate days until expiry for each license
     */
    private calculateDaysUntilExpiry(): void {
        const today = new Date();
        
        this.licenses = this.licenses.map(license => {
            const expiryDate = new Date(license.expiryDate);
            const diffTime = expiryDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            return {
                ...license,
                daysUntilExpiry: diffDays
            };
        });
    }

    /**
     * Get count of active licenses
     */
    getActiveLicensesCount(): number {
        return this.licenses.filter(l => l.status === 'Active').length;
    }

    /**
     * Get status badge CSS class
     */
    getStatusClass(status: string): string {
        const classes = {
            'Active': 'bg-green-100 text-green-800 border border-green-200',
            'Expired': 'bg-red-100 text-red-800 border border-red-200',
            'Pending': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
            'Suspended': 'bg-gray-100 text-gray-800 border border-gray-200'
        };
        return classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-800';
    }

    /**
     * Get status dot CSS class
     */
    getStatusDotClass(status: string): string {
        const classes = {
            'Active': 'bg-green-500',
            'Expired': 'bg-red-500',
            'Pending': 'bg-yellow-500',
            'Suspended': 'bg-gray-500'
        };
        return classes[status as keyof typeof classes] || 'bg-gray-500';
    }

    /**
     * View certificate in modal
     */
    viewCertificate(license: License): void {
        const expiryDate = new Date(license.expiryDate);
        const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

        this.certificateData = {
            holderName: license.holderName || 'Registered Member',
            validTill: `${monthNames[expiryDate.getMonth()]}, ${expiryDate.getFullYear()}`,
            registrarName: 'Tpl. Uhiere Samuel',
            registrarTitle: 'Ag. Registrar',
            licenseId: license.id
        };

        this.showCertificateModal = true;
    }

    /**
     * Close certificate modal
     */
    closeCertificateModal(): void {
        this.showCertificateModal = false;
    }

    /**
     * Print certificate
     */
    printCertificate(event: Event): void {
        event.stopPropagation();
        window.print();
    }

    /**
     * Download license certificate as PDF
     */
    downloadLicense(licenseId: string): void {
        console.log('Downloading license:', licenseId);

        // TODO: Implement actual download logic
        // This would typically call an API endpoint that generates a PDF

        // Simulate download
        alert(`Downloading license ${licenseId}. This feature will be implemented soon.`);

        // In production, you might do something like:
        // this.licenseService.downloadLicense(licenseId).subscribe(blob => {
        //   const url = window.URL.createObjectURL(blob);
        //   const link = document.createElement('a');
        //   link.href = url;
        //   link.download = `license-${licenseId}.pdf`;
        //   link.click();
        // });
    }

    /**
     * Verify certificate authenticity
     */
    verifyCertificate(licenseId: string): void {
        console.log('Verifying certificate:', licenseId);
        alert(`Certificate verification for ${licenseId}. Feature coming soon!`);
    }

    /**
     * Share license via email or social media
     */
    shareLicense(licenseId: string): void {
        console.log('Sharing license:', licenseId);
        
        // TODO: Implement share functionality
        // Could use Web Share API or show a modal with share options
        
        if (navigator.share) {
            navigator.share({
                title: 'My Professional License',
                text: 'Check out my TOPREC professional license',
                url: `https://toprecng.org/verify/${licenseId}`
            }).then(() => {
                console.log('License shared successfully');
            }).catch((error) => {
                console.log('Error sharing:', error);
            });
        } else {
            // Fallback for browsers that don't support Web Share API
            alert('Share options:\n\n- Copy verification link\n- Share via email\n- Share on LinkedIn\n\nFeature coming soon!');
        }
    }

    /**
     * Print license certificate
     */
    printLicense(licenseId: string): void {
        console.log('Printing license:', licenseId);

        // TODO: Implement print functionality
        // This would open a print-friendly version of the license

        alert(`Opening print dialog for license ${licenseId}. Feature coming soon!`);

        // In production:
        // window.print();
        // Or navigate to a print-friendly page
    }

    /**
     * Navigate to renewal/payment page
     */
    navigateToRenewal(): void {
        this.router.navigate(['/dashboard/payments']);
    }

    /**
     * Check if license is expiring soon (within 60 days)
     */
    isExpiringSoon(license: License): boolean {
        return license.daysUntilExpiry <= 60 && license.daysUntilExpiry > 0;
    }

    /**
     * Check if license is expired
     */
    isExpired(license: License): boolean {
        return license.daysUntilExpiry < 0;
    }

    /**
     * Get expiry warning level
     */
    getExpiryWarningLevel(license: License): 'safe' | 'warning' | 'danger' {
        if (license.daysUntilExpiry > 90) return 'safe';
        if (license.daysUntilExpiry > 30) return 'warning';
        return 'danger';
    }
}