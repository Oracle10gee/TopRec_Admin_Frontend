import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

interface User {
    id: string;
    name: string;
    email: string;
    mobile: string;
    role: 'Admin' | 'Manager' | 'User';
    status: 'Active' | 'Inactive';
    lastLogin?: string;
}

@Component({
    standalone: true,
    selector: 'app-users-settings',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './users-settings.component.html',
    styleUrls: ['./users-settings.component.scss']
})
export class UsersSettingsComponent implements OnInit {
    users: User[] = [];
    filteredUsers: User[] = [];
    filterForm!: FormGroup;

    // Modal states
    showUserModal = false;
    showDeleteConfirm = false;
    isEditing = false;
    selectedUser: User | null = null;

    userForm!: FormGroup;
    errorMessage = '';
    successMessage = '';
    isSaving = false;
    isLoading = false;

    constructor(private fb: FormBuilder) { }

    ngOnInit(): void {
        this.initializeForms();
        this.loadUsers();
    }

    private initializeForms(): void {
        this.filterForm = this.fb.group({
            searchTerm: [''],
            status: [''],
            role: ['']
        });

        this.userForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3)]],
            email: ['', [Validators.required, Validators.email]],
            mobile: ['', [Validators.required]],
            role: ['User', [Validators.required]],
            status: ['Active', [Validators.required]]
        });

        // Subscribe to filter changes
        this.filterForm.valueChanges.subscribe(() => {
            this.applyFilters();
        });
    }

    /**
     * Load users data
     */
    private loadUsers(): void {
        this.isLoading = true;

        // Mock data - Replace with actual API call
        setTimeout(() => {
            this.users = [
                {
                    id: 'USR/001',
                    name: 'Kunle Okafor',
                    email: 'kunle.okafor@toprec.com',
                    mobile: '070 1234 5678',
                    role: 'Admin',
                    status: 'Active',
                    lastLogin: '2 hours ago'
                },
                {
                    id: 'USR/002',
                    name: 'Aisha Mohammed',
                    email: 'aisha.mohammed@toprec.com',
                    mobile: '080 2345 6789',
                    role: 'Manager',
                    status: 'Active',
                    lastLogin: '1 day ago'
                },
                {
                    id: 'USR/003',
                    name: 'Chinedu Okeke',
                    email: 'chinedu.okeke@toprec.com',
                    mobile: '090 3456 7890',
                    role: 'User',
                    status: 'Active',
                    lastLogin: '3 days ago'
                },
                {
                    id: 'USR/004',
                    name: 'Fatima Yusuf',
                    email: 'fatima.yusuf@toprec.com',
                    mobile: '070 4567 8901',
                    role: 'Manager',
                    status: 'Inactive',
                    lastLogin: '2 weeks ago'
                }
            ];

            this.filteredUsers = [...this.users];
            this.isLoading = false;
        }, 500);
    }

    /**
     * Apply filters
     */
    private applyFilters(): void {
        const { searchTerm, status, role } = this.filterForm.value;

        this.filteredUsers = this.users.filter(user => {
            const matchesSearch = !searchTerm ||
                user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.mobile.includes(searchTerm);

            const matchesStatus = !status || user.status === status;
            const matchesRole = !role || user.role === role;

            return matchesSearch && matchesStatus && matchesRole;
        });
    }

    /**
     * Open create user modal
     */
    openCreateUserModal(): void {
        this.isEditing = false;
        this.selectedUser = null;
        this.userForm.reset({
            role: 'User',
            status: 'Active'
        });
        this.errorMessage = '';
        this.successMessage = '';
        this.showUserModal = true;
    }

    /**
     * Open edit user modal
     */
    openEditUserModal(user: User): void {
        this.isEditing = true;
        this.selectedUser = user;
        this.userForm.patchValue({
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            role: user.role,
            status: user.status
        });
        this.errorMessage = '';
        this.successMessage = '';
        this.showUserModal = true;
    }

    /**
     * Close user modal
     */
    closeUserModal(): void {
        this.showUserModal = false;
        this.userForm.reset();
    }

    /**
     * Save user (create or update)
     */
    saveUser(): void {
        if (!this.userForm.valid) {
            this.errorMessage = 'Please fill all required fields correctly.';
            return;
        }

        this.isSaving = true;
        this.errorMessage = '';
        this.successMessage = '';

        // Simulate API call
        setTimeout(() => {
            try {
                if (this.isEditing && this.selectedUser) {
                    // Update existing user
                    const index = this.users.findIndex(u => u.id === this.selectedUser!.id);
                    if (index !== -1) {
                        this.users[index] = {
                            ...this.users[index],
                            ...this.userForm.value
                        };
                        this.successMessage = 'User updated successfully!';
                    }
                } else {
                    // Create new user
                    const newUser: User = {
                        id: `USR/${String(this.users.length + 1).padStart(3, '0')}`,
                        ...this.userForm.value,
                        lastLogin: 'Just now'
                    };
                    this.users.push(newUser);
                    this.successMessage = 'User created successfully!';
                }

                // Refresh filtered list
                this.applyFilters();

                // Close modal after 2 seconds
                setTimeout(() => {
                    this.closeUserModal();
                }, 2000);
            } catch (error) {
                this.errorMessage = 'Failed to save user. Please try again.';
            } finally {
                this.isSaving = false;
            }
        }, 1000);
    }

    /**
     * Open delete confirmation
     */
    openDeleteConfirm(user: User): void {
        this.selectedUser = user;
        this.showDeleteConfirm = true;
    }

    /**
     * Delete user
     */
    deleteUser(): void {
        if (!this.selectedUser) return;

        this.isSaving = true;

        // Simulate API call
        setTimeout(() => {
            try {
                this.users = this.users.filter(u => u.id !== this.selectedUser!.id);
                this.applyFilters();
                this.showDeleteConfirm = false;
                this.successMessage = 'User deleted successfully!';
                this.selectedUser = null;
            } catch (error) {
                this.errorMessage = 'Failed to delete user. Please try again.';
            } finally {
                this.isSaving = false;
            }
        }, 1000);
    }

    /**
     * Close delete confirmation
     */
    closeDeleteConfirm(): void {
        this.showDeleteConfirm = false;
        this.selectedUser = null;
    }

    /**
     * Get role badge color
     */
    getRoleBadgeColor(role: string): string {
        switch (role) {
            case 'Admin':
                return 'bg-red-100 text-red-700';
            case 'Manager':
                return 'bg-blue-100 text-blue-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    }

    /**
     * Get status badge color
     */
    getStatusBadgeColor(status: string): string {
        return status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700';
    }
}
