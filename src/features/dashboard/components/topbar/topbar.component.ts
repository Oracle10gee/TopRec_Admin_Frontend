import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
    standalone: true,
    selector: 'app-topbar',
    imports: [CommonModule],
    templateUrl: './topbar.component.html',
    styleUrls: ['./topbar.component.scss']
})
export class TopbarComponent implements OnInit {
    @Output() toggleMenu = new EventEmitter<void>();

    showUserMenu = false;
    showNotifications = false;

    // User data
    userInitials = '';
    userName = '';
    userEmail = '';
    userRole = '';

    // Page info
    pageTitle = 'Dashboard';
    currentPage = 'Home';

    // Notification count
    notificationCount = 0; // Example count

    constructor(private router: Router, private authService: AuthService) { }

    ngOnInit(): void {
        this.loadUserData();
        this.updatePageTitle();

        // Listen to route changes
        this.router.events
            .pipe(filter(event => event instanceof NavigationEnd))
            .subscribe(() => {
                this.updatePageTitle();
            });
    }

    /**
     * Load user data from auth service
     */
    private loadUserData(): void {
        try {
            this.userName = this.authService.getCurrentUserName();
            this.userRole = this.authService.getCurrentUserRole();

            // Try to get email from current user
            const user = this.authService['currentUserSubject']?.value;
            this.userEmail = user?.email || 'user@toprecng.org';

            // Generate initials
            const nameParts = this.userName.split(' ');
            if (nameParts.length >= 2) {
                this.userInitials = (nameParts[0][0] + nameParts[1][0]).toUpperCase();
            } else {
                this.userInitials = this.userName.substring(0, 2).toUpperCase();
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            this.userName = 'User';
            this.userEmail = 'user@toprecng.org';
            this.userRole = 'User';
            this.userInitials = 'US';
        }
    }

    /**
     * Update page title based on current route
     */
    private updatePageTitle(): void {
        const currentRoute = this.router.url;

        // Map routes to titles
        const routeTitles: { [key: string]: { title: string, page: string } } = {
            '/dashboard/home': { title: 'Dashboard', page: 'Home' },
            '/dashboard/profile': { title: 'Profile', page: 'My Profile' },
            '/dashboard/license': { title: 'License', page: 'License Management' },
            '/dashboard/payments': { title: 'Payments', page: 'Payment History' },
            '/dashboard/settings': { title: 'Settings', page: 'Account Settings' }
        };

        const routeInfo = routeTitles[currentRoute] || { title: 'Dashboard', page: 'Home' };
        this.pageTitle = routeInfo.title;
        this.currentPage = routeInfo.page;
    }

    /**
     * Toggle mobile menu
     */
    onToggleMenu(): void {
        this.toggleMenu.emit();
    }

    /**
     * Toggle user menu dropdown
     */
    toggleUserMenu(): void {
        this.showUserMenu = !this.showUserMenu;

        // Close notifications if open
        if (this.showUserMenu && this.showNotifications) {
            this.showNotifications = false;
        }
    }

    /**
     * Close user menu
     */
    closeUserMenu(): void {
        this.showUserMenu = false;
    }

    /**
     * Toggle notifications panel
     */
    toggleNotifications(): void {
        this.showNotifications = !this.showNotifications;

        // Close user menu if open
        if (this.showNotifications && this.showUserMenu) {
            this.showUserMenu = false;
        }
    }

    /**
     * Navigate to profile page
     */
    navigateToProfile(): void {
        this.router.navigate(['/dashboard/profile']);
    }

    /**
     * Navigate to settings page
     */
    navigateToSettings(): void {
        this.router.navigate(['/dashboard/settings']);
    }

    /**
     * Logout user
     */
    onLogout(): void {
        // Call logout API and navigate after it completes
        this.authService.logout().subscribe({
            next: () => {
                console.log('✅ Logout complete, navigating to login');
                this.closeUserMenu();
                this.router.navigate(['/auth/login']);
            },
            error: (error) => {
                console.error('❌ Logout error, still navigating to login:', error);
                this.closeUserMenu();
                this.router.navigate(['/auth/login']);
            }
        });
    }

    /**
     * Mark notification as read (placeholder)
     */
    markNotificationRead(notificationId: string): void {
        // Implement notification read logic
        console.log('Marking notification as read:', notificationId);
    }

    /**
     * Clear all notifications (placeholder)
     */
    clearAllNotifications(): void {
        this.notificationCount = 0;
        console.log('Clearing all notifications');
    }
}