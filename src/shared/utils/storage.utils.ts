/**
 * Storage utility service for local and session storage operations
 */

export class StorageService {
    /**
     * Set item in localStorage
     */
    static setItem(key: string, value: any): void {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Error setting localStorage item:', error);
        }
    }

    /**
     * Get item from localStorage
     */
    static getItem<T>(key: string): T | null {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Error getting localStorage item:', error);
            return null;
        }
    }

    /**
     * Remove item from localStorage
     */
    static removeItem(key: string): void {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Error removing localStorage item:', error);
        }
    }

    /**
     * Clear all localStorage
     */
    static clear(): void {
        try {
            localStorage.clear();
        } catch (error) {
            console.error('Error clearing localStorage:', error);
        }
    }

    /**
     * Set item in sessionStorage
     */
    static setSessionItem(key: string, value: any): void {
        try {
            sessionStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Error setting sessionStorage item:', error);
        }
    }

    /**
     * Get item from sessionStorage
     */
    static getSessionItem<T>(key: string): T | null {
        try {
            const item = sessionStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Error getting sessionStorage item:', error);
            return null;
        }
    }

    /**
     * Remove item from sessionStorage
     */
    static removeSessionItem(key: string): void {
        try {
            sessionStorage.removeItem(key);
        } catch (error) {
            console.error('Error removing sessionStorage item:', error);
        }
    }

    /**
     * Clear all sessionStorage
     */
    static clearSession(): void {
        try {
            sessionStorage.clear();
        } catch (error) {
            console.error('Error clearing sessionStorage:', error);
        }
    }
}
