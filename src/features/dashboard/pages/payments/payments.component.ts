import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ApiService } from '../../../../core/services/api.service';

type PaymentsTab = 'renewal' | 'history';
type UserRole = 'Superadmin' | 'Member' | 'Consulting Firm' | 'Practice Firm';

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

interface PaymentTypeForNonAdmin extends PaymentType {
    metadata: any;
    created_at: string;
    updated_at: string;
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

interface PaymentInitiateResponse {
    payment: {
        id: string;
        payment_reference: string;
        rrr: string;
        remita_order_id: string;
        amount: string;
        status: string;
        created_at: string;
    };
    payment_url: string;
    checkout_url: string;
}

interface PaymentDetails {
    rrr: string;
    paymentReference: string;
    amount: string;
    checkoutUrl: string;
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

    // Role-based workflow properties
    currentUserRole: UserRole | string = '';
    isSuperadmin = false;
    cachedPaymentTypes: PaymentTypeForNonAdmin[] = [];

    // Payment details modal properties
    showPaymentDetailsModal = false;
    paymentDetails: PaymentDetails | null = null;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private notificationService: NotificationService,
        private apiService: ApiService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.initializeForm();
        this.loadUserPreferences();
        this.determineUserRole();
        this.loadUserPhone();
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
     * Determine current user's role and set superadmin flag
     */
    private determineUserRole(): void {
        this.currentUserRole = this.authService.getCurrentUserRole();
        this.isSuperadmin = this.currentUserRole === 'Superadmin';
        console.log(`👤 Current user role: ${this.currentUserRole}`);
        console.log(`🔐 Is Superadmin: ${this.isSuperadmin}`);
    }

    /**
     * Load user phone number from profile and auto-populate form
     */
    private loadUserPhone(): void {
        console.log('📞 Loading user phone number from profile...');

        this.apiService.get<any>('/auth/profile').subscribe({
            next: (response: any) => {
                const phoneNumber = response.data?.user?.phone_number;

                if (phoneNumber) {
                    console.log('✅ Phone number retrieved:', phoneNumber);

                    // Auto-populate the phone field with user's phone number
                    this.paymentForm.patchValue({
                        phone: phoneNumber
                    });

                    console.log('✅ Phone field auto-populated');
                } else {
                    console.warn('⚠️ No phone number found in profile');
                }
            },
            error: (error: any) => {
                console.error('❌ Failed to load user profile:', error);
                // Don't show error to user - phone field can be filled manually
            }
        });
    }

    /**
     * Load payment types from backend based on user role
     * Superadmin: POST /api/v1/payments/payment-types
     * Others: GET /api/v1/payments/types
     */
    private loadPaymentTypes(): void {
        this.isLoadingPaymentTypes = true;

        if (this.isSuperadmin) {
            this.loadSuperadminPaymentTypes();
        } else {
            this.loadNonAdminPaymentTypes();
        }
    }

    /**
     * Load payment types for Superadmin users (POST endpoint)
     */
    private loadSuperadminPaymentTypes(): void {
        this.authService.getPaymentTypes().subscribe({
            next: (response: any) => {
                console.log('📦 Superadmin payment types response:', response);
                const types = response.data?.paymentTypes || response.paymentTypes || [];
                this.paymentTypes = Array.isArray(types) ? types : [];
                this.isLoadingPaymentTypes = false;
                console.log('✅ Superadmin payment types loaded:', this.paymentTypes);
                console.log('✅ paymentTypes array length:', this.paymentTypes.length);
                // Explicitly trigger change detection
                this.cdr.markForCheck();
                this.cdr.detectChanges();
            },
            error: (error: any) => {
                console.error('❌ Failed to load superadmin payment types:', error);
                this.isLoadingPaymentTypes = false;
                this.notificationService.error('Failed to load payment types');
            }
        });
    }

    /**
     * Load payment types for non-admin users (GET endpoint)
     * Response includes base_amount which is used directly for amount population
     */
    private loadNonAdminPaymentTypes(): void {
        this.apiService.get<any>('/payments/types').subscribe({
            next: (response: any) => {
                console.log('📦 Non-admin payment types response:', response);
                const types = response.data?.types || [];

                // Cache the full response data for later lookup
                this.cachedPaymentTypes = Array.isArray(types) ? types : [];

                // Create simplified paymentTypes array using code as the identifier
                this.paymentTypes = this.cachedPaymentTypes.map(type => ({
                    id: type.id,
                    name: type.name,
                    code: type.code,
                    description: type.description,
                    base_amount: type.base_amount,
                    tax_rate: type.tax_rate,
                    currency: type.currency,
                    is_active: type.is_active
                }));

                this.isLoadingPaymentTypes = false;
                console.log('✅ Non-admin payment types loaded:', this.paymentTypes);
                console.log('✅ Cached payment types:', this.cachedPaymentTypes);
                console.log('✅ paymentTypes array length:', this.paymentTypes.length);
                // Explicitly trigger change detection
                this.cdr.markForCheck();
                this.cdr.detectChanges();
            },
            error: (error: any) => {
                console.error('❌ Failed to load non-admin payment types:', error);
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

        // Calculate/populate amount when payment type changes based on user role
        this.paymentForm.get('paymentTypeCode')?.valueChanges.subscribe((code) => {
            console.log('💬 Payment type changed:', code);
            if (code) {
                if (this.isSuperadmin) {
                    // For Superadmin: call calculate API
                    this.calculatePayment(code);
                } else {
                    // For other roles: populate from cached data
                    this.populateAmountFromCache(code);
                }
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
     * Populate amount field from cached payment types data (non-admin users)
     * Looks up the base_amount directly from the cached response
     */
    private populateAmountFromCache(paymentTypeCode: string): void {
        this.isCalculating = true;
        console.log('🔍 Looking up payment type code:', paymentTypeCode);
        console.log('📦 Cached payment types:', this.cachedPaymentTypes);

        // Find the payment type in cached data
        const paymentType = this.cachedPaymentTypes.find(type => type.code === paymentTypeCode);

        if (paymentType) {
            console.log('✅ Found payment type:', paymentType);

            // Populate the amount field directly with base_amount
            const baseAmount = parseFloat(paymentType.base_amount);
            const formattedAmount = `₦${baseAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

            this.paymentForm.patchValue({
                amount: formattedAmount
            });

            // Create a calculated payment object for display purposes
            this.calculatedPayment = {
                subtotal: paymentType.base_amount,
                tax: baseAmount * parseFloat(paymentType.tax_rate),
                tax_rate: paymentType.tax_rate,
                total: (baseAmount + (baseAmount * parseFloat(paymentType.tax_rate))).toString(),
                currency: paymentType.currency,
                valid_until: '' // Not applicable for non-admin flow
            };

            console.log('💰 Calculated payment object:', this.calculatedPayment);
        } else {
            console.error('❌ Payment type not found:', paymentTypeCode);
            this.notificationService.error('Selected payment type not found');
        }

        this.isCalculating = false;
    }

    /**
     * Calculate payment via backend API (Superadmin only)
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

        this.apiService.post<any>('/payments/calculate', payload).subscribe({
            next: (response: any) => {
                console.log('✅ Payment calculated:', response.data);
                this.calculatedPayment = response.data;
                this.paymentForm.patchValue({
                    amount: `₦${parseFloat(response.data.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                });
                this.isCalculating = false;
            },
            error: (error: any) => {
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
        this.apiService.post<PaymentInitiateResponse>('/payments/initiate', payload).subscribe({
            next: (response: any) => {
                console.log('✅ Payment initiated successfully:', response);
                this.isProcessing = false;

                // Handle Remita payment response
                if (response.data?.payment && response.data?.checkout_url) {
                    console.log('🔗 Payment details received from Remita');

                    // Store payment details for modal display
                    this.paymentDetails = {
                        rrr: response.data.payment.rrr,
                        paymentReference: response.data.payment.payment_reference,
                        amount: response.data.payment.amount,
                        checkoutUrl: response.data.checkout_url
                    };

                    console.log('💰 Payment Details:', this.paymentDetails);

                    // Show payment details modal
                    this.showPaymentDetailsModal = true;
                    this.notificationService.success('Payment details ready. Please confirm to proceed.');
                } else if (response.data?.payment_link || response.data?.redirect_url) {
                    // Fallback for other payment URLs
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
            error: (error: any) => {
                console.error('❌ Payment initiation failed:', error);
                this.isProcessing = false;
                this.errorMessage = error.error?.message || error.message || 'Payment initiation failed. Please try again.';
                this.notificationService.error(this.errorMessage);
                this.clearMessage('error', 5000);
            }
        });
    }

    /**
     * Confirm payment and proceed to Remita checkout
     */
    confirmAndProceedToPayment(): void {
        if (!this.paymentDetails) {
            console.error('❌ Payment details not found');
            this.notificationService.error('Payment details not found');
            return;
        }

        console.log('🚀 Proceeding to Remita payment gateway');
        console.log('📍 Checkout URL:', this.paymentDetails.checkoutUrl);
        console.log('💳 RRR:', this.paymentDetails.rrr);

        // Close modal
        this.showPaymentDetailsModal = false;

        // Redirect to Remita checkout URL
        window.location.href = this.paymentDetails.checkoutUrl;
    }

    /**
     * Close payment details modal and clear data
     */
    closePaymentDetailsModal(): void {
        console.log('❌ Payment cancelled by user');
        this.showPaymentDetailsModal = false;
        this.paymentDetails = null;
        this.notificationService.info('Payment cancelled');
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