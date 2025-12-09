# API Integration Guide

## Overview

This guide explains how to integrate your APIs once they're ready.

## Setting Environment Variables

### Development (.env)

```
API_URL=http://localhost:3000/api
API_VERSION=v1
AUTH_TOKEN_KEY=auth_token
REFRESH_TOKEN_KEY=refresh_token
APP_NAME=Toprec Admin Dashboard
APP_ENVIRONMENT=development
```

### Production (.env.production)

```
API_URL=https://api.toprec.com/api
API_VERSION=v1
AUTH_TOKEN_KEY=auth_token
REFRESH_TOKEN_KEY=refresh_token
APP_NAME=Toprec Admin Dashboard
APP_ENVIRONMENT=production
```

## API Endpoints Expected

### Authentication Endpoints

#### 1. Login

- **Endpoint**: `POST /auth/login`
- **Request**:

```typescript
{
  email: string;
  password: string;
}
```

- **Response**:

```typescript
{
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      avatar?: string;
      role: 'admin' | 'manager' | 'user';
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    };
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
  };
  statusCode: number;
  timestamp: string;
}
```

#### 2. SignUp

- **Endpoint**: `POST /auth/signup`
- **Request**:

```typescript
{
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}
```

- **Response**: Same as Login

#### 3. Refresh Token

- **Endpoint**: `POST /auth/refresh`
- **Request**:

```typescript
{
  refreshToken: string;
}
```

- **Response**: Same as Login

#### 4. Change Password

- **Endpoint**: `POST /auth/change-password`
- **Request**:

```typescript
{
  currentPassword: string;
  newPassword: string;
}
```

- **Response**:

```typescript
{
  success: boolean;
  message: string;
  data: string; // Success message
  statusCode: number;
  timestamp: string;
}
```

#### 5. Forgot Password

- **Endpoint**: `POST /auth/forgot-password`
- **Request**:

```typescript
{
  email: string;
}
```

- **Response**: Same as Change Password

#### 6. Reset Password

- **Endpoint**: `POST /auth/reset-password`
- **Request**:

```typescript
{
  token: string;
  newPassword: string;
}
```

- **Response**: Same as Change Password

## Using ApiService

### Basic Usage

```typescript
import { ApiService } from "../core/services/api.service";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class UserService {
  constructor(private apiService: ApiService) {}

  getUsers() {
    return this.apiService.get<User[]>("/users");
  }

  getUserById(id: string) {
    return this.apiService.get<User>(`/users/${id}`);
  }

  createUser(data: CreateUserRequest) {
    return this.apiService.post<User>("/users", data);
  }

  updateUser(id: string, data: UpdateUserRequest) {
    return this.apiService.put<User>(`/users/${id}`, data);
  }

  deleteUser(id: string) {
    return this.apiService.delete<void>(`/users/${id}`);
  }
}
```

### Using in Components

```typescript
import { Component, OnInit } from "@angular/core";
import { UserService } from "./services/user.service";

@Component({
  selector: "app-users",
  templateUrl: "./users.component.html",
})
export class UsersComponent implements OnInit {
  users$ = this.userService.getUsers();

  constructor(private userService: UserService) {}
}
```

## Authentication Flow

### 1. Login Flow

```typescript
// In your Login Component
login(credentials: LoginRequest) {
  this.authService.login(credentials).subscribe(
    (response) => {
      // User is now authenticated
      // Navigate to dashboard
      this.router.navigate(['/dashboard']);
    },
    (error) => {
      // Handle error
      console.error(error);
    }
  );
}
```

### 2. Token Management

- Tokens are automatically stored in localStorage
- AuthInterceptor automatically adds Authorization header
- Automatic token refresh happens 5 minutes before expiry
- 401 errors trigger token refresh or logout

### 3. Logout Flow

```typescript
logout() {
  this.authService.logout();
  this.router.navigate(['/auth/login']);
}
```

## Adding New Services

### Example: Creating a Dashboard Service

```typescript
// src/features/dashboard/services/dashboard.service.ts
import { Injectable } from "@angular/core";
import { ApiService } from "../../../core/services/api.service";

@Injectable({
  providedIn: "root",
})
export class DashboardService {
  constructor(private apiService: ApiService) {}

  getStats() {
    return this.apiService.get("/dashboard/stats");
  }

  getRecentActivities() {
    return this.apiService.get("/dashboard/activities");
  }
}
```

### Using the Service in Component

```typescript
import { Component, OnInit } from "@angular/core";
import { DashboardService } from "./services/dashboard.service";

@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html",
})
export class DashboardComponent implements OnInit {
  stats$ = this.dashboardService.getStats();
  activities$ = this.dashboardService.getRecentActivities();

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    // No need to do anything - we're using async pipe
  }
}
```

## Error Handling

### Global Error Handling

Errors are automatically caught by ErrorInterceptor:

```typescript
// In component
this.apiService.get("/endpoint").subscribe(
  (response) => {
    // Handle success
  },
  (error) => {
    // Error is already logged to console
    // You can also handle it locally
    this.showErrorMessage(error.message);
  }
);
```

### Custom Error Handling

```typescript
import { catchError } from 'rxjs/operators';

getUsers() {
  return this.apiService.get<User[]>('/users').pipe(
    catchError((error) => {
      console.error('Failed to fetch users:', error);
      return of([]); // Return default value on error
    })
  );
}
```

## Type Safety

All API responses are strongly typed:

```typescript
// Response is typed as ApiResponse<User[]>
this.apiService.get<User[]>("/users").subscribe((response) => {
  // response.data is User[]
  // response.success is boolean
  // response.message is string
  // etc.
});
```

## Testing

### Mock ApiService for Tests

```typescript
import { TestBed } from "@angular/core/testing";
import { UserService } from "./user.service";
import { ApiService } from "../core/services/api.service";
import { of } from "rxjs";

describe("UserService", () => {
  let service: UserService;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj("ApiService", ["get", "post"]);

    TestBed.configureTestingModule({
      providers: [UserService, { provide: ApiService, useValue: apiServiceSpy }],
    });

    service = TestBed.inject(UserService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  it("should fetch users", () => {
    const mockUsers = [{ id: "1", email: "user@example.com" }];
    apiService.get.and.returnValue(of({ data: mockUsers }));

    service.getUsers().subscribe((response) => {
      expect(response.data).toEqual(mockUsers);
    });
  });
});
```

## Common Patterns

### Pagination

```typescript
// In service
getUsers(page: number = 1, limit: number = 10) {
  return this.apiService.getPaginated<User>('/users', { page, limit });
}

// In component
ngOnInit() {
  this.apiService.getPaginated<User>('/users', {
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  }).subscribe((response) => {
    this.users = response.data.data;
    this.pagination = response.data.pagination;
  });
}
```

### Search and Filter

```typescript
search(query: string) {
  return this.apiService.get<User[]>(`/users?search=${query}`);
}
```

## Debugging

### Check Token in Console

```typescript
// In browser console
localStorage.getItem("auth_token");
```

### Monitor Network Requests

1. Open Developer Tools (F12)
2. Go to Network tab
3. Look for API requests
4. Check headers for Authorization token

### Check Auth State

```typescript
// In component
constructor(private authService: AuthService) {
  this.authService.isAuthenticated$.subscribe(isAuth => {
    console.log('Is authenticated:', isAuth);
  });

  this.authService.currentUser$.subscribe(user => {
    console.log('Current user:', user);
  });
}
```
