/**
 * Shared module that contains common components, pipes, and directives
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Import shared components, pipes, and directives here as they are created
// import { SomeComponent } from './components/some/some.component';
// import { SomePipe } from './pipes/some.pipe';
// import { SomeDirective } from './directives/some.directive';

const SHARED_COMPONENTS = [
    // Components will be added here
];

const SHARED_PIPES = [
    // Pipes will be added here
];

const SHARED_DIRECTIVES = [
    // Directives will be added here
];

@NgModule({
    declarations: [...SHARED_COMPONENTS, ...SHARED_PIPES, ...SHARED_DIRECTIVES],
    imports: [CommonModule],
    exports: [...SHARED_COMPONENTS, ...SHARED_PIPES, ...SHARED_DIRECTIVES],
})
export class SharedModule { }
