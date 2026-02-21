import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

declare let RmPaymentEngine: any;

export interface RemitaPaymentRequest {
    amount: number;
    reference: string;
    customerName: string;
    customerEmail: string;
    description: string;
    paymentTypeCode: string;
}

export interface RemitaPaymentResponse {
    success: boolean;
    message: string;
    reference?: string;
    amount?: number;
    status?: string;
}

@Injectable({
    providedIn: 'root'
})
export class RemitaPaymentService {
    private remitaConfig = environment.remita;
    private isScriptLoaded = false;
    private isScriptLoading = false;
    private scriptLoadPromise: Promise<boolean> | null = null;

    constructor() {
        console.log('RemitaPaymentService initialized with config:', this.remitaConfig);
        this.ensureScriptLoaded();
    }

    /**
     * Ensure Remita script is loaded
     */
    private ensureScriptLoaded(): Promise<boolean> {
        // Return existing promise if already loading
        if (this.scriptLoadPromise) {
            return this.scriptLoadPromise;
        }

        // Check if script already exists in DOM
        if (document.getElementById('remita-script')) {
            this.isScriptLoaded = true;
            return Promise.resolve(true);
        }

        // Create promise for script loading
        this.scriptLoadPromise = new Promise((resolve, reject) => {
            this.isScriptLoading = true;

            try {
                const script = document.createElement('script');
                script.id = 'remita-script';
                // Use the RRR-compatible inline payment bundle
                script.src = `${this.remitaConfig.baseUrl}/payment/v1/remita-pay-inline.bundle.js`;
                script.async = true;
                script.defer = true;
                script.type = 'text/javascript';

                script.onload = () => {
                    console.log('✓ Remita payment script loaded successfully from:', script.src);
                    // Add a small delay to ensure global is available
                    setTimeout(() => {
                        this.isScriptLoaded = true;
                        this.isScriptLoading = false;
                        resolve(true);
                    }, 100);
                };

                script.onerror = () => {
                    console.error('✗ Failed to load Remita script from primary URL:', script.src);
                    console.log('ℹ Trying alternative Remita script URLs...');

                    // Try multiple alternative URLs
                    const alternatives = [
                        `https://remitademo.net/payment/v1/remita-pay-inline.bundle.js`,
                        `https://login.remita.net/payment/v1/remita-pay-inline.bundle.js`,
                        `https://cdn.remita.net/payment/v1/remita-pay-inline.bundle.js`
                    ];

                    let altIndex = 0;
                    const tryNextUrl = () => {
                        if (altIndex >= alternatives.length) {
                            console.error('✗ Failed to load Remita script from all URLs:', alternatives);
                            this.isScriptLoading = false;
                            reject(new Error(`Failed to load Remita payment script. Tried: ${[script.src, ...alternatives].join(', ')}`));
                            return;
                        }

                        const alternativeUrl = alternatives[altIndex];
                        console.log(`📝 Attempting alternative URL (${altIndex + 1}/${alternatives.length}):`, alternativeUrl);

                        const scriptAlt = document.createElement('script');
                        scriptAlt.id = `remita-script-alt-${altIndex}`;
                        scriptAlt.src = alternativeUrl;
                        scriptAlt.async = true;
                        scriptAlt.type = 'text/javascript';

                        scriptAlt.onload = () => {
                            console.log('✓ Remita script loaded successfully from alternative URL:', alternativeUrl);
                            // Clean up the primary script that failed
                            const failedScript = document.getElementById('remita-script');
                            if (failedScript) {
                                failedScript.remove();
                            }
                            setTimeout(() => {
                                this.isScriptLoaded = true;
                                this.isScriptLoading = false;
                                resolve(true);
                            }, 100);
                        };

                        scriptAlt.onerror = () => {
                            console.warn(`✗ Alternative URL ${altIndex + 1} failed:`, alternativeUrl);
                            altIndex++;
                            tryNextUrl();
                        };

                        document.head.appendChild(scriptAlt);
                    };

                    tryNextUrl();
                };

                document.head.appendChild(script);
                console.log('📝 Remita script added to DOM, loading from:', script.src);
            } catch (error) {
                console.error('✗ Error appending Remita script:', error);
                this.isScriptLoading = false;
                reject(error);
            }
        });

        return this.scriptLoadPromise;
    }

    /**
     * Generate unique reference for payment
     */
    private generateReference(): string {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000000);
        return `TOPREC-${timestamp}-${random}`;
    }

    /**
     * Initiate payment with Remita
     */
    initiatePayment(paymentRequest: RemitaPaymentRequest): Observable<any> {
        console.log('🔄 Initiating Remita payment with request:', paymentRequest);

        return new Observable((observer) => {
            // Ensure script is loaded before initiating payment
            this.ensureScriptLoaded()
                .then(() => {
                    console.log('✓ Script ready, RmPaymentEngine defined?', typeof RmPaymentEngine !== 'undefined');

                    // Check if RmPaymentEngine is available
                    if (typeof RmPaymentEngine === 'undefined') {
                        console.error('✗ RmPaymentEngine is not defined after script load');
                        observer.error({
                            success: false,
                            message: 'Payment engine not available. Please refresh and try again.'
                        });
                        return;
                    }

                    try {
                        const reference = this.generateReference();
                        console.log('📋 Generated payment reference:', reference);

                        const payload = {
                            publicKey: this.remitaConfig.publicKey,
                            amount: paymentRequest.amount,
                            email: paymentRequest.customerEmail,
                            fullname: paymentRequest.customerName,
                            merchantId: this.remitaConfig.merchantId,
                            serviceTypeId: this.remitaConfig.serviceTypeId,
                            orderId: reference,
                            description: paymentRequest.description,
                            onSuccess: (response: any) => {
                                console.log('✓ Remita payment successful:', response);
                                observer.next({
                                    success: true,
                                    message: 'Payment completed successfully',
                                    reference: reference,
                                    remitaReference: response.reference || response.RRR,
                                    amount: paymentRequest.amount,
                                    status: 'success'
                                });
                                observer.complete();
                            },
                            onError: (response: any) => {
                                console.error('✗ Remita payment error:', response);
                                observer.error({
                                    success: false,
                                    message: response.message || 'Payment failed',
                                    reference: reference
                                });
                            },
                            onClose: () => {
                                console.log('⚠ Remita payment window closed by user');
                                observer.error({
                                    success: false,
                                    message: 'Payment cancelled by user',
                                    reference: reference
                                });
                            }
                        };

                        console.log('📤 Showing Remita payment engine with payload:', payload);
                        // Trigger Remita payment
                        RmPaymentEngine.showPaymentEngine(payload);
                    } catch (error) {
                        console.error('✗ Error calling RmPaymentEngine.showPaymentEngine:', error);
                        observer.error({
                            success: false,
                            message: 'Error initiating payment: ' + (error instanceof Error ? error.message : 'Unknown error')
                        });
                    }
                })
                .catch((error) => {
                    console.error('✗ Error ensuring script loaded:', error);
                    observer.error({
                        success: false,
                        message: 'Failed to load payment engine: ' + (error instanceof Error ? error.message : 'Unknown error')
                    });
                });
        });
    }

    /**
     * Pay an existing RRR using Remita inline payment widget
     */
    payWithRrr(rrr: string): Observable<any> {
        console.log('🔄 Opening Remita inline payment for RRR:', rrr);

        return new Observable((observer) => {
            this.ensureScriptLoaded()
                .then(() => {
                    if (typeof RmPaymentEngine === 'undefined') {
                        console.error('✗ RmPaymentEngine is not defined after script load');
                        observer.error({
                            success: false,
                            message: 'Payment engine not available. Please refresh and try again.'
                        });
                        return;
                    }

                    try {
                        const transactionId = Math.floor(Math.random() * 1101233);

                        const paymentEngine = RmPaymentEngine.init({
                            key: this.remitaConfig.publicKey,
                            processRrr: true,
                            transactionId: transactionId,
                            extendedData: {
                                customFields: [
                                    {
                                        name: "rrr",
                                        value: rrr
                                    }
                                ]
                            },
                            onSuccess: (response: any) => {
                                console.log('✓ Remita RRR payment successful:', response);
                                observer.next({
                                    success: true,
                                    message: 'Payment completed successfully',
                                    rrr: rrr,
                                    response: response
                                });
                                observer.complete();
                            },
                            onError: (response: any) => {
                                console.error('✗ Remita RRR payment error:', response);
                                observer.error({
                                    success: false,
                                    message: response.message || 'Payment failed',
                                    rrr: rrr
                                });
                            },
                            onClose: () => {
                                console.log('⚠ Remita payment widget closed by user');
                                observer.error({
                                    success: false,
                                    message: 'Payment cancelled by user',
                                    rrr: rrr
                                });
                            }
                        });

                        paymentEngine.showPaymentWidget();
                    } catch (error) {
                        console.error('✗ Error calling RmPaymentEngine.init:', error);
                        observer.error({
                            success: false,
                            message: 'Error initiating payment: ' + (error instanceof Error ? error.message : 'Unknown error')
                        });
                    }
                })
                .catch((error) => {
                    console.error('✗ Error ensuring script loaded:', error);
                    observer.error({
                        success: false,
                        message: 'Failed to load payment engine: ' + (error instanceof Error ? error.message : 'Unknown error')
                    });
                });
        });
    }

    /**
     * Verify payment status with backend
     */
    verifyPayment(reference: string): Observable<any> {
        console.log('🔍 Verifying payment with reference:', reference);
        // This would call your backend API to verify the payment
        // The backend would use the Remita API to verify
        return new Observable((observer) => {
            observer.next({
                success: true,
                message: 'Payment verification pending',
                reference: reference
            });
            observer.complete();
        });
    }

    /**
     * Get Remita configuration
     */
    getConfig(): typeof environment.remita {
        return this.remitaConfig;
    }

    /**
     * Check if script is loaded
     */
    isScriptReady(): boolean {
        return this.isScriptLoaded && typeof RmPaymentEngine !== 'undefined';
    }

    /**
     * Debug helper to check Remita configuration and script status
     */
    debugRemitaStatus(): void {
        console.log('========== REMITA DEBUG INFO ==========');
        console.log('Configuration:', this.remitaConfig);
        console.log('Script Loaded?', this.isScriptLoaded);
        console.log('Script Loading?', this.isScriptLoading);
        console.log('RmPaymentEngine defined?', typeof RmPaymentEngine !== 'undefined');
        console.log('Script in DOM?', !!document.getElementById('remita-script'));
        console.log('Alternative scripts in DOM?', document.querySelectorAll('[id^="remita-script"]').length);
        console.log('========================================');
    }
}
