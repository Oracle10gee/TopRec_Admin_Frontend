import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '../../../../core/services/auth.service';

interface MenuItem {
    id: string;
    label: string;
    icon: SafeHtml;
    route: string;
    badge?: number | string;
}

@Component({
    standalone: true,
    selector: 'app-sidebar',
    imports: [CommonModule, RouterLink, RouterLinkActive],
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
    @Input() isOpen = true;
    @Input() isMobile = false;
    @Output() toggleSidebar = new EventEmitter<void>();
    @Output() closeOnNavigate = new EventEmitter<void>();

    activeMenuItem: string = 'home';
    menuItems: MenuItem[] = [];

    // Heroicons SVG strings (outline style)
    private icons = {
        home: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" fill="none" stroke="currentColor"/>`,

        profile: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" fill="none" stroke="currentColor"/>`,

        license: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" fill="none" stroke="currentColor"/>`,

        payments: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" fill="none" stroke="currentColor"/>`,

        settings: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" fill="none" stroke="currentColor"/>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" fill="none" stroke="currentColor"/>`,

        dashboard: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 12a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" fill="none" stroke="currentColor"/>`,

        users: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" fill="none" stroke="currentColor"/>`,

        reports: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" fill="none" stroke="currentColor"/>`,

        member: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 6a3 3 0 11-6 0 3 3 0 016 0zM15 16a6 6 0 11-12 0 6 6 0 0112 0z" fill="none" stroke="currentColor"/>`
    };

    constructor(
        private router: Router,
        private sanitizer: DomSanitizer,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        this.initializeMenuItems();
        this.updateActiveMenuItem();

        // Subscribe to router events to update active menu item
        this.router.events.subscribe(() => {
            this.updateActiveMenuItem();
        });
    }

    private initializeMenuItems(): void {
        const allMenuItems = [
            {
                id: 'home',
                label: 'Home',
                icon: this.sanitizer.bypassSecurityTrustHtml(this.icons.home),
                route: '/dashboard/home'
            },
            {
                id: 'profile',
                label: 'Profile',
                icon: this.sanitizer.bypassSecurityTrustHtml(this.icons.profile),
                route: '/dashboard/profile'
            },
            {
                id: 'license',
                label: 'License',
                icon: this.sanitizer.bypassSecurityTrustHtml(this.icons.license),
                route: '/dashboard/license'
            },
            {
                id: 'member',
                label: 'Member',
                icon: this.sanitizer.bypassSecurityTrustHtml(this.icons.member),
                route: '/dashboard/member'
            },
            {
                id: 'payments',
                label: 'Payments',
                icon: this.sanitizer.bypassSecurityTrustHtml(this.icons.payments),
                route: '/dashboard/payments',
                badge: 3 // Example badge
            },
            {
                id: 'settings',
                label: 'Settings',
                icon: this.sanitizer.bypassSecurityTrustHtml(this.icons.settings),
                route: '/dashboard/settings'
            }
        ];

        // Filter menu items based on user role
        const userRole = this.authService.getCurrentUserRole();
        this.menuItems = allMenuItems.filter(item => {
            // Hide 'Member' item for 'Member' role
            if (userRole === 'Member' && item.id === 'member') {
                return false;
            }
            // Hide 'Profile' item for 'Superadmin' role
            if (userRole === 'Superadmin' && (item.id === 'profile' || item.id === 'license')) {
                return false;
            }
            return true;
        });
    }

    updateActiveMenuItem(): void {
        const currentRoute = this.router.url;
        const menuItem = this.menuItems.find(item => item.route === currentRoute);
        if (menuItem) {
            this.activeMenuItem = menuItem.id;
        }
    }

    onMenuItemClick(menuItem: MenuItem): void {
        this.activeMenuItem = menuItem.id;
        this.closeOnNavigate.emit();
    }

    getUserName(): string {
        const name = this.authService.getCurrentUserName();
        return name || 'User';
    }

    getUserRole(): string {
        const role = this.authService.getCurrentUserRole();
        return role || 'User';
    }

    getUserInitials(): string {
        const name = this.getUserName();
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    onLogout(): void {
        // Logout through auth service (which will show notification)
        this.authService.logout();
        // Navigate to login
        this.router.navigate(['/auth/login']);
    }
}