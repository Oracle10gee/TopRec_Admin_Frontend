import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../../../../core/services/auth.service';
import { NotificationService } from '../../../../../../core/services/notification.service';

interface Member {
    id: string;
    name: string;
    mobile: string;
    email: string;
    membership_number: string;
    qualification: string;
    status: 'Active' | 'Inactive';
    role?: string;
}

@Component({
    standalone: true,
    selector: 'app-members-list',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './members-list.component.html',
    styleUrls: ['./members-list.component.scss']
})
export class MembersListComponent implements OnInit, OnChanges {
    @Input() role: string = 'Member'; // Role filter passed from parent

    filterForm!: FormGroup;
    editForm!: FormGroup;
    members: Member[] = [];
    filteredMembers: Member[] = [];
    isLoading = false;
    errorMessage = '';

    // Modal states
    showViewModal = false;
    showEditModal = false;
    selectedMember: Member | null = null;
    isSubmitting = false;

    // Pagination
    currentPage = 1;
    pageSize = 10;
    totalCount = 0;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private notificationService: NotificationService
    ) { }

    ngOnInit(): void {
        this.initializeForm();
        this.loadMembers();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['role'] && !changes['role'].firstChange) {
            this.currentPage = 1;
            this.loadMembers();
        }
    }

    private initializeForm(): void {
        this.filterForm = this.fb.group({
            searchTerm: [''],
            status: ['']
        });

        this.editForm = this.fb.group({
            full_name: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            phone_number: ['', Validators.required],
            qualification: [''],
            status: ['']
        });

        this.filterForm.get('searchTerm')?.valueChanges.subscribe(value => {
            this.applyFilters();
        });

        this.filterForm.get('status')?.valueChanges.subscribe(value => {
            this.applyFilters();
        });
    }

    /**
     * Load members from API
     */
    private loadMembers(): void {
        this.isLoading = true;
        this.errorMessage = '';

        const params = {
            page: this.currentPage,
            limit: this.pageSize,
            role: this.role,
            search: this.filterForm.get('searchTerm')?.value || '',
            status: this.filterForm.get('status')?.value || ''
        };

        this.authService.getUsers(params).subscribe({
            next: (response) => {
                console.log('Users response:', response);

                // Map API response to Member interface
                if (response.data?.users && Array.isArray(response.data.users)) {
                    this.members = response.data.users.map((user: any) => ({
                        id: user.id || '',
                        name: user.full_name || '',
                        mobile: user.phone_number || '',
                        email: user.email || '',
                        membership_number: user.membership_number || '',
                        qualification: user.qualification || '',
                        status: user.status === 'active' ? 'Active' : 'Inactive',
                        role: user.role
                    }));
                    this.totalCount = response.data?.pagination?.total || this.members.length;
                } else if (response.data && Array.isArray(response.data)) {
                    this.members = response.users.map((user: any) => ({
                        id: user.id || user.membership_number || '',
                        name: user.full_name || user.name || '',
                        mobile: user.phone_number || user.mobile || '',
                        email: user.email || '',
                        license: user.license_status || user.license || 'Active',
                        status: user.status === 'active' || user.status === 'Active' ? 'Active' : 'Inactive',
                        role: user.role
                    }));
                    this.totalCount = response.meta?.total || this.members.length;
                }

                this.filteredMembers = [...this.members];
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading members:', error);
                this.errorMessage = error.message || 'Failed to load members. Please try again.';
                this.isLoading = false;
                // Fall back to mock data if API fails
                this.loadMockData();
            }
        });
    }

    /**
     * Load mock data as fallback
     */
    private loadMockData(): void {
        const mockMembers: Member[] = [
            {
                id: 'RTP/2528',
                name: 'Ibrahim Peters Omituntun',
                mobile: '070 1234 5678',
                email: 'ibrahimpeters@gmail.com',
                membership_number: 'RTP/2528',
                qualification: 'Associate',
                status: 'Active',
                role: 'Member'
            },
            {
                id: 'RTP/2529',
                name: 'Aisha Mohammed Bello',
                mobile: '080 2345 6789',
                email: 'aisha.mohammed@toprecng.org',
                membership_number: 'RTP/2529',
                qualification: 'Professional',
                status: 'Active',
                role: 'Member'
            },
            {
                id: 'RTP/2530',
                name: 'Chinedu Okeke Francis',
                mobile: '090 3456 7890',
                email: 'chinedu.okeke@gmail.com',
                membership_number: 'RTP/2530',
                qualification: 'Associate',
                status: 'Inactive',
                role: 'Member'
            },
            {
                id: 'RTP/2531',
                name: 'Fatima Abdullahi Yusuf',
                mobile: '070 4567 8901',
                email: 'fatima.abdullahi@toprecng.org',
                membership_number: 'RTP/2531',
                qualification: 'Graduate',
                status: 'Active',
                role: 'Member'
            }
        ];

        this.members = mockMembers.filter(m => m.role === this.role);
        this.filteredMembers = [...this.members];
        this.totalCount = this.members.length;
    }

    /**
     * Apply filters
     */
    private applyFilters(): void {
        const searchTerm = (this.filterForm.get('searchTerm')?.value || '').toLowerCase();
        const status = this.filterForm.get('status')?.value || '';

        this.filteredMembers = this.members.filter(member => {
            const matchesSearch = !searchTerm ||
                member.name.toLowerCase().includes(searchTerm) ||
                member.email.toLowerCase().includes(searchTerm) ||
                member.id.toLowerCase().includes(searchTerm) ||
                member.mobile.includes(searchTerm);

            const matchesStatus = !status || member.status === status;

            return matchesSearch && matchesStatus;
        });
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

    /**
     * View member details
     */
    viewMember(member: Member): void {
        this.selectedMember = member;
        this.showViewModal = true;
    }

    /**
     * Close view modal
     */
    closeViewModal(): void {
        this.showViewModal = false;
        this.selectedMember = null;
    }

    /**
     * Edit member
     */
    editMember(member: Member): void {
        this.selectedMember = member;
        this.editForm.patchValue({
            full_name: member.name,
            email: member.email,
            phone_number: member.mobile,
            qualification: member.qualification,
            status: member.status
        });
        this.showEditModal = true;
    }

    /**
     * Close edit modal
     */
    closeEditModal(): void {
        this.showEditModal = false;
        this.selectedMember = null;
        this.editForm.reset();
    }

    /**
     * Save edited member
     */
    saveMember(): void {
        if (!this.editForm.valid || !this.selectedMember) {
            return;
        }

        this.isSubmitting = true;
        const updates = {
            full_name: this.editForm.get('full_name')?.value,
            email: this.editForm.get('email')?.value,
            phone_number: this.editForm.get('phone_number')?.value,
            qualification: this.editForm.get('qualification')?.value
        };

        this.authService.updateUser(this.selectedMember.id, updates).subscribe({
            next: (response) => {
                this.isSubmitting = false;
                this.notificationService.success('Member updated successfully');
                this.closeEditModal();
                this.loadMembers();
            },
            error: (error) => {
                this.isSubmitting = false;
                const errorMsg = error.error?.message || 'Failed to update member';
                this.notificationService.error(errorMsg);
            }
        });
    }

    /**
     * Delete member
     */
    deleteMember(member: Member): void {
        const confirmed = confirm(`Are you sure you want to delete ${member.name}?`);
        if (!confirmed) {
            return;
        }

        this.isSubmitting = true;
        this.authService.deleteUser(member.id).subscribe({
            next: (response) => {
                this.isSubmitting = false;
                this.notificationService.success('Member deleted successfully');
                this.filteredMembers = this.filteredMembers.filter(m => m.id !== member.id);
                this.members = this.members.filter(m => m.id !== member.id);
            },
            error: (error) => {
                this.isSubmitting = false;
                const errorMsg = error.error?.message || 'Failed to delete member';
                this.notificationService.error(errorMsg);
            }
        });
    }
}