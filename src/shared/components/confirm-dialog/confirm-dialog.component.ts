import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    standalone: true,
    selector: 'app-confirm-dialog',
    imports: [CommonModule],
    templateUrl: './confirm-dialog.component.html'
})
export class ConfirmDialogComponent {
    @Input() title: string = 'Confirm Delete';
    @Input() message: string = 'Are you sure you want to delete';
    @Input() itemName: string = '';
    @Input() confirmLabel: string = 'Delete';
    @Input() isDeleting: boolean = false;

    @Output() confirmed = new EventEmitter<void>();
    @Output() cancelled = new EventEmitter<void>();

    onConfirm(): void {
        this.confirmed.emit();
    }

    onCancel(): void {
        this.cancelled.emit();
    }
}
