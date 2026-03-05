import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { TopbarComponent } from './components/topbar/topbar.component';
import { SessionTimeoutService } from '../../core/services/session-timeout.service';

@Component({
    standalone: true,
    selector: 'app-dashboard',
    imports: [CommonModule, RouterModule, SidebarComponent, TopbarComponent],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
    sidebarOpen = true;
    isMobile = false;

    constructor(
        private router: Router,
        public sessionTimeout: SessionTimeoutService
    ) {
        // Check if mobile
        this.checkIfMobile();
        window.addEventListener('resize', () => this.checkIfMobile());
    }

    ngOnInit(): void {
        // Start idle-session monitoring for authenticated users
        this.sessionTimeout.start();
    }

    ngOnDestroy(): void {
        // Stop monitoring when dashboard is torn down (user logs out / navigates away)
        this.sessionTimeout.stop();
    }

    checkIfMobile(): void {
        this.isMobile = window.innerWidth < 768;
        if (this.isMobile) {
            this.sidebarOpen = false;
        }
    }

    toggleSidebar(): void {
        this.sidebarOpen = !this.sidebarOpen;
    }

    closeSidebar(): void {
        if (this.isMobile) {
            this.sidebarOpen = false;
        }
    }
}
