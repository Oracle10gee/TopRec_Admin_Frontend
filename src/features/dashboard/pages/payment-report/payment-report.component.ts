import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../../core/services/api.service';
import { NotificationService } from '../../../../core/services/notification.service';

interface PaymentReportItem {
    id: string;
    payer_name: string;
    payment_type: string;
    amount: string;
    date: string;
    description: string;
    status: string;
    payment_reference: string;
    rrr: string;
    payment_method: string | null;
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
    payer_name?: string;
    payment_type?: string;
}

@Component({
    standalone: true,
    selector: 'app-payment-report',
    imports: [CommonModule],
    templateUrl: './payment-report.component.html',
    styleUrls: ['./payment-report.component.scss']
})
export class PaymentReportComponent implements OnInit, OnDestroy {
    payments: PaymentReportItem[] = [];
    isLoading = false;
    searchTerm = '';

    // Pagination
    currentPage = 1;
    pageSize = 15;
    totalPages = 0;
    totalPayments = 0;

    // Filtering
    statusFilter: 'all' | 'successful' | 'pending' | 'failed' = 'all';

    private destroy$ = new Subject<void>();

    constructor(
        private apiService: ApiService,
        private notificationService: NotificationService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.loadPaymentReport();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Load payment report from the payment history API
     */
    loadPaymentReport(page: number = 1): void {
        this.isLoading = true;
        this.currentPage = page;

        let url = `/payments/history?page=${page}&limit=${this.pageSize}`;
        if (this.statusFilter !== 'all') {
            url += `&status=${this.statusFilter}`;
        }

        this.apiService.get<any>(url)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response: any) => {
                    const apiPayments = response.data?.payments || [];
                    const pagination = response.data?.pagination || {};

                    this.payments = apiPayments.map((payment: PaymentHistoryAPI) => ({
                        id: payment.id,
                        payer_name: payment.payer_name || 'N/A',
                        payment_type: payment.payment_type
                            ? this.formatPaymentType(payment.payment_type)
                            : payment.description || 'N/A',
                        amount: `₦${parseFloat(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
                        date: new Date(payment.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        }),
                        description: payment.description,
                        status: payment.status.charAt(0).toUpperCase() + payment.status.slice(1),
                        payment_reference: payment.payment_reference || 'N/A',
                        rrr: payment.rrr || 'N/A',
                        payment_method: payment.payment_method
                    }));

                    this.totalPages = pagination.total_pages || 0;
                    this.totalPayments = pagination.total || 0;
                    this.isLoading = false;
                    this.cdr.detectChanges();
                },
                error: (error: any) => {
                    console.error('Failed to load payment report:', error);
                    this.isLoading = false;
                    this.notificationService.error('Failed to load payment report');
                }
            });
    }

    /**
     * Format payment type code for display
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
        return typeMap[paymentType] || paymentType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }

    /**
     * Filter by status
     */
    filterByStatus(status: 'all' | 'successful' | 'pending' | 'failed'): void {
        this.statusFilter = status;
        this.currentPage = 1;
        this.loadPaymentReport();
    }

    /**
     * Get status badge color classes
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
     * Pagination controls
     */
    nextPage(): void {
        if (this.currentPage < this.totalPages) {
            this.loadPaymentReport(this.currentPage + 1);
        }
    }

    previousPage(): void {
        if (this.currentPage > 1) {
            this.loadPaymentReport(this.currentPage - 1);
        }
    }

    /**
     * Export payment report
     */
    exportReport(): void {
        if (this.payments.length === 0) {
            this.notificationService.error('No payment data to export');
            return;
        }

        // Generate CSV
        const headers = ['Date', 'Payer Name', 'Payment Type', 'Amount', 'Status', 'Payment Reference', 'RRR'];
        const rows = this.payments.map(p => [
            p.date,
            `"${p.payer_name}"`,
            `"${p.payment_type}"`,
            p.amount.replace('₦', ''),
            p.status,
            p.payment_reference,
            p.rrr
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `payment-report-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);

        this.notificationService.success('Payment report exported successfully');
    }
}
