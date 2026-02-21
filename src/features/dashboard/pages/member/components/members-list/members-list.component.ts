import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { AuthService } from '../../../../../../core/services/auth.service';
import { NotificationService } from '../../../../../../core/services/notification.service';
import { State } from '../../../../../../core/models/auth.model';
import { ConfirmDialogComponent } from '../../../../../../shared/components/confirm-dialog/confirm-dialog.component';

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
    imports: [CommonModule, ReactiveFormsModule, ConfirmDialogComponent],
    templateUrl: './members-list.component.html',
    styleUrls: ['./members-list.component.scss']
})
export class MembersListComponent implements OnInit, OnChanges {
    @Input() role: string = 'Member';

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

    // Filter panel
    showFilterPanel = false;
    states: State[] = [];

    // Confirm dialog
    showConfirmDialog = false;
    isDeleting = false;
    memberToDelete: Member | null = null;

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
        this.loadStates();
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
            status: [''],
            full_name: [''],
            phone_number: [''],
            membership_number: [''],
            gender: [''],
            state_of_practice: ['']
        });

        this.editForm = this.fb.group({
            full_name: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            phone_number: ['', Validators.required],
            qualification: [''],
            status: ['']
        });

        this.filterForm.get('searchTerm')?.valueChanges
            .pipe(debounceTime(400))
            .subscribe(() => {
                this.currentPage = 1;
                this.loadMembers();
            });

        this.filterForm.get('status')?.valueChanges.subscribe(() => {
            this.currentPage = 1;
            this.loadMembers();
        });
    }

    private loadStates(): void {
        this.authService.getStates().subscribe({
            next: (response) => {
                this.states = response?.data?.states || [];
            },
            error: (error) => {
                console.error('Failed to load states:', error);
            }
        });
    }

    /**
     * Load members from API
     */
    private loadMembers(): void {
        this.isLoading = true;
        this.errorMessage = '';

        const fv = this.filterForm.value;
        const params = {
            page: this.currentPage,
            limit: this.pageSize,
            role: this.role,
            search: fv.searchTerm || '',
            status: fv.status || '',
            full_name: fv.full_name || '',
            phone_number: fv.phone_number || '',
            membership_number: fv.membership_number || '',
            gender: fv.gender || '',
            state_of_practice: fv.state_of_practice || ''
        };

        this.authService.getUsers(params).subscribe({
            next: (response) => {
                console.log('Users response:', response);

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
                    this.members = response.data.map((user: any) => ({
                        id: user.id || user.membership_number || '',
                        name: user.full_name || user.name || '',
                        mobile: user.phone_number || user.mobile || '',
                        email: user.email || '',
                        membership_number: user.membership_number || '',
                        qualification: user.qualification || '',
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

    // ── Filter Panel ──────────────────────────────────────────────────────────

    get activeFilterCount(): number {
        const fv = this.filterForm.value;
        return [fv.full_name, fv.phone_number, fv.membership_number, fv.gender, fv.state_of_practice]
            .filter(v => !!v).length;
    }

    openFilter(): void {
        this.showFilterPanel = true;
    }

    closeFilter(): void {
        this.showFilterPanel = false;
    }

    applyFilter(): void {
        this.currentPage = 1;
        this.loadMembers();
        this.closeFilter();
    }

    clearFilters(): void {
        this.filterForm.patchValue({
            full_name: '',
            phone_number: '',
            membership_number: '',
            gender: '',
            state_of_practice: ''
        });
        this.currentPage = 1;
        this.loadMembers();
        this.closeFilter();
    }

    // ── Confirm Dialog ────────────────────────────────────────────────────────

    deleteMember(member: Member): void {
        this.memberToDelete = member;
        this.showConfirmDialog = true;
    }

    onDeleteConfirmed(): void {
        if (!this.memberToDelete) return;
        this.isDeleting = true;

        this.authService.deleteUser(this.memberToDelete.id).subscribe({
            next: () => {
                this.isDeleting = false;
                this.notificationService.success('Member deleted successfully');
                this.filteredMembers = this.filteredMembers.filter(m => m.id !== this.memberToDelete!.id);
                this.members = this.members.filter(m => m.id !== this.memberToDelete!.id);
                this.showConfirmDialog = false;
                this.memberToDelete = null;
            },
            error: (error) => {
                this.isDeleting = false;
                const errorMsg = error.error?.message || 'Failed to delete member';
                this.notificationService.error(errorMsg);
                this.showConfirmDialog = false;
                this.memberToDelete = null;
            }
        });
    }

    onDeleteCancelled(): void {
        this.showConfirmDialog = false;
        this.memberToDelete = null;
    }

    // ── Pagination ────────────────────────────────────────────────────────────

    get totalPages(): number {
        return Math.ceil(this.totalCount / this.pageSize);
    }

    get pageEnd(): number {
        return Math.min(this.currentPage * this.pageSize, this.totalCount);
    }

    get visiblePages(): number[] {
        const total = this.totalPages;
        const current = this.currentPage;
        const pages: number[] = [];
        const start = Math.max(1, current - 2);
        const end = Math.min(total, current + 2);
        for (let i = start; i <= end; i++) pages.push(i);
        return pages;
    }

    nextPage(): void {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.loadMembers();
        }
    }

    previousPage(): void {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.loadMembers();
        }
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
            this.currentPage = page;
            this.loadMembers();
        }
    }

    // ─────────────────────────────────────────────────────────────────────────

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

    /**
     * View member details
     */
    viewMember(member: Member): void {
        this.selectedMember = member;
        this.showViewModal = true;
    }

    closeViewModal(): void {
        this.showViewModal = false;
        this.selectedMember = null;
    }

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

    closeEditModal(): void {
        this.showEditModal = false;
        this.selectedMember = null;
        this.editForm.reset();
    }

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
}
