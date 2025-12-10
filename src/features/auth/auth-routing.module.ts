import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { SignUpComponent } from './pages/signup/signup.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';

const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => Promise.resolve(LoginComponent),
    },
    {
        path: 'signup',
        loadComponent: () => Promise.resolve(SignUpComponent),
    },
    {
        path: 'forgot-password',
        loadComponent: () => Promise.resolve(ForgotPasswordComponent),
    },
    {
        path: 'reset-password',
        loadComponent: () => Promise.resolve(ResetPasswordComponent),
    },
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class AuthRoutingModule { }
