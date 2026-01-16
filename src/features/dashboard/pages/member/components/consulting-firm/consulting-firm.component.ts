import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

interface ConsultingFirm {
    id: string;
    name: string;
    contact: string;
    email: string;
    phone: string;
    address: string;
    status: 'Active' | 'Inactive';
}

@Component({
    standalone: true,
    selector: 'app-consulting-firm',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './consulting-firm.component.html',
    styleUrls: ['./consulting-firm.component.scss']
})
export class ConsultingFirmComponent implements OnInit {
    filterForm!: FormGroup;
    firms: ConsultingFirm[] = [
        {
            id: 'CF/001',
            name: 'Premium Consulting Ltd',
            contact: 'John Doe',
            email: 'contact@premiumconsulting.com',
            phone: '070 1234 5678',
            address: 'Lagos',
            status: 'Active'
        },
        {
            id: 'CF/002',
            name: 'Global Advisors Inc',
            contact: 'Jane Smith',
            email: 'info@globaladvisors.com',
            phone: '070 9876 5432',
            address: 'Abuja',
            status: 'Active'
        },
        {
            id: 'CF/003',
            name: 'Strategic Solutions',
            contact: 'Michael Johnson',
            email: 'hello@strategicsolutions.com',
            phone: '070 1212 1212',
            address: 'Port Harcourt',
            status: 'Inactive'
        },
        {
            id: 'CF/004',
            name: 'Excellence Partners Group',
            contact: 'Sarah Williams',
            email: 'info@excellencepartners.com',
            phone: '080 3344 5566',
            address: 'Kano',
            status: 'Active'
        },
        {
            id: 'CF/005',
            name: 'Visionary Consulting Hub',
            contact: 'David Brown',
            email: 'contact@visionaryhub.com',
            phone: '090 7788 9900',
            address: 'Kaduna',
            status: 'Active'
        }
    ];

    filteredFirms: ConsultingFirm[] = [];

    constructor(private fb: FormBuilder) {}

    ngOnInit(): void {
        this.filterForm = this.fb.group({
            searchTerm: ['']
        });

        this.filterForm.get('searchTerm')?.valueChanges.subscribe(value => {
            this.filterFirms(value);
        });

        this.filteredFirms = [...this.firms];
    }

    filterFirms(searchTerm: string): void {
        if (!searchTerm || !searchTerm.trim()) {
            this.filteredFirms = [...this.firms];
        } else {
            const term = searchTerm.toLowerCase();
            this.filteredFirms = this.firms.filter(firm =>
                firm.name.toLowerCase().includes(term) ||
                firm.email.toLowerCase().includes(term) ||
                firm.id.toLowerCase().includes(term) ||
                firm.phone.includes(term) ||
                firm.contact.toLowerCase().includes(term) ||
                firm.address.toLowerCase().includes(term)
            );
        }
    }

    getInitials(name: string): string {
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    addNewFirm(): void {
        console.log('Add new consulting firm');
    }

    importFirms(): void {
        console.log('Import firms');
    }

    exportFirms(): void {
        console.log('Export firms to excel');
    }

    openFilter(): void {
        console.log('Open filter dialog');
    }

    editFirm(firm: ConsultingFirm): void {
        console.log('Edit firm:', firm);
    }

    viewFirm(firm: ConsultingFirm): void {
        console.log('View firm:', firm);
    }

    deleteFirm(firm: ConsultingFirm): void {
        const confirmed = confirm(`Delete ${firm.name}?`);
        if (confirmed) {
            this.filteredFirms = this.filteredFirms.filter(f => f.id !== firm.id);
            this.firms = this.firms.filter(f => f.id !== firm.id);
        }
    }
}