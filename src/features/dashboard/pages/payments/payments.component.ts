import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

type PaymentsTab = 'renewal' | 'history';

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

    isProcessing = false;
    paymentSuccess = false;
    errorMessage = '';

    // Pricing configuration
    private pricing = {
        renewal: { base: 25000, label: 'License Renewal' },
        upgrade: { base: 35000, label: 'License Upgrade' },
        additional: { base: 15000, label: 'Additional Services' }
    };

    private processingFee = 500;
    private taxRate = 0.075; // 7.5%

    constructor(private fb: FormBuilder) {}

    ngOnInit(): void {
        this.initializeForm();
        this.loadUserPreferences();
    }

    /**
     * Initialize payment form
     */
    private initializeForm(): void {
        this.paymentForm = this.fb.group({
            paymentType: ['renewal', Validators.required],
            amount: ['₦25,000', Validators.required],
            paymentMethod: ['card', Validators.required]
        });

        // Update amount when payment type changes
        this.paymentForm.get('paymentType')?.valueChanges.subscribe(() => {
            this.updateAmount();
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
     * Update amount based on payment type
     */
    private updateAmount(): void {
        const paymentType = this.paymentForm.get('paymentType')?.value as keyof typeof this.pricing;
        const baseAmount = this.pricing[paymentType]?.base || 25000;
        this.paymentForm.patchValue({
            amount: `₦${baseAmount.toLocaleString()}`
        });
    }

    /**
     * Handle payment type change
     */
    onPaymentTypeChange(): void {
        this.updateAmount();
    }

    /**
     * Calculate subtotal
     */
    getSubtotal(): string {
        const paymentType = this.paymentForm.get('paymentType')?.value as keyof typeof this.pricing;
        const amount = this.pricing[paymentType]?.base || 25000;
        return `₦${amount.toLocaleString()}`;
    }

    /**
     * Get processing fee
     */
    getProcessingFee(): string {
        return `₦${this.processingFee.toLocaleString()}`;
    }

    /**
     * Calculate tax
     */
    getTax(): string {
        const paymentType = this.paymentForm.get('paymentType')?.value as keyof typeof this.pricing;
        const baseAmount = this.pricing[paymentType]?.base || 25000;
        const tax = (baseAmount + this.processingFee) * this.taxRate;
        return `₦${Math.round(tax).toLocaleString()}`;
    }

    /**
     * Calculate total amount
     */
    getTotal(): string {
        const paymentType = this.paymentForm.get('paymentType')?.value as keyof typeof this.pricing;
        const baseAmount = this.pricing[paymentType]?.base || 25000;
        const tax = (baseAmount + this.processingFee) * this.taxRate;
        const total = baseAmount + this.processingFee + tax;
        return `₦${Math.round(total).toLocaleString()}`;
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
        if (this.paymentForm.invalid) {
            this.errorMessage = 'Please fill in all required fields correctly';
            this.clearMessage('error', 5000);
            return;
        }

        this.isProcessing = true;
        this.errorMessage = '';
        this.paymentSuccess = false;

        // Simulate payment processing
        setTimeout(() => {
            // Simulate random success/failure for demo
            const isSuccess = Math.random() > 0.1; // 90% success rate

            if (isSuccess) {
                console.log('Payment Submitted:', this.paymentForm.value);
                this.paymentSuccess = true;
                this.isProcessing = false;

                // Add to payment history
                this.addToHistory();

                // Clear success message after 5 seconds
                this.clearMessage('success', 5000);
            } else {
                this.errorMessage = 'Payment processing failed. Please try again or contact support.';
                this.isProcessing = false;
                this.clearMessage('error', 5000);
            }
        }, 2500);
    }

    /**
     * Add successful payment to history
     */
    private addToHistory(): void {
        const newPayment: PaymentHistory = {
            id: `PAY-${new Date().getFullYear()}-${String(this.paymentHistory.length + 1).padStart(3, '0')}`,
            amount: this.getTotal(),
            date: new Date().toISOString(),
            description: this.pricing[this.paymentForm.get('paymentType')?.value as keyof typeof this.pricing].label + ' ' + new Date().getFullYear(),
            status: 'Successful',
            statusColor: 'green'
        };

        this.paymentHistory.unshift(newPayment);
    }

    /**
     * Clear message after timeout
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