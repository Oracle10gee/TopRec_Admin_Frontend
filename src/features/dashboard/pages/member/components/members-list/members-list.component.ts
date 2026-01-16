import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

interface Member {
    id: string;
    name: string;
    mobile: string;
    email: string;
    license: string;
    status: 'Active' | 'Inactive';
}

@Component({
    standalone: true,
    selector: 'app-members-list',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './members-list.component.html',
    styleUrls: ['./members-list.component.scss']
})
export class MembersListComponent implements OnInit {
    filterForm!: FormGroup;
    members: Member[] = [
        {
            id: 'RTP/2528',
            name: 'Ibrahim Peters Omituntun',
            mobile: '070 1234 5678',
            email: 'ibrahimpeters@gmail.com',
            license: 'Active',
            status: 'Active'
        },
        {
            id: 'RTP/2529',
            name: 'Aisha Mohammed Bello',
            mobile: '080 2345 6789',
            email: 'aisha.mohammed@toprecng.org',
            license: 'Active',
            status: 'Active'
        },
        {
            id: 'RTP/2530',
            name: 'Chinedu Okeke Francis',
            mobile: '090 3456 7890',
            email: 'chinedu.okeke@gmail.com',
            license: 'Expired',
            status: 'Inactive'
        },
        {
            id: 'RTP/2531',
            name: 'Fatima Abdullahi Yusuf',
            mobile: '070 4567 8901',
            email: 'fatima.abdullahi@toprecng.org',
            license: 'Active',
            status: 'Active'
        },
        {
            id: 'RTP/2532',
            name: 'Oluwaseun Adeyemi Johnson',
            mobile: '080 5678 9012',
            email: 'oluwaseun.adeyemi@gmail.com',
            license: 'Active',
            status: 'Active'
        },
        {
            id: 'RTP/2533',
            name: 'Blessing Chioma Nwankwo',
            mobile: '090 6789 0123',
            email: 'blessing.nwankwo@toprecng.org',
            license: 'Pending',
            status: 'Inactive'
        },
        {
            id: 'RTP/2534',
            name: 'Abdulrahman Suleiman Baba',
            mobile: '070 7890 1234',
            email: 'abdulrahman.suleiman@gmail.com',
            license: 'Active',
            status: 'Active'
        },
        {
            id: 'RTP/2535',
            name: 'Ngozi Patience Okafor',
            mobile: '080 8901 2345',
            email: 'ngozi.okafor@toprecng.org',
            license: 'Active',
            status: 'Active'
        }
    ];

    filteredMembers: Member[] = [];

    constructor(private fb: FormBuilder) {}

    ngOnInit(): void {
        this.filterForm = this.fb.group({
            searchTerm: ['']
        });

        this.filterForm.get('searchTerm')?.valueChanges.subscribe(value => {
            this.filterMembers(value);
        });

        this.filteredMembers = [...this.members];
    }

    filterMembers(searchTerm: string): void {
        if (!searchTerm || !searchTerm.trim()) {
            this.filteredMembers = [...this.members];
        } else {
            const term = searchTerm.toLowerCase();
            this.filteredMembers = this.members.filter(member =>
                member.name.toLowerCase().includes(term) ||
                member.email.toLowerCase().includes(term) ||
                member.id.toLowerCase().includes(term) ||
                member.mobile.includes(term)
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

    addNewMember(): void {
        console.log('Add new member');
    }

    importMembers(): void {
        console.log('Import members');
    }

    exportMembers(): void {
        console.log('Export members to excel');
    }

    openFilter(): void {
        console.log('Open filter dialog');
    }

    editMember(member: Member): void {
        console.log('Edit member:', member);
    }

    viewMember(member: Member): void {
        console.log('View member:', member);
    }

    deleteMember(member: Member): void {
        const confirmed = confirm(`Delete ${member.name}?`);
        if (confirmed) {
            this.filteredMembers = this.filteredMembers.filter(m => m.id !== member.id);
            this.members = this.members.filter(m => m.id !== member.id);
        }
    }
}