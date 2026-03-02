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
    description: string | null;
    currency: string;
    service_id?: string | null;
    is_active?: number | boolean;
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
                const rawPaymentTypes = response.data?.paymentTypes || response.paymentTypes || response.data || [];
                this.paymentTypes = rawPaymentTypes.map((paymentType: PaymentType) => ({
                    ...paymentType,
                    description: paymentType.description ?? '',
                    service_id: paymentType.service_id ?? null
                }));
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
        // Restore validators for fields shown only on create
        this.paymentTypeForm.get('code')?.setValidators([Validators.required, Validators.minLength(3)]);
        this.paymentTypeForm.get('code')?.updateValueAndValidity();
        this.paymentTypeForm.get('service_id')?.setValidators([Validators.required]);
        this.paymentTypeForm.get('service_id')?.updateValueAndValidity();
        this.showModal = true;
    }

    openEditModal(paymentType: PaymentType): void {
        this.isEditingPaymentType = true;
        this.selectedPaymentType = paymentType;
        this.paymentTypeForm.patchValue(paymentType);
        // code and service_id are not editable — clear their validators
        this.paymentTypeForm.get('code')?.clearValidators();
        this.paymentTypeForm.get('code')?.updateValueAndValidity();
        this.paymentTypeForm.get('service_id')?.clearValidators();
        this.paymentTypeForm.get('service_id')?.updateValueAndValidity();
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
            // Update existing payment type - exclude code and service_id (not editable on update)
            const { code, service_id, ...updateData } = formData;
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

    isPaymentTypeActive(paymentType: PaymentType): boolean {
        return paymentType.is_active === 1 || paymentType.is_active === true;
    }

    togglePaymentTypeStatus(paymentType: PaymentType): void {
        if (!paymentType.id) return;

        const willDeactivate = this.isPaymentTypeActive(paymentType);
        this.isSaving = true;
        this.authService.togglePaymentTypeStatus(paymentType.id).subscribe({
            next: () => {
                this.isSaving = false;
                const statusText = willDeactivate ? 'deactivated' : 'activated';
                this.notificationService.success(`Payment type ${statusText} successfully!`);
                this.loadPaymentTypes();
            },
            error: (error) => {
                this.isSaving = false;
                const errorMsg = error.error?.message || 'Failed to update payment type status';
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
            (pt.description ?? '').toLowerCase().includes(query)
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

    get currency() {
        return this.paymentTypeForm.get('currency');
    }

    get service_id() {
        return this.paymentTypeForm.get('service_id');
    }
}
