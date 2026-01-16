import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private notificationsSubject = new BehaviorSubject<Notification[]>([]);
    public notifications$ = this.notificationsSubject.asObservable();

    show(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration: number = 4000): void {
        const notification: Notification = {
            id: this.generateId(),
            type,
            message,
            duration
        };

        const current = this.notificationsSubject.value;
        this.notificationsSubject.next([...current, notification]);

        if (duration > 0) {
            setTimeout(() => {
                this.remove(notification.id);
            }, duration);
        }
    }

    success(message: string, duration?: number): void {
        this.show(message, 'success', duration);
    }

    error(message: string, duration?: number): void {
        this.show(message, 'error', duration || 5000);
    }

    warning(message: string, duration?: number): void {
        this.show(message, 'warning', duration);
    }

    info(message: string, duration?: number): void {
        this.show(message, 'info', duration);
    }

    remove(id: string): void {
        const current = this.notificationsSubject.value;
        this.notificationsSubject.next(current.filter(n => n.id !== id));
    }

    clear(): void {
        this.notificationsSubject.next([]);
    }

    private generateId(): string {
        return `notification-${Date.now()}-${Math.random()}`;
    }
}
