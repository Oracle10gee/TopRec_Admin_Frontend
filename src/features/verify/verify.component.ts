import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

interface VerifyMember {
    name: string;
    registration_number: string;
    membership_type: string;
}

interface VerifyPaymentStatus {
    has_successful_payments: boolean;
    current_financial_status: string;
    is_current: boolean;
    last_payment_date: string;
}

interface VerifyInfo {
    verified_at: string;
    verification_status: string;
    message: string;
}

interface VerifyData {
    isValid: boolean;
    member: VerifyMember;
    payment_status: VerifyPaymentStatus;
    verification: VerifyInfo;
}

@Component({
    standalone: true,
    selector: 'app-verify',
    imports: [CommonModule],
    templateUrl: './verify.component.html',
    styleUrls: ['./verify.component.scss']
})
export class VerifyComponent implements OnInit {
    userId: string = '';
    isLoading: boolean = true;
    error: string = '';
    verifyData: VerifyData | null = null;

    constructor(
        private route: ActivatedRoute,
        private apiService: ApiService
    ) {}

    ngOnInit(): void {
        this.userId = this.route.snapshot.paramMap.get('userId') || '';
        if (this.userId) {
            this.verify();
        } else {
            this.error = 'Invalid verification link. No member ID was provided.';
            this.isLoading = false;
        }
    }

    private verify(): void {
        this.apiService.get(`/verify/${this.userId}`).subscribe({
            next: (response: any) => {
                if (response?.success && response?.data) {
                    this.verifyData = response.data as VerifyData;
                } else {
                    this.error = response?.message || 'Verification could not be completed.';
                }
                this.isLoading = false;
            },
            error: () => {
                this.error = 'Unable to reach the verification server. Please try again later.';
                this.isLoading = false;
            }
        });
    }

    get isValid(): boolean {
        return this.verifyData?.isValid === true;
    }

    get verificationStatus(): string {
        return this.verifyData?.verification?.verification_status || '';
    }

    get hasOutstandingBalance(): boolean {
        const val = this.verifyData?.payment_status?.current_financial_status;
        return !!val && val !== '0' && Number(val) > 0;
    }

    get outstandingBalance(): string {
        const val = this.verifyData?.payment_status?.current_financial_status;
        if (!val || val === '0' || Number(val) === 0) return '₦0';
        return `₦${Number(val).toLocaleString()}`;
    }

    formatDate(dateStr: string): string {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-NG', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    formatDateTime(dateStr: string): string {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleString('en-NG', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}
