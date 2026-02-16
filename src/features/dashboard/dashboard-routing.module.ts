import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { DashboardHomeComponent } from './pages/home/home.component';
import { DashboardProfileComponent } from './pages/profile/profile.component';
import { DashboardLicenseComponent } from './pages/license/license.component';
import { DashboardPaymentsComponent } from './pages/payments/payments.component';
import { DashboardSettingsComponent } from './pages/settings/settings.component';
import { DashboardMemberComponent } from './pages/member/member.component';
import { PaymentReportComponent } from './pages/payment-report/payment-report.component';

const routes: Routes = [
    {
        path: '',
        component: DashboardComponent,
        children: [
            {
                path: 'home',
                component: DashboardHomeComponent
            },
            {
                path: 'profile',
                component: DashboardProfileComponent
            },
            {
                path: 'license',
                component: DashboardLicenseComponent
            },
            {
                path: 'member',
                component: DashboardMemberComponent
            },
            {
                path: 'payments',
                component: DashboardPaymentsComponent
            },
            {
                path: 'payment-report',
                component: PaymentReportComponent
            },
            {
                path: 'settings',
                component: DashboardSettingsComponent
            },
            {
                path: '',
                redirectTo: 'home',
                pathMatch: 'full'
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class DashboardRoutingModule { }
