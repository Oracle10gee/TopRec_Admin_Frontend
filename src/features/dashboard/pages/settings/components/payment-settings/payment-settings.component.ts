import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../../../core/services/auth.service';
import { NotificationService } from '../../../../../../core/services/notification.service';

interface PaymentType {
    id?: string;
    code: string;
    name: string;
    base_amount: number;
    description: string;
    tax_rate: number;
    currency: string;
    service_id?: string;
}

interface ServiceType {
    id: string;
    service_id: string;
    service_type: string;
    description: string;
    is_active: boolean;
}

@Component({
    standalone: true,
    selector: 'app-payment-settings',
    imports: [CommonModule, ReactiveFormsModule, FormsModule],
    templateUrl: './payment-settings.component.html',
    styleUrls: ['./payment-settings.component.scss']
})
export class PaymentSettingsComponent implements OnInit {
    paymentTypes: PaymentType[] = [];
    serviceTypes: ServiceType[] = [];
    isLoading = false;
    isLoadingServiceTypes = false;
    isSaving = false;
    searchQuery = '';

    // Modal state
    showModal = false;
    isEditingPaymentType = false;
    paymentTypeForm!: FormGroup;
    selectedPaymentType: PaymentType | null = null;

    // Delete confirmation
    showDeleteConfirm = false;
    paymentTypeToDelete: PaymentType | null = null;

    constructor(
        private authService: AuthService,
        private notificationService: NotificationService,
        private fb: FormBuilder
    ) { }

    ngOnInit(): void {
        this.initializeForm();
        this.loadPaymentTypes();
        this.loadServiceTypes();
    }

    initializeForm(): void {
        this.paymentTypeForm = this.fb.group({
            code: ['', [Validators.required, Validators.minLength(3)]],
            name: ['', [Validators.required, Validators.minLength(3)]],
            base_amount: ['', [Validators.required, Validators.min(0)]],
            description: ['', [Validators.required, Validators.minLength(5)]],
            tax_rate: ['', [Validators.required, Validators.min(0), Validators.max(1)]],
            currency: ['NGN', Validators.required],
            service_id: ['', Validators.required]
        });
    }

    loadServiceTypes(): void {
        this.isLoadingServiceTypes = true;
        this.authService.getServiceTypes().subscribe({
            next: (response: any) => {
                this.serviceTypes = response.data?.service_types || [];
                this.isLoadingServiceTypes = false;
            },
            error: (error) => {
                this.isLoadingServiceTypes = false;
                console.error('Error loading service types:', error);
            }
        });
    }

    loadPaymentTypes(): void {
        this.isLoading = true;
        this.authService.getPaymentTypes().subscribe({
            next: (response: any) => {
                // Extract payment types from nested data structure
                // API returns: { success, message, data: { paymentTypes: [...] }, error, meta }
                this.paymentTypes = response.data?.paymentTypes || response.paymentTypes || response.data || [];
                this.isLoading = false;
            },
            error: (error) => {
                this.isLoading = false;
                this.notificationService.error('Failed to load payment types');
                console.error('Error loading payment types:', error);
            }
        });
    }

    openCreateModal(): void {
        this.isEditingPaymentType = false;
        this.selectedPaymentType = null;
        this.paymentTypeForm.reset({ currency: 'NGN' });
        this.paymentTypeForm.get('code')?.setValidators([Validators.required, Validators.minLength(3)]);
        this.paymentTypeForm.get('code')?.updateValueAndValidity();
        // Enable tax_rate for create mode
        this.paymentTypeForm.get('tax_rate')?.setValidators([Validators.required, Validators.min(0), Validators.max(1)]);
        this.paymentTypeForm.get('tax_rate')?.updateValueAndValidity();
        this.showModal = true;
    }

    openEditModal(paymentType: PaymentType): void {
        this.isEditingPaymentType = true;
        this.selectedPaymentType = paymentType;
        this.paymentTypeForm.patchValue(paymentType);
        // Keep code field validators so it can be edited and validated
        this.paymentTypeForm.get('code')?.setValidators([Validators.required, Validators.minLength(3)]);
        this.paymentTypeForm.get('code')?.updateValueAndValidity();
        // Remove tax_rate validators for edit mode (field is hidden)
        this.paymentTypeForm.get('tax_rate')?.clearValidators();
        this.paymentTypeForm.get('tax_rate')?.updateValueAndValidity();
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
        this.paymentTypeForm.reset();
    }

    savePaymentType(): void {
        if (this.paymentTypeForm.invalid) {
            this.notificationService.error('Please fill in all required fields correctly');
            return;
        }

        this.isSaving = true;
        const formData = this.paymentTypeForm.value;

        if (this.isEditingPaymentType && this.selectedPaymentType?.id) {
            // Update existing payment type - exclude tax_rate (not editable on update)
            const { tax_rate, ...updateData } = formData;
            this.authService.updatePaymentType(this.selectedPaymentType.id, updateData).subscribe({
                next: (response) => {
                    this.isSaving = false;
                    this.notificationService.success('Payment type updated successfully!');
                    this.closeModal();
                    this.loadPaymentTypes();
                },
                error: (error) => {
                    this.isSaving = false;
                    const errorMsg = error.error?.message || 'Failed to update payment type';
                    this.notificationService.error(errorMsg);
                }
            });
        } else {
            // Create new payment type
            this.authService.createPaymentType(formData).subscribe({
                next: (response) => {
                    this.isSaving = false;
                    this.notificationService.success('Payment type created successfully!');
                    this.closeModal();
                    this.loadPaymentTypes();
                },
                error: (error) => {
                    this.isSaving = false;
                    const errorMsg = error.error?.message || 'Failed to create payment type';
                    this.notificationService.error(errorMsg);
                }
            });
        }
    }

    openDeleteConfirm(paymentType: PaymentType): void {
        this.paymentTypeToDelete = paymentType;
        this.showDeleteConfirm = true;
    }

    closeDeleteConfirm(): void {
        this.showDeleteConfirm = false;
        this.paymentTypeToDelete = null;
    }

    confirmDelete(): void {
        if (!this.paymentTypeToDelete?.id) return;

        this.isSaving = true;
        this.authService.deletePaymentType(this.paymentTypeToDelete.id).subscribe({
            next: (response) => {
                this.isSaving = false;
                this.notificationService.success('Payment type deleted successfully!');
                this.closeDeleteConfirm();
                this.loadPaymentTypes();
            },
            error: (error) => {
                this.isSaving = false;
                const errorMsg = error.error?.message || 'Failed to delete payment type';
                this.notificationService.error(errorMsg);
            }
        });
    }

    getFilteredPaymentTypes(): PaymentType[] {
        if (!this.searchQuery.trim()) {
            return this.paymentTypes;
        }

        const query = this.searchQuery.toLowerCase();
        return this.paymentTypes.filter(pt =>
            pt.code.toLowerCase().includes(query) ||
            pt.name.toLowerCase().includes(query) ||
            pt.description.toLowerCase().includes(query)
        );
    }

    get code() {
        return this.paymentTypeForm.get('code');
    }

    get name() {
        return this.paymentTypeForm.get('name');
    }

    get base_amount() {
        return this.paymentTypeForm.get('base_amount');
    }

    get description() {
        return this.paymentTypeForm.get('description');
    }

    get tax_rate() {
        return this.paymentTypeForm.get('tax_rate');
    }

    get currency() {
        return this.paymentTypeForm.get('currency');
    }

    get service_id() {
        return this.paymentTypeForm.get('service_id');
    }
}
