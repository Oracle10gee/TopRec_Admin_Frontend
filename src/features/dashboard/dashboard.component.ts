import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { TopbarComponent } from './components/topbar/topbar.component';

@Component({
    standalone: true,
    selector: 'app-dashboard',
    imports: [CommonModule, RouterModule, SidebarComponent, TopbarComponent],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
    sidebarOpen = true;
    isMobile = false;

    constructor(private router: Router) {
        // Check if mobile
        this.checkIfMobile();
        window.addEventListener('resize', () => this.checkIfMobile());
    }

    ngOnInit(): void {
        // Initialize dashboard
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
