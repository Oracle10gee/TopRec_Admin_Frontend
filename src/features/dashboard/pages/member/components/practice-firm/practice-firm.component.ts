import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../../../../core/services/auth.service';
import { NotificationService } from '../../../../../../core/services/notification.service';

interface PracticeFirm {
    id: string;
    name: string;
    principal: string;
    email: string;
    phone: string;
    location: string;
    membership_number?: string;
    status: 'Active' | 'Inactive';
    role?: string;
}

@Component({
    standalone: true,
    selector: 'app-practice-firm',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './practice-firm.component.html',
    styleUrls: ['./practice-firm.component.scss']
})
export class PracticeFirmComponent implements OnInit, OnChanges {
    @Input() role: string = 'Practice Firm';

    filterForm!: FormGroup;
    editForm!: FormGroup;
    firms: PracticeFirm[] = [];
    filteredFirms: PracticeFirm[] = [];

    // Modal states
    showViewModal = false;
    showEditModal = false;
    selectedFirm: PracticeFirm | null = null;
    isSubmitting = false;
    isLoading = false;
    errorMessage = '';

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
            status: ['']
        });

        this.filterForm.get('searchTerm')?.valueChanges.subscribe(value => {
            this.applyFilters();
        });

        this.filterForm.get('status')?.valueChanges.subscribe(value => {
            this.applyFilters();
        });

        // Initialize edit form
        this.editForm = this.fb.group({
            full_name: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            phone_number: ['', Validators.required],
            address: ['', Validators.required],
            status: ['Active', Validators.required]
        });
    }

    /**
     * Load firms from API
     */
    private loadFirms(): void {
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
                console.log('Practice firms response:', response);

                // Map API response to PracticeFirm interface
                if (response.data?.users && Array.isArray(response.data.users)) {
                    this.firms = response.data.users.map((user: any) => ({
                        id: user.id || '',
                        name: user.full_name || '',
                        principal: user.full_name || '',
                        email: user.email || '',
                        phone: user.phone_number || '',
                        location: user.address || '',
                        membership_number: user.membership_number || '',
                        status: user.status === 'active' ? 'Active' : 'Inactive',
                        role: user.role
                    }));
                    this.totalCount = response.data?.pagination?.total || this.firms.length;
                } else if (response.data && Array.isArray(response.data)) {
                    this.firms = response.data.map((user: any) => ({
                        id: user.id || user.membership_number || '',
                        name: user.full_name || user.name || '',
                        principal: user.full_name || user.name || '',
                        email: user.email || '',
                        phone: user.phone_number || user.mobile || '',
                        location: user.address || '',
                        status: user.status === 'active' || user.status === 'Active' ? 'Active' : 'Inactive',
                        role: user.role
                    }));
                    this.totalCount = response.meta?.total || this.firms.length;
                } else if (response.users && Array.isArray(response.users)) {
                    this.firms = response.users.map((user: any) => ({
                        id: user.id || user.membership_number || '',
                        name: user.full_name || user.name || '',
                        principal: user.full_name || user.name || '',
                        email: user.email || '',
                        phone: user.phone_number || user.mobile || '',
                        location: user.address || '',
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
                this.errorMessage = error.message || 'Failed to load practice firms. Please try again.';
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
        const mockFirms: PracticeFirm[] = [
            {
                id: 'PF/001',
                name: 'Urban Planning Associates',
                principal: 'Prof. Adebayo Oluwaseun',
                email: 'info@urbanplanners.com',
                phone: '070 1234 5678',
                location: 'Lagos',
                status: 'Active',
                role: 'Practice Firm'
            },
            {
                id: 'PF/002',
                name: 'Design & Development Ltd',
                principal: 'Arch. Chioma Okafor',
                email: 'contact@designdev.com',
                phone: '070 8765 4321',
                location: 'Abuja',
                status: 'Active',
                role: 'Practice Firm'
            },
            {
                id: 'PF/003',
                name: 'Sustainable Cities Consultancy',
                principal: 'Engr. Mohammed Hassan',
                email: 'contact@sustainable.com',
                phone: '070 5555 6666',
                location: 'Kano',
                status: 'Active',
                role: 'Practice Firm'
            }
        ];

        this.firms = mockFirms;
        this.filteredFirms = [...this.firms];
        this.totalCount = this.firms.length;
    }

    /**
     * Apply filters
     */
    private applyFilters(): void {
        const searchTerm = (this.filterForm.get('searchTerm')?.value || '').toLowerCase();
        const status = this.filterForm.get('status')?.value || '';

        this.filteredFirms = this.firms.filter(firm => {
            const matchesSearch = !searchTerm ||
                firm.name.toLowerCase().includes(searchTerm) ||
                firm.email.toLowerCase().includes(searchTerm) ||
                firm.id.toLowerCase().includes(searchTerm) ||
                firm.phone.includes(searchTerm) ||
                firm.principal.toLowerCase().includes(searchTerm) ||
                firm.location.toLowerCase().includes(searchTerm);

            const matchesStatus = !status || firm.status === status;

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
        this.selectedFirm = firm;
        this.editForm.patchValue({
            full_name: firm.name,
            email: firm.email,
            phone_number: firm.phone,
            address: firm.location,
            status: firm.status
        });
        this.showEditModal = true;
    }

    viewFirm(firm: PracticeFirm): void {
        this.selectedFirm = firm;
        this.showViewModal = true;
    }

    deleteFirm(firm: PracticeFirm): void {
        if (confirm(`Are you sure you want to delete ${firm.name}?`)) {
            this.authService.deleteUser(firm.id).subscribe({
                next: () => {
                    this.filteredFirms = this.filteredFirms.filter(f => f.id !== firm.id);
                    this.firms = this.firms.filter(f => f.id !== firm.id);
                    this.notificationService.success(`${firm.name} deleted successfully`);
                },
                error: (error) => {
                    console.error('Error deleting firm:', error);
                    this.notificationService.error('Failed to delete firm. Please try again.');
                }
            });
        }
    }

    /**
     * Save edited firm
     */
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
                // Update the firm in the lists
                const index = this.firms.findIndex(f => f.id === this.selectedFirm!.id);
                if (index !== -1) {
                    this.firms[index] = {
                        ...this.firms[index],
                        name: payload.full_name,
                        email: payload.email,
                        phone: payload.phone_number,
                        location: payload.address
                    };
                }
                this.applyFilters();
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