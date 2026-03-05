import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * SessionTimeoutService
 *
 * Monitors user activity and automatically logs out after a period of
 * inactivity. A warning dialog is shown with a live countdown before logout.
 *
 * Timing:
 *   - After IDLE_TIME_MS (3 min) of no activity → show warning dialog
 *   - The dialog counts down WARNING_SECONDS (60 s)
 *   - Total idle time before forced logout: 4 minutes
 *
 * Usage:
 *   Inject into DashboardComponent, call start() on ngOnInit and stop() on
 *   ngOnDestroy. Bind showWarning$ and countdown$ in the dashboard template
 *   to display the warning modal.
 */
@Injectable({ providedIn: 'root' })
export class SessionTimeoutService implements OnDestroy {

    /** Idle time before showing the warning dialog (ms). */
    private readonly IDLE_TIME_MS = 3 * 60 * 1000; // 3 minutes

    /** How many seconds the countdown shows before forced logout. */
    private readonly WARNING_SECONDS = 60;

    /** Emits true when the warning dialog should be visible. */
    readonly showWarning$ = new BehaviorSubject<boolean>(false);

    /** Emits the current remaining seconds in the countdown. */
    readonly countdown$ = new BehaviorSubject<number>(60);

    private idleTimer?: ReturnType<typeof setTimeout>;
    private countdownInterval?: ReturnType<typeof setInterval>;
    private activityCleanupFns: Array<() => void> = [];
    private destroy$ = new Subject<void>();
    private running = false;

    constructor(
        private authService: AuthService,
        private router: Router,
        private ngZone: NgZone
    ) {}

    ngOnDestroy(): void {
        this.stop();
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Start idle monitoring. Call from the authenticated layout component
     * (DashboardComponent) ngOnInit so monitoring only runs while logged in.
     */
    start(): void {
        if (this.running) return;
        this.running = true;
        this.attachActivityListeners();
        this.resetIdleTimer();
    }

    /**
     * Stop monitoring and clean up all timers/listeners.
     * Call from DashboardComponent ngOnDestroy.
     */
    stop(): void {
        this.running = false;
        this.detachActivityListeners();
        this.clearAllTimers();
        this.showWarning$.next(false);
    }

    /**
     * Called when the user clicks "Stay Logged In" in the warning dialog.
     * Hides the dialog and resets the idle timer.
     */
    stayLoggedIn(): void {
        this.showWarning$.next(false);
        this.clearCountdownInterval();
        this.resetIdleTimer();
    }

    /**
     * Called when the countdown reaches zero or the user clicks "Logout Now".
     * Stops monitoring then performs logout and redirects to login.
     */
    forceLogout(): void {
        this.stop();
        this.authService.logout().subscribe({
            next: () => this.router.navigate(['/auth/login']),
            error: () => this.router.navigate(['/auth/login'])
        });
    }

    // ─── private helpers ────────────────────────────────────────────────────

    /**
     * Attach DOM activity listeners outside the Angular zone to avoid
     * triggering unnecessary change-detection cycles on every mouse move.
     */
    private attachActivityListeners(): void {
        const events = ['mousemove', 'keydown', 'mousedown', 'scroll', 'touchstart'];

        this.ngZone.runOutsideAngular(() => {
            events.forEach(eventName => {
                const handler = () => {
                    // Only reset the idle timer when the dialog is not showing
                    if (!this.showWarning$.value) {
                        this.ngZone.run(() => this.resetIdleTimer());
                    }
                };
                document.addEventListener(eventName, handler, { passive: true });
                this.activityCleanupFns.push(() =>
                    document.removeEventListener(eventName, handler)
                );
            });
        });
    }

    private detachActivityListeners(): void {
        this.activityCleanupFns.forEach(fn => fn());
        this.activityCleanupFns = [];
    }

    private resetIdleTimer(): void {
        clearTimeout(this.idleTimer);
        this.idleTimer = setTimeout(() => this.startWarningCountdown(), this.IDLE_TIME_MS);
    }

    private startWarningCountdown(): void {
        this.countdown$.next(this.WARNING_SECONDS);
        this.showWarning$.next(true);

        this.countdownInterval = setInterval(() => {
            const remaining = this.countdown$.value - 1;
            this.countdown$.next(remaining);
            if (remaining <= 0) {
                this.clearCountdownInterval();
                this.forceLogout();
            }
        }, 1000);
    }

    private clearCountdownInterval(): void {
        clearInterval(this.countdownInterval);
    }

    private clearAllTimers(): void {
        clearTimeout(this.idleTimer);
        this.clearCountdownInterval();
    }
}
