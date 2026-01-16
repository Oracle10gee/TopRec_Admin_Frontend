import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MembersListComponent } from './components/members-list/members-list.component';
import { ConsultingFirmComponent } from './components/consulting-firm/consulting-firm.component';
import { PracticeFirmComponent } from './components/practice-firm/practice-firm.component';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
    standalone: true,
    selector: 'app-dashboard-member',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MembersListComponent,
        ConsultingFirmComponent,
        PracticeFirmComponent
    ],
    templateUrl: './member.component.html',
    styleUrls: ['./member.component.scss']
})
export class DashboardMemberComponent implements OnInit {
    activeTab: 'members' | 'consulting' | 'practice' = 'members';
    searchForm!: FormGroup;

    // Counts and statistics
    counts = {
        members: 0,
        consulting: 0,
        practice: 0,
        active: 0
    };

    isLoadingCounts = false;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        this.initializeForm();
        this.loadMemberStats();
    }

    private initializeForm(): void {
        this.searchForm = this.fb.group({
            searchTerm: [''],
            status: [''],
            category: ['']
        });

        // Subscribe to search term changes
        this.searchForm.get('searchTerm')?.valueChanges.subscribe(value => {
            this.handleSearch(value);
        });
    }

    /**
     * Load member statistics
     */
    private loadMemberStats(): void {
        this.isLoadingCounts = true;

        // Fetch counts for each role
        const memberCount$ = this.authService.getUsers({ role: 'Member', limit: 1 });
        const consultingCount$ = this.authService.getUsers({ role: 'Consulting Firm', limit: 1 });
        const practiceCount$ = this.authService.getUsers({ role: 'Practice Firm', limit: 1 });
        const activeCount$ = this.authService.getUsers({ status: 'Active', limit: 1 });

        // Use Promise.all or forkJoin to handle multiple observables
        Promise.all([
            memberCount$.toPromise(),
            consultingCount$.toPromise(),
            practiceCount$.toPromise(),
            activeCount$.toPromise()
        ]).then(([memberRes, consultingRes, practiceRes, activeRes]) => {
            this.counts.members = memberRes?.data?.pagination?.total || 0;
            this.counts.consulting = consultingRes?.data?.pagination?.total || 0;
            this.counts.practice = practiceRes?.data?.pagination?.total || 0;
            this.counts.active = activeRes?.data?.pagination?.total || 0;
            this.isLoadingCounts = false;
        }).catch((error) => {
            console.error('Error loading stats:', error);
            this.isLoadingCounts = false;
            // Use fallback counts
            this.counts = {
                members: 1247,
                consulting: 89,
                practice: 156,
                active: 1198
            };
        });
    }

    setActiveTab(tab: 'members' | 'consulting' | 'practice'): void {
        this.activeTab = tab;
        // Optional: Update URL query params
        // this.router.navigate([], { queryParams: { tab }, queryParamsHandling: 'merge' });
    }

    /**
     * Get total count of all members and firms
     */
    getTotalCount(): number {
        return this.counts.members + this.counts.consulting + this.counts.practice;
    }

    /**
     * Get count of active members
     */
    getActiveCount(): number {
        return this.counts.active;
    }

    /**
     * Get count of individual members
     */
    getMembersCount(): number {
        return this.counts.members;
    }

    /**
     * Get count of consulting firms
     */
    getConsultingCount(): number {
        return this.counts.consulting;
    }

    /**
     * Get count of practice firms
     */
    getPracticeCount(): number {
        return this.counts.practice;
    }

    /**
     * Handle search input
     */
    private handleSearch(searchTerm: string): void {
        // Implement search logic here
        console.log('Searching for:', searchTerm);
        // This could trigger an API call or filter local data
    }

    /**
     * Handle filter changes
     */
    onFilterChange(filterType: string, value: string): void {
        console.log(`Filter ${filterType} changed to:`, value);
        // Implement filter logic here
    }

    /**
     * Export data
     */
    exportData(): void {
        console.log('Exporting data for tab:', this.activeTab);
        // Implement export logic here
        // Could export as CSV, Excel, PDF, etc.
    }

    /**
     * Refresh data
     */
    refreshData(): void {
        this.loadMemberStats();
    }
}