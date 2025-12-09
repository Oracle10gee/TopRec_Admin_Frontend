import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { DashboardRoutingModule } from './dashboard-routing.module';

// Components will be added here as created

@NgModule({
    declarations: [
        // Dashboard components will be added here
    ],
    imports: [
        CommonModule,
        HttpClientModule,
        DashboardRoutingModule,
    ],
})
export class DashboardModule { }
