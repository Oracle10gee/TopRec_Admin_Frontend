import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

type PaymentsTab = 'renewal' | 'history';

interface PaymentType {
    id: string;
    name: string;
    code: string;
    description: string;
    base_amount: string;
    tax_rate: string;
    currency: string;
    is_active: number;
}

interface CalculatedPayment {
    subtotal: string;
    tax: number;
    tax_rate: string;
    total: string;
    currency: string;
    valid_until: string;
}

interface PaymentHistory {
    id: string;
    amount: string;
    date: string;
    description: string;
    status: string;
    statusColor: string;
}

@Component({
    standalone: true,
    selector: 'app-dashboard-payments',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './payments.component.html',
    styleUrls: ['./payments.component.scss']
})
export class DashboardPaymentsComponent implements OnInit {
    activeTab: PaymentsTab = 'renewal';
    paymentForm!: FormGroup;

    paymentHistory: PaymentHistory[] = [
        {
            id: 'PAY-2024-001',
            amount: '₦26,250',
            date: '2024-01-15',
            description: 'License Renewal 2024',
            status: 'Successful',
            statusColor: 'green'
        },
        {
            id: 'PAY-2023-001',
            amount: '₦26,250',
            date: '2023-01-10',
            description: 'License Renewal 2023',
            status: 'Successful',
            statusColor: 'green'
        }
    ];

    paymentTypes: PaymentType[] = [];
    calculatedPayment: CalculatedPayment | null = null;
    isProcessing = false;
    paymentSuccess = false;
    errorMessage = '';
    isLoadingPaymentTypes = false;
    isCalculating = false;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private notificationService: NotificationService,
        private httpClient: HttpClient,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.initializeForm();
        this.loadUserPreferences();
        this.loadPaymentTypes();

        // Debug form state
        setTimeout(() => {
            console.log('=== FORM STATE DEBUG ===');
            console.log('Payment form:', this.paymentForm);
            console.log('Form enabled:', this.paymentForm?.enabled);
            console.log('Form disabled:', this.paymentForm?.disabled);
            console.log('Form status:', this.paymentForm?.status);
            console.log('paymentTypeCode:', {
                control: this.paymentForm.get('paymentTypeCode'),
                enabled: this.paymentForm.get('paymentTypeCode')?.enabled,
                disabled: this.paymentForm.get('paymentTypeCode')?.disabled,
                value: this.paymentForm.get('paymentTypeCode')?.value
            });
            console.log('amount:', {
                control: this.paymentForm.get('amount'),
                enabled: this.paymentForm.get('amount')?.enabled,
                disabled: this.paymentForm.get('amount')?.disabled,
                value: this.paymentForm.get('amount')?.value
            });
            console.log('phone:', {
                control: this.paymentForm.get('phone'),
                enabled: this.paymentForm.get('phone')?.enabled,
                disabled: this.paymentForm.get('phone')?.disabled,
                value: this.paymentForm.get('phone')?.value
            });
        }, 100);
    }

    /**
     * Load payment types from backend
     */
    private loadPaymentTypes(): void {
        this.isLoadingPaymentTypes = true;
        this.authService.getPaymentTypes().subscribe({
            next: (response: any) => {
                console.log('📦 Raw response:', response);
                const types = response.data?.paymentTypes || response.paymentTypes || [];
                this.paymentTypes = Array.isArray(types) ? types : [];
                this.isLoadingPaymentTypes = false;
                console.log('✅ Payment types loaded:', this.paymentTypes);
                console.log('✅ paymentTypes array length:', this.paymentTypes.length);
                // Explicitly trigger change detection
                this.cdr.markForCheck();
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('❌ Failed to load payment types:', error);
                this.isLoadingPaymentTypes = false;
                this.notificationService.error('Failed to load payment types');
            }
        });
    }

    /**
     * Initialize payment form
     */
    private initializeForm(): void {
        this.paymentForm = this.fb.group({
            paymentTypeCode: ['', Validators.required],
            amount: [{ value: '', disabled: true }, Validators.required],
            phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]]
        });

        // Calculate payment when payment type changes
        this.paymentForm.get('paymentTypeCode')?.valueChanges.subscribe((code) => {
            console.log('💬 Payment type changed:', code);
            if (code) {
                this.calculatePayment(code);
            }
        });

        // Monitor form value changes
        this.paymentForm.valueChanges.subscribe((value) => {
            console.log('📝 Form value changed:', value);
        });
    }

    /**
     * Load user preferences from localStorage
     */
    private loadUserPreferences(): void {
        const savedTab = localStorage.getItem('payments_active_tab');
        if (savedTab && this.isValidTab(savedTab)) {
            this.activeTab = savedTab as PaymentsTab;
        }
    }

    /**
     * Calculate payment via backend API
     */
    private calculatePayment(paymentTypeCode: string): void {
        this.isCalculating = true;

        const payload = {
            payment_type_code: paymentTypeCode
        };

        // DEBUG: Check if token exists
        const token = this.authService.getAccessToken();
        console.log('🔑 Token status before calculate:', token ? '✅ Token found' : '❌ NO TOKEN');
        console.log('🔄 Calculating payment with payload:', payload);

        this.httpClient.post<any>(`${environment.apiUrl}/payments/calculate`, payload).subscribe({
            next: (response) => {
                console.log('✅ Payment calculated:', response.data);
                this.calculatedPayment = response.data;
                this.paymentForm.patchValue({
                    amount: `₦${parseFloat(response.data.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                });
                this.isCalculating = false;
            },
            error: (error) => {
                console.error('❌ Calculation failed:', error);
                this.isCalculating = false;
                this.notificationService.error('Failed to calculate payment amount');
            }
        });
    }

    /**
     * Validate tab name
     */
    private isValidTab(tab: string): boolean {
        return ['renewal', 'history'].includes(tab);
    }

    /**
     * Set active tab and save preference
     */
    setActiveTab(tab: PaymentsTab): void {
        this.activeTab = tab;
        localStorage.setItem('payments_active_tab', tab);
        console.log(`Payments tab changed to: ${tab}`);
    }

    /**
     * Get subtotal from calculated payment
     */
    getSubtotal(): string {
        if (this.calculatedPayment) {
            return `₦${parseFloat(this.calculatedPayment.subtotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        }
        return '₦0.00';
    }

    /**
     * Get tax from calculated payment
     */
    getTax(): string {
        if (this.calculatedPayment) {
            return `₦${this.calculatedPayment.tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        }
        return '₦0.00';
    }

    /**
     * Get total from calculated payment
     */
    getTotal(): string {
        if (this.calculatedPayment) {
            return `₦${parseFloat(this.calculatedPayment.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        }
        return '₦0.00';
    }

    /**
     * Format currency for display
     */
    formatCurrency(amount: string | number): string {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return `₦${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    /**
     * Get license expiry date (1 year from now)
     */
    getLicenseExpiry(): string {
        const today = new Date();
        const expiryDate = new Date(today.setFullYear(today.getFullYear() + 1));
        return expiryDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Calculate total amount paid from history
     */
    getTotalPaid(): string {
        if (this.paymentHistory.length === 0) {
            return '0';
        }

        const total = this.paymentHistory.reduce((sum, payment) => {
            // Remove ₦ and commas, then parse
            const amount = parseFloat(payment.amount.replace(/₦|,/g, ''));
            return sum + amount;
        }, 0);

        return total.toLocaleString();
    }

    /**
     * Handle payment submission
     */
    onPaymentSubmit(): void {
        console.log('🔄 Payment submission initiated');
        console.log('Form valid?', this.paymentForm.valid);
        console.log('Form value:', this.paymentForm.value);

        if (this.paymentForm.invalid) {
            this.errorMessage = 'Please fill in all required fields correctly';
            this.notificationService.error(this.errorMessage);
            this.clearMessage('error', 5000);
            return;
        }

        this.isProcessing = true;
        this.errorMessage = '';
        this.paymentSuccess = false;

        // Get current user information
        const currentUser = this.authService['currentUserSubject']?.value;
        console.log('Current user:', currentUser);

        if (!currentUser) {
            this.errorMessage = 'User information not found. Please log in again.';
            this.isProcessing = false;
            this.notificationService.error(this.errorMessage);
            console.error('❌ User not found');
            return;
        }

        // Get form values
        const paymentTypeCode = this.paymentForm.get('paymentTypeCode')?.value;
        const phone = this.paymentForm.get('phone')?.value;

        console.log('📝 Payment submission data:', {
            paymentTypeCode,
            phone,
            payer_name: currentUser.full_name,
            payer_email: currentUser.email
        });

        // Prepare payload for initiate payment API
        const payload = {
            payment_type_code: paymentTypeCode,
            payer_name: currentUser.full_name || 'Customer',
            payer_email: currentUser.email || 'no-email@example.com',
            payer_phone: phone
        };

        console.log('🚀 Calling backend initiate payment API with payload:', payload);

        // Call backend initiate payment API
        this.httpClient.post<any>(`${environment.apiUrl}/payments/initiate`, payload).subscribe({
            next: (response) => {
                console.log('✅ Payment initiated successfully:', response);
                this.isProcessing = false;

                // If response contains a payment link/URL, redirect to it
                if (response.data?.payment_link || response.data?.redirect_url) {
                    console.log('🔗 Redirecting to payment gateway...');
                    window.location.href = response.data.payment_link || response.data.redirect_url;
                } else {
                    // Otherwise show success and add to history
                    this.paymentSuccess = true;
                    this.notificationService.success('Payment initiated successfully!');
                    this.addToHistory();
                    this.clearMessage('success', 7000);
                }
            },
            error: (error) => {
                console.error('❌ Payment initiation failed:', error);
                this.isProcessing = false;
                this.errorMessage = error.error?.message || error.message || 'Payment initiation failed. Please try again.';
                this.notificationService.error(this.errorMessage);
                this.clearMessage('error', 5000);
            }
        });
    }

    /**
     * Add successful payment to history
     */
    private addToHistory(): void {
        const paymentTypeCode = this.paymentForm.get('paymentTypeCode')?.value;
        const paymentType = this.paymentTypes.find(p => p.code === paymentTypeCode);

        const newPayment: PaymentHistory = {
            id: `PAY-${new Date().getFullYear()}-${String(this.paymentHistory.length + 1).padStart(3, '0')}`,
            amount: this.getTotal(),
            date: new Date().toISOString(),
            description: (paymentType?.name || 'Payment') + ' ' + new Date().getFullYear(),
            status: 'Successful',
            statusColor: 'green'
        };

        this.paymentHistory.unshift(newPayment);
    }

    /**
     * Clear message after delay
     */
    private clearMessage(type: 'success' | 'error', delay: number): void {
        setTimeout(() => {
            if (type === 'success') {
                this.paymentSuccess = false;
            } else {
                this.errorMessage = '';
            }
        }, delay);
    }

    /**
     * Debug method to check select field state
     */
    debugSelectField(): void {
        console.log('=== ALL FORM CONTROLS DEBUG ===');
        const typeControl = this.paymentForm.get('paymentTypeCode');
        const amountControl = this.paymentForm.get('amount');
        const phoneControl = this.paymentForm.get('phone');

        console.log('Form instance:', this.paymentForm ? '✓ EXISTS' : '✗ NULL');
        console.log('Form enabled:', this.paymentForm?.enabled, 'disabled:', this.paymentForm?.disabled);
        console.log('Form status:', this.paymentForm?.status);
        console.log('');
        console.log('paymentTypeCode:');
        console.log('  - exists:', typeControl ? '✓' : '✗');
        console.log('  - enabled:', typeControl?.enabled);
        console.log('  - disabled:', typeControl?.disabled);
        console.log('  - value:', typeControl?.value);
        console.log('');
        console.log('amount:');
        console.log('  - exists:', amountControl ? '✓' : '✗');
        console.log('  - enabled:', amountControl?.enabled);
        console.log('  - disabled:', amountControl?.disabled);
        console.log('  - value:', amountControl?.value);
        console.log('');
        console.log('phone:');
        console.log('  - exists:', phoneControl ? '✓' : '✗');
        console.log('  - enabled:', phoneControl?.enabled);
        console.log('  - disabled:', phoneControl?.disabled);
        console.log('  - value:', phoneControl?.value);
        console.log('');
        console.log('Other state:');
        console.log('  - isProcessing:', this.isProcessing);
        console.log('  - isLoadingPaymentTypes:', this.isLoadingPaymentTypes);
        console.log('  - paymentTypes count:', this.paymentTypes.length);
    }

    /**
     * Download payment receipt
     */
    downloadReceipt(paymentId: string): void {
        console.log('Downloading receipt for:', paymentId);

        // TODO: Implement actual download logic
        alert(`Downloading receipt for ${paymentId}.\n\nThis will generate a PDF receipt with:\n- Payment details\n- Transaction ID\n- Official TOPREC stamp\n\nFeature coming soon!`);
    }

    /**
     * Export payment history
     */
    exportHistory(): void {
        console.log('Exporting payment history');

        if (this.paymentHistory.length === 0) {
            alert('No payment history to export');
            return;
        }

        // TODO: Implement actual export logic
        alert(`Exporting ${this.paymentHistory.length} payment records.\n\nFormats available:\n- PDF\n- Excel (XLSX)\n- CSV\n\nFeature coming soon!`);

        // Example of CSV export (for future implementation):
        // const csv = this.generateCSV();
        // const blob = new Blob([csv], { type: 'text/csv' });
        // const url = window.URL.createObjectURL(blob);
        // const link = document.createElement('a');
        // link.href = url;
        // link.download = `payment-history-${Date.now()}.csv`;
        // link.click();
    }

    /**
     * Generate CSV from payment history (helper for future use)
     */
    private generateCSV(): string {
        const headers = ['Date', 'Description', 'Amount', 'Status', 'Transaction ID'];
        const rows = this.paymentHistory.map(p => [
            new Date(p.date).toLocaleDateString(),
            p.description,
            p.amount,
            p.status,
            p.id
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        return csvContent;
    }
}