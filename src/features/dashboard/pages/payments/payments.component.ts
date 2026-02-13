import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ApiService } from '../../../../core/services/api.service';
import { RemitaPaymentService } from '../../../../core/services/remita-payment.service';

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

interface PaymentHistoryAPI {
    id: string;
    date: string;
    description: string;
    payment_reference: string;
    rrr: string;
    amount: string;
    status: string;
    payment_method: string | null;
}

interface PaymentHistoryResponse {
    success: boolean;
    message: string;
    data: {
        payments: PaymentHistoryAPI[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            total_pages: number;
        };
    };
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

    paymentHistory: PaymentHistory[] = [];

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

    // Payment history API properties
    isLoadingHistory = false;
    historyStatusFilter: 'all' | 'successful' | 'pending' | 'failed' = 'all';
    currentPage = 1;
    pageSize = 10;
    totalPages = 0;
    totalPayments = 0;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private notificationService: NotificationService,
        private apiService: ApiService,
        private cdr: ChangeDetectorRef,
        private remitaPaymentService: RemitaPaymentService
    ) { }

    ngOnInit(): void {
        this.initializeForm();
        this.loadUserPreferences();
        this.determineUserRole();
        this.loadUserPhone();
        this.loadPaymentTypes();
        this.loadPaymentHistory();

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
     * Load payment history from backend with pagination and filtering
     */
    loadPaymentHistory(page: number = 1): void {
        this.isLoadingHistory = true;
        this.currentPage = page;

        // Build query parameters object
        const queryParams: any = {
            page: page,
            limit: this.pageSize
        };

        // Add status filter if not 'all'
        if (this.historyStatusFilter !== 'all') {
            queryParams.status = this.historyStatusFilter;
        }

        console.log('📋 Loading payment history with params:', queryParams);

        // Call API endpoint with query parameters
        const url = `/payments/history?page=${queryParams.page}&limit=${queryParams.limit}${queryParams.status ? '&status=' + queryParams.status : ''}`;

        this.apiService.get<PaymentHistoryResponse>(url).subscribe({
            next: (response: any) => {
                console.log('✅ Payment history loaded:', response);

                const apiPayments = response.data?.payments || [];
                const pagination = response.data?.pagination || {};

                // Transform API response to display format
                this.paymentHistory = apiPayments.map((payment: PaymentHistoryAPI) => ({
                    id: payment.id,
                    amount: `₦${parseFloat(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
                    date: new Date(payment.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }),
                    description: payment.description,
                    status: payment.status.charAt(0).toUpperCase() + payment.status.slice(1),
                    statusColor: payment.status === 'successful' ? 'green' : 'red'
                }));

                // Update pagination info
                this.totalPages = pagination.total_pages || 0;
                this.totalPayments = pagination.total || 0;

                this.isLoadingHistory = false;
                console.log('✅ Transformed payment history:', this.paymentHistory);
                console.log('📊 Pagination - Page:', this.currentPage, 'Total Pages:', this.totalPages, 'Total Payments:', this.totalPayments);

                this.cdr.detectChanges();
            },
            error: (error: any) => {
                console.error('❌ Failed to load payment history:', error);
                this.isLoadingHistory = false;
                this.notificationService.error('Failed to load payment history');
            }
        });
    }

    /**
     * Filter payment history by status
     */
    filterByStatus(status: 'all' | 'successful' | 'pending' | 'failed'): void {
        console.log('🔍 Filtering payment history by status:', status);
        this.historyStatusFilter = status;
        this.currentPage = 1; // Reset to first page
        this.loadPaymentHistory();
    }

    /**
     * Go to next page of payment history
     */
    nextPage(): void {
        if (this.currentPage < this.totalPages) {
            this.loadPaymentHistory(this.currentPage + 1);
        }
    }

    /**
     * Go to previous page of payment history
     */
    previousPage(): void {
        if (this.currentPage > 1) {
            this.loadPaymentHistory(this.currentPage - 1);
        }
    }

    /**
     * Get status badge color and style
     */
    getStatusColor(status: string): string {
        switch (status.toLowerCase()) {
            case 'successful':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'failed':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    }

    /**
     * Get status icon SVG path
     */
    getStatusIcon(status: string): { path: string; viewBox: string } {
        switch (status.toLowerCase()) {
            case 'successful':
                return {
                    path: 'M5 13l4 4L19 7',
                    viewBox: '0 0 24 24'
                };
            case 'pending':
                return {
                    path: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
                    viewBox: '0 0 24 24'
                };
            case 'failed':
                return {
                    path: 'M6 18L18 6M6 6l12 12',
                    viewBox: '0 0 24 24'
                };
            default:
                return {
                    path: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
                    viewBox: '0 0 24 24'
                };
        }
    }

    /**
     * Format payment type for display
     */
    private formatPaymentType(paymentType: string): string {
        const typeMap: { [key: string]: string } = {
            'license_renewal': 'License Renewal',
            'new_registration': 'New Registration',
            'license_amount': 'License Amount Fee',
            'application_fee': 'Application Fee',
            'late_fee': 'Late Renewal Fee',
            'verification_fee': 'Verification Fee'
        };
        return typeMap[paymentType] || paymentType.replace(/_/g, ' ').toUpperCase();
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
     * Confirm payment and proceed to Remita checkout via inline widget
     */
    confirmAndProceedToPayment(): void {
        if (!this.paymentDetails) {
            console.error('❌ Payment details not found');
            this.notificationService.error('Payment details not found');
            return;
        }

        console.log('🚀 Opening Remita inline payment widget');
        console.log('💳 RRR:', this.paymentDetails.rrr);

        // Close modal before opening Remita widget
        this.showPaymentDetailsModal = false;

        // Use Remita inline payment widget with RRR
        this.remitaPaymentService.payWithRrr(this.paymentDetails.rrr).subscribe({
            next: (response: any) => {
                console.log('✅ Payment completed:', response);
                this.paymentSuccess = true;
                this.notificationService.success('Payment completed successfully!');
                this.addToHistory();
                this.clearMessage('success', 7000);
                this.cdr.detectChanges();
            },
            error: (error: any) => {
                console.error('❌ Payment failed or cancelled:', error);
                if (error.message === 'Payment cancelled by user') {
                    this.notificationService.info('Payment was cancelled');
                } else {
                    this.errorMessage = error.message || 'Payment failed. Please try again.';
                    this.notificationService.error(this.errorMessage);
                    this.clearMessage('error', 5000);
                }
                this.cdr.detectChanges();
            }
        });
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
     * Reload payment history after successful payment
     */
    private addToHistory(): void {
        console.log('🔄 Reloading payment history after successful payment');
        // Reload payment history from backend to include the new payment
        this.loadPaymentHistory(1);
        // Reset form
        this.paymentForm.reset();
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
     * Download payment receipt as PDF
     */
    downloadReceipt(paymentId: string): void {
        const payment = this.paymentHistory.find(p => p.id === paymentId);
        if (!payment) {
            this.notificationService.error('Payment not found');
            return;
        }

        // Generate receipt HTML content
        const receiptHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Payment Receipt - ${paymentId}</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        background: #f5f5f5;
                        padding: 20px;
                    }
                    .receipt-container {
                        max-width: 600px;
                        margin: 0 auto;
                        background: white;
                        border-radius: 12px;
                        box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                        overflow: hidden;
                    }
                    .receipt-header {
                        background: linear-gradient(135deg, #1a5632 0%, #2a7642 100%);
                        color: white;
                        padding: 40px 30px;
                        text-align: center;
                        border-bottom: 4px solid #0d3520;
                    }
                    .receipt-header h1 {
                        font-size: 28px;
                        font-weight: 700;
                        margin-bottom: 8px;
                    }
                    .receipt-header p {
                        font-size: 12px;
                        opacity: 0.9;
                        letter-spacing: 0.5px;
                    }
                    .receipt-logo {
                        width: 60px;
                        height: 60px;
                        background: rgba(255,255,255,0.2);
                        border-radius: 50%;
                        margin: 0 auto 15px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 28px;
                    }
                    .receipt-body {
                        padding: 40px 30px;
                    }
                    .status-badge {
                        display: inline-block;
                        padding: 8px 16px;
                        border-radius: 6px;
                        font-weight: 600;
                        font-size: 12px;
                        margin-bottom: 20px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .status-successful {
                        background: #ecfdf5;
                        color: #065f46;
                        border: 1px solid #86efac;
                    }
                    .status-pending {
                        background: #fffbeb;
                        color: #92400e;
                        border: 1px solid #fde047;
                    }
                    .status-failed {
                        background: #fef2f2;
                        color: #991b1b;
                        border: 1px solid #fca5a5;
                    }
                    .section {
                        margin-bottom: 30px;
                    }
                    .section-title {
                        font-size: 12px;
                        font-weight: 700;
                        color: #666;
                        text-transform: uppercase;
                        letter-spacing: 0.8px;
                        margin-bottom: 12px;
                        padding-bottom: 8px;
                        border-bottom: 2px solid #eee;
                    }
                    .info-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 10px 0;
                        border-bottom: 1px solid #f0f0f0;
                    }
                    .info-row:last-child {
                        border-bottom: none;
                    }
                    .info-label {
                        color: #666;
                        font-size: 13px;
                        font-weight: 500;
                    }
                    .info-value {
                        color: #1a1a1a;
                        font-size: 13px;
                        font-weight: 600;
                        text-align: right;
                        word-break: break-word;
                    }
                    .amount-section {
                        background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
                        border: 2px solid #86efac;
                        border-radius: 10px;
                        padding: 20px;
                        margin: 20px 0;
                        text-align: center;
                    }
                    .amount-label {
                        color: #666;
                        font-size: 12px;
                        font-weight: 500;
                        margin-bottom: 8px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .amount-value {
                        color: #1a5632;
                        font-size: 36px;
                        font-weight: 700;
                    }
                    .receipt-footer {
                        background: #f9fafb;
                        padding: 30px;
                        text-align: center;
                        border-top: 1px solid #eee;
                    }
                    .footer-text {
                        color: #666;
                        font-size: 12px;
                        line-height: 1.6;
                    }
                    .footer-text strong {
                        color: #1a1a1a;
                        display: block;
                        margin-top: 10px;
                    }
                    .divider {
                        height: 1px;
                        background: linear-gradient(90deg, transparent, #ddd, transparent);
                        margin: 20px 0;
                    }
                    .note {
                        background: #fef3c7;
                        border-left: 4px solid #f59e0b;
                        padding: 12px;
                        border-radius: 4px;
                        color: #92400e;
                        font-size: 12px;
                        margin: 20px 0;
                    }
                    @media print {
                        body {
                            background: white;
                            padding: 0;
                        }
                        .receipt-container {
                            box-shadow: none;
                            border-radius: 0;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="receipt-container">
                    <!-- Header -->
                    <div class="receipt-header">
                        <div class="receipt-logo">✓</div>
                        <h1>Payment Receipt</h1>
                        <p>TOPREC - Professional Licensing Platform</p>
                    </div>

                    <!-- Body -->
                    <div class="receipt-body">
                        <!-- Status -->
                        <div class="status-badge status-${payment.status === 'Successful' ? 'successful' : payment.status === 'Pending' ? 'pending' : 'failed'}">
                            ${payment.status.toUpperCase()}
                        </div>

                        <!-- Payment Details Section -->
                        <div class="section">
                            <div class="section-title">Payment Details</div>
                            <div class="info-row">
                                <span class="info-label">Payment ID</span>
                                <span class="info-value">${paymentId}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Description</span>
                                <span class="info-value">${payment.description}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Date</span>
                                <span class="info-value">${payment.date}</span>
                            </div>
                        </div>

                        <!-- Amount Section -->
                        <div class="amount-section">
                            <div class="amount-label">Amount Paid</div>
                            <div class="amount-value">${payment.amount}</div>
                        </div>

                        <!-- Status Info -->
                        <div class="note">
                            <strong>Payment Status:</strong>
                            ${payment.status === 'Successful'
                ? 'Your payment has been successfully processed and confirmed. Your license has been renewed.'
                : payment.status === 'Pending'
                    ? 'Your payment is pending verification. Please allow 24-48 hours for processing.'
                    : 'Your payment was unsuccessful. Please contact support for assistance.'}
                        </div>

                        <div class="divider"></div>

                        <!-- Verification Section -->
                        <div class="section">
                            <div class="section-title">Verification</div>
                            <div class="info-row">
                                <span class="info-label">License Status</span>
                                <span class="info-value">${payment.status === 'Successful' ? 'Active' : 'Pending'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Receipt Date</span>
                                <span class="info-value">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="receipt-footer">
                        <div class="footer-text">
                            <p>This is an official receipt from TOPREC Professional Licensing Platform.</p>
                            <p>For any questions regarding this payment, please contact our support team.</p>
                            <strong>Keep this receipt for your records</strong>
                            <p style="margin-top: 15px; color: #999; font-size: 11px;">Receipt generated on ${new Date().toISOString().split('T')[0]}</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Create a new window and print the receipt
        const printWindow = window.open('', '', 'width=800,height=600');
        if (printWindow) {
            printWindow.document.write(receiptHTML);
            printWindow.document.close();

            // Wait for content to load before printing
            printWindow.onload = () => {
                printWindow.print();
            };
        }

        this.notificationService.success('Receipt opened. Use print dialog to save as PDF.');
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