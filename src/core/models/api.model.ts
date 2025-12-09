export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    statusCode: number;
    timestamp: string;
}

export interface ApiErrorResponse {
    success: boolean;
    message: string;
    statusCode: number;
    errors?: Record<string, string[]>;
    timestamp: string;
}

export interface PaginationParams {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
