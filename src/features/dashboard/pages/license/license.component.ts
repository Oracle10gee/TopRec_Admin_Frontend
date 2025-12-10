import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    standalone: true,
    selector: 'app-dashboard-license',
    imports: [CommonModule],
    templateUrl: './license.component.html',
    styleUrls: ['./license.component.scss']
})
export class DashboardLicenseComponent implements OnInit {
    licenses = [
        {
            id: 'LIC-2024-001',
            status: 'Active',
            issuedDate: '2024-01-15',
            expiryDate: '2025-01-15',
            qualification: 'Professional Town Planner',
            verified: true,
            daysUntilExpiry: 30
        }
    ];

    ngOnInit(): void {
        // Load license data
    }

    downloadLicense(licenseId: string): void {
        console.log('Downloading license:', licenseId);
    }

    verifyCertificate(licenseId: string): void {
        console.log('Verifying certificate:', licenseId);
    }
}
