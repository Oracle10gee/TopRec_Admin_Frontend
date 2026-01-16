import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

interface PracticeFirm {
    id: string;
    name: string;
    principal: string;
    email: string;
    phone: string;
    location: string;
    status: 'Active' | 'Inactive';
}

@Component({
    standalone: true,
    selector: 'app-practice-firm',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './practice-firm.component.html',
    styleUrls: ['./practice-firm.component.scss']
})
export class PracticeFirmComponent implements OnInit {
    filterForm!: FormGroup;
    firms: PracticeFirm[] = [
        {
            id: 'PF/001',
            name: 'Urban Planning Associates',
            principal: 'Prof. Adebayo Oluwaseun',
            email: 'info@urbanplanners.com',
            phone: '070 1234 5678',
            location: 'Lagos',
            status: 'Active'
        },
        {
            id: 'PF/002',
            name: 'Design & Development Ltd',
            principal: 'Arch. Chioma Okafor',
            email: 'contact@designdev.com',
            phone: '070 8765 4321',
            location: 'Abuja',
            status: 'Active'
        },
        {
            id: 'PF/003',
            name: 'Heritage Planning Solutions',
            principal: 'Dr. Kayode Adeyemi',
            email: 'admin@heritageplan.com',
            phone: '070 1122 3344',
            location: 'Ibadan',
            status: 'Inactive'
        },
        {
            id: 'PF/004',
            name: 'Metropolitan Planners Inc',
            principal: 'Engr. Fatima Hassan',
            email: 'info@metroplanners.com',
            phone: '080 5566 7788',
            location: 'Port Harcourt',
            status: 'Active'
        },
        {
            id: 'PF/005',
            name: 'Eco-Urban Consultants',
            principal: 'Dr. Chukwudi Nwosu',
            email: 'contact@ecourban.com',
            phone: '090 9988 7766',
            location: 'Enugu',
            status: 'Active'
        }
    ];

    filteredFirms: PracticeFirm[] = [];

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
                firm.principal.toLowerCase().includes(term) ||
                firm.location.toLowerCase().includes(term)
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
        console.log('Add new practice firm');
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

    editFirm(firm: PracticeFirm): void {
        console.log('Edit firm:', firm);
    }

    viewFirm(firm: PracticeFirm): void {
        console.log('View firm:', firm);
    }

    deleteFirm(firm: PracticeFirm): void {
        const confirmed = confirm(`Delete ${firm.name}?`);
        if (confirmed) {
            this.filteredFirms = this.filteredFirms.filter(f => f.id !== firm.id);
            this.firms = this.firms.filter(f => f.id !== firm.id);
        }
    }
}