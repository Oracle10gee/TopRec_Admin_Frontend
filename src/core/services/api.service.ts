import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse, PaginatedResponse, PaginationParams } from '../models/api.model';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private readonly apiUrl = environment.apiUrl;
    private readonly apiVersion = environment.apiVersion;

    constructor(private http: HttpClient) { }

    /**
     * Get request
     */
    get<T = any>(endpoint: string, options?: any): Observable<any> {
        return this.http.get<any>(
            this.buildUrl(endpoint),
            options
        );
    }

    /**
     * Get paginated request
     */
    getPaginated<T = any>(
        endpoint: string,
        params: PaginationParams
    ): Observable<any> {
        let httpParams = new HttpParams()
            .set('page', params.page)
            .set('limit', params.limit);

        if (params.sortBy) {
            httpParams = httpParams.set('sortBy', params.sortBy);
        }
        if (params.sortOrder) {
            httpParams = httpParams.set('sortOrder', params.sortOrder);
        }

        return this.http.get<any>(
            this.buildUrl(endpoint),
            { params: httpParams }
        );
    }

    /**
     * Post request
     */
    post<T = any>(endpoint: string, body: any, options?: any): Observable<any> {
        return this.http.post<any>(
            this.buildUrl(endpoint),
            body,
            options
        );
    }

    /**
     * Put request
     */
    put<T = any>(endpoint: string, body: any, options?: any): Observable<any> {
        return this.http.put<any>(
            this.buildUrl(endpoint),
            body,
            options
        );
    }

    /**
     * Patch request
     */
    patch<T = any>(endpoint: string, body: any, options?: any): Observable<any> {
        return this.http.patch<any>(
            this.buildUrl(endpoint),
            body,
            options
        );
    }

    /**
     * Delete request
     */
    delete<T = any>(endpoint: string, options?: any): Observable<any> {
        return this.http.delete<any>(
            this.buildUrl(endpoint),
            options
        );
    }

    /**
     * Build complete URL with base and version
     */
    private buildUrl(endpoint: string): string {
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        return `${this.apiUrl}/${this.apiVersion}${cleanEndpoint}`;
    }
}
