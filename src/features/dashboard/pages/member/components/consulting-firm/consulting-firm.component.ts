import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { AuthService } from '../../../../../../core/services/auth.service';
import { NotificationService } from '../../../../../../core/services/notification.service';
import { State } from '../../../../../../core/models/auth.model';
import { ConfirmDialogComponent } from '../../../../../../shared/components/confirm-dialog/confirm-dialog.component';

interface ConsultingFirm {
    id: string;
    name: string;
    contact: string;
    email: string;
    phone: string;
    address: string;
    membership_number?: string;
    status: 'Active' | 'Inactive';
    role?: string;
}

@Component({
    standalone: true,
    selector: 'app-consulting-firm',
    imports: [CommonModule, ReactiveFormsModule, ConfirmDialogComponent],
    templateUrl: './consulting-firm.component.html',
    styleUrls: ['./consulting-firm.component.scss']
})
export class ConsultingFirmComponent implements OnInit, OnChanges {
    @Input() role: string = 'Consulting Firm';

    filterForm!: FormGroup;
    editForm!: FormGroup;
    firms: ConsultingFirm[] = [];
    filteredFirms: ConsultingFirm[] = [];
    isLoading = false;
    errorMessage = '';

    // Modal states
    showViewModal = false;
    showEditModal = false;
    selectedFirm: ConsultingFirm | null = null;
    isSubmitting = false;

    // Filter panel
    showFilterPanel = false;
    states: State[] = [];

    // Confirm dialog
    showConfirmDialog = false;
    isDeleting = false;
    firmToDelete: ConsultingFirm | null = null;

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
        this.loadFirms();
        this.loadStates();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['role'] && !changes['role'].firstChange) {
            this.currentPage = 1;
            this.loadFirms();
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
            address: ['', Validators.required],
            status: ['Active', Validators.required]
        });

        this.filterForm.get('searchTerm')?.valueChanges
            .pipe(debounceTime(400))
            .subscribe(() => {
                this.currentPage = 1;
                this.loadFirms();
            });

        this.filterForm.get('status')?.valueChanges.subscribe(() => {
            this.currentPage = 1;
            this.loadFirms();
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
     * Load firms from API
     */
    private loadFirms(): void {
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
                console.log('Consulting firms response:', response);

                if (response.data?.users && Array.isArray(response.data.users)) {
                    this.firms = response.data.users.map((user: any) => ({
                        id: user.id || '',
                        name: user.full_name || '',
                        contact: user.full_name || '',
                        email: user.email || '',
                        phone: user.phone_number || '',
                        address: user.address || '',
                        membership_number: user.membership_number || '',
                        status: user.status === 'active' ? 'Active' : 'Inactive',
                        role: user.role
                    }));
                    this.totalCount = response.data?.pagination?.total || this.firms.length;
                } else if (response.data && Array.isArray(response.data)) {
                    this.firms = response.data.map((user: any) => ({
                        id: user.id || user.membership_number || '',
                        name: user.full_name || user.name || '',
                        contact: user.full_name || user.name || '',
                        email: user.email || '',
                        phone: user.phone_number || user.mobile || '',
                        address: user.address || '',
                        status: user.status === 'active' || user.status === 'Active' ? 'Active' : 'Inactive',
                        role: user.role
                    }));
                    this.totalCount = response.meta?.total || this.firms.length;
                } else if (response.users && Array.isArray(response.users)) {
                    this.firms = response.users.map((user: any) => ({
                        id: user.id || user.membership_number || '',
                        name: user.full_name || user.name || '',
                        contact: user.full_name || user.name || '',
                        email: user.email || '',
                        phone: user.phone_number || user.mobile || '',
                        address: user.address || '',
                        status: user.status === 'active' || user.status === 'Active' ? 'Active' : 'Inactive',
                        role: user.role
                    }));
                    this.totalCount = response.meta?.total || this.firms.length;
                }

                this.filteredFirms = [...this.firms];
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading firms:', error);
                this.errorMessage = error.message || 'Failed to load consulting firms. Please try again.';
                this.isLoading = false;
                this.loadMockData();
            }
        });
    }

    private loadMockData(): void {
        const mockFirms: ConsultingFirm[] = [
            {
                id: 'CF/001',
                name: 'Strategic Planning Consultants',
                contact: 'Dr. Tunde Olawale',
                email: 'contact@strategicplan.com',
                phone: '070 1111 2222',
                address: 'Lagos',
                status: 'Active',
                role: 'Consulting Firm'
            },
            {
                id: 'CF/002',
                name: 'Urban Development Associates',
                contact: 'Mrs. Amara Obi',
                email: 'info@urbdev.com',
                phone: '070 3333 4444',
                address: 'Abuja',
                status: 'Active',
                role: 'Consulting Firm'
            },
            {
                id: 'CF/003',
                name: 'City Planning Solutions',
                contact: 'Engr. Charles Ekpenyong',
                email: 'hello@cityplan.com',
                phone: '070 5555 6666',
                address: 'Calabar',
                status: 'Active',
                role: 'Consulting Firm'
            }
        ];

        this.firms = mockFirms;
        this.filteredFirms = [...this.firms];
        this.totalCount = this.firms.length;
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
        this.loadFirms();
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
        this.loadFirms();
        this.closeFilter();
    }

    // ── Confirm Dialog ────────────────────────────────────────────────────────

    deleteFirm(firm: ConsultingFirm): void {
        this.firmToDelete = firm;
        this.showConfirmDialog = true;
    }

    onDeleteConfirmed(): void {
        if (!this.firmToDelete) return;
        this.isDeleting = true;

        this.authService.deleteUser(this.firmToDelete.id).subscribe({
            next: () => {
                this.isDeleting = false;
                this.notificationService.success(`${this.firmToDelete!.name} deleted successfully`);
                this.filteredFirms = this.filteredFirms.filter(f => f.id !== this.firmToDelete!.id);
                this.firms = this.firms.filter(f => f.id !== this.firmToDelete!.id);
                this.showConfirmDialog = false;
                this.firmToDelete = null;
            },
            error: (error) => {
                this.isDeleting = false;
                console.error('Error deleting firm:', error);
                this.notificationService.error('Failed to delete firm. Please try again.');
                this.showConfirmDialog = false;
                this.firmToDelete = null;
            }
        });
    }

    onDeleteCancelled(): void {
        this.showConfirmDialog = false;
        this.firmToDelete = null;
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
            this.loadFirms();
        }
    }

    previousPage(): void {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.loadFirms();
        }
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
            this.currentPage = page;
            this.loadFirms();
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

    addNewFirm(): void {
        console.log('Add new consulting firm');
    }

    importFirms(): void {
        console.log('Import firms');
    }

    exportFirms(): void {
        console.log('Export firms to excel');
    }

    editFirm(firm: ConsultingFirm): void {
        this.selectedFirm = firm;
        this.editForm.patchValue({
            full_name: firm.name,
            email: firm.email,
            phone_number: firm.phone,
            address: firm.address,
            status: firm.status
        });
        this.showEditModal = true;
    }

    viewFirm(firm: ConsultingFirm): void {
        this.selectedFirm = firm;
        this.showViewModal = true;
    }

    saveFirm(): void {
        if (this.editForm.invalid || !this.selectedFirm) return;

        this.isSubmitting = true;
        const payload = {
            full_name: this.editForm.value.full_name,
            email: this.editForm.value.email,
            phone_number: this.editForm.value.phone_number,
            address: this.editForm.value.address
        };

        this.authService.updateUser(this.selectedFirm.id, payload).subscribe({
            next: (response) => {
                const index = this.firms.findIndex(f => f.id === this.selectedFirm!.id);
                if (index !== -1) {
                    this.firms[index] = {
                        ...this.firms[index],
                        name: payload.full_name,
                        email: payload.email,
                        phone: payload.phone_number,
                        address: payload.address
                    };
                }
                this.filteredFirms = [...this.firms];
                this.closeEditModal();
                this.isSubmitting = false;
                this.notificationService.success('Firm updated successfully');
            },
            error: (error) => {
                console.error('Error updating firm:', error);
                this.notificationService.error(error.error?.message || 'Failed to update firm. Please try again.');
                this.isSubmitting = false;
            }
        });
    }

    closeViewModal(): void {
        this.showViewModal = false;
        this.selectedFirm = null;
    }

    closeEditModal(): void {
        this.showEditModal = false;
        this.selectedFirm = null;
        this.editForm.reset();
    }
}
