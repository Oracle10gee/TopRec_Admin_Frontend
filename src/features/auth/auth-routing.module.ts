import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { SignUpComponent } from './pages/signup/signup.component';

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
