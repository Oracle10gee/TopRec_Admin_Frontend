import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
    standalone: true,
    selector: 'app-dashboard-payments',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './payments.component.html',
    styleUrls: ['./payments.component.scss']
})
export class DashboardPaymentsComponent implements OnInit {
    paymentForm!: FormGroup;
    paymentHistory = [
        {
            id: 'PAY-2024-001',
            amount: '₦25,000',
            date: '2024-01-15',
            description: 'License Renewal 2024',
            status: 'Successful',
            statusColor: 'green'
        },
        {
            id: 'PAY-2023-001',
            amount: '₦25,000',
            date: '2023-01-10',
            description: 'License Renewal 2023',
            status: 'Successful',
            statusColor: 'green'
        }
    ];

    isProcessing = false;
    paymentSuccess = false;
    errorMessage = '';

    constructor(private fb: FormBuilder) { }

    ngOnInit(): void {
        this.initializeForm();
    }

    initializeForm(): void {
        this.paymentForm = this.fb.group({
            paymentType: ['renewal', Validators.required],
            amount: ['₦25,000', Validators.required],
            paymentMethod: ['card', Validators.required]
        });
    }

    onPaymentSubmit(): void {
        if (this.paymentForm.valid) {
            this.isProcessing = true;
            this.errorMessage = '';

            setTimeout(() => {
                console.log('Payment Submitted:', this.paymentForm.value);
                this.paymentSuccess = true;
                this.isProcessing = false;

                setTimeout(() => {
                    this.paymentSuccess = false;
                }, 3000);
            }, 2000);
        }
    }
}
