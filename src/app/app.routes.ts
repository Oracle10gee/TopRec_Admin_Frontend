import { Routes } from '@angular/router';
import { AuthGuard } from '../core/guards/auth.guard';
import { NoAuthGuard } from '../core/guards/no-auth.guard';

export const routes: Routes = [
    {
        path: 'auth',
        canActivate: [NoAuthGuard],
        loadChildren: () => import('../features/auth/auth.module').then(m => m.AuthModule),
    },
    {
        path: 'dashboard',
        canActivate: [AuthGuard],
        loadChildren: () => import('../features/dashboard/dashboard.module').then(m => m.DashboardModule),
    },
    {
        path: '',
        redirectTo: 'auth/login',
        pathMatch: 'full',
    },
    {
        path: '**',
        redirectTo: 'dashboard',
    },
];
