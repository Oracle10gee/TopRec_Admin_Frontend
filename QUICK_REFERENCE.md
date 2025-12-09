# Quick Reference Guide

## Common Commands

### Development

```bash
# Start development server
npm start
# or
ng serve

# Build for production
npm run build

# Run tests
npm test

# Watch mode for development
npm run watch
```

## Creating New Components

### Create Auth Component

```bash
ng generate component features/auth/pages/login
ng generate component features/auth/components/login-form
```

### Create Dashboard Component

```bash
ng generate component features/dashboard/pages/main
ng generate component features/dashboard/components/sidebar
ng generate component features/dashboard/components/navbar
```

### Create Shared Component

```bash
ng generate component shared/components/button
```

## Common Code Snippets

### Using AuthService

```typescript
import { AuthService } from '@core/auth/services/auth.service';

constructor(private authService: AuthService) {}

// Check if user is logged in
if (this.authService.isAuthenticated()) {
  // User is authenticated
}

// Get current user
this.authService.currentUser$.subscribe(user => {
  console.log('Current user:', user);
});

// Logout
this.logout() {
  this.authService.logout();
  this.router.navigate(['/auth/login']);
}
```

### Using ApiService

```typescript
import { ApiService } from '@core/services/api.service';

constructor(private apiService: ApiService) {}

// GET request
this.apiService.get<User>('/users/profile').subscribe(
  response => {
    const user = response.data;
    // Handle response
  },
  error => {
    // Handle error
  }
);

// POST request
this.apiService.post<AuthResponse>('/auth/login', credentials).subscribe(
  response => {
    // Handle success
  },
  error => {
    // Handle error
  }
);
```

### Creating a Service

```typescript
import { Injectable } from "@angular/core";
import { ApiService } from "@core/services/api.service";

@Injectable({
  providedIn: "root",
})
export class UserService {
  constructor(private apiService: ApiService) {}

  getUsers() {
    return this.apiService.get("/users");
  }

  getUserById(id: string) {
    return this.apiService.get(`/users/${id}`);
  }

  createUser(data: any) {
    return this.apiService.post("/users", data);
  }

  updateUser(id: string, data: any) {
    return this.apiService.put(`/users/${id}`, data);
  }

  deleteUser(id: string) {
    return this.apiService.delete(`/users/${id}`);
  }
}
```

### Using Reactive Forms

```typescript
import { FormBuilder, FormGroup, Validators } from "@angular/forms";

export class LoginComponent {
  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(6)]],
    });
  }

  submit() {
    if (this.form.valid) {
      this.authService.login(this.form.value).subscribe(
        () => {
          this.router.navigate(["/dashboard"]);
        },
        (error) => {
          console.error("Login failed:", error);
        }
      );
    }
  }
}
```

### Using Async Pipe

```typescript
// In component
users$ = this.userService.getUsers();

// In template
<div *ngFor="let user of users$ | async">
  {{ user.name }}
</div>
```

### Using Utility Functions

```typescript
import { debounce, throttle, formatDate, capitalize, isValidEmail } from '@shared/utils/common.utils';

// Format date
const formatted = formatDate(new Date()); // "December 8, 2024"

// Validate email
if (isValidEmail(email)) {
  // Valid email
}

// Capitalize string
const text = capitalize('hello'); // "Hello"

// Debounce search
const searchFn = debounce((query: string) => {
  this.userService.search(query).subscribe(...);
}, 300);

// Throttle scroll
const scrollFn = throttle(() => {
  // Handle scroll
}, 1000);
```

### Using Storage Utilities

```typescript
import { StorageService } from "@shared/utils/storage.utils";

// Set item
StorageService.setItem("user", { id: 1, name: "John" });

// Get item
const user = StorageService.getItem<User>("user");

// Remove item
StorageService.removeItem("user");

// Session storage
StorageService.setSessionItem("temp", value);
const temp = StorageService.getSessionItem("temp");
StorageService.removeSessionItem("temp");

// Clear all
StorageService.clear();
```

## Tailwind Common Classes

### Layout

```html
<!-- Flexbox -->
<div class="flex flex-col gap-4">
  <div class="flex-1">Item 1</div>
  <div class="flex-1">Item 2</div>
</div>

<!-- Grid -->
<div class="grid grid-cols-3 gap-4">
  <div>Col 1</div>
  <div>Col 2</div>
  <div>Col 3</div>
</div>
```

### Components

```html
<!-- Button -->
<button class="btn-primary">Primary Button</button>
<button class="btn-secondary">Secondary Button</button>

<!-- Card -->
<div class="card">
  <h2>Card Title</h2>
  <p>Card content</p>
</div>

<!-- Input -->
<input type="text" class="input-field" placeholder="Enter text" />
```

### Spacing

```html
<!-- Padding: p-{size} -->
<div class="p-4">Padded box</div>

<!-- Margin: m-{size} -->
<div class="m-4">Margin box</div>

<!-- Gap: gap-{size} -->
<div class="flex gap-4">Items</div>
```

### Colors

```html
<!-- Text color -->
<p class="text-primary">Primary text</p>
<p class="text-error">Error text</p>

<!-- Background -->
<div class="bg-success text-white p-4">Success message</div>

<!-- Border -->
<div class="border border-gray-300 p-4">Bordered box</div>
```

### Responsive

```html
<!-- Mobile first -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  <div>Col 1</div>
  <div>Col 2</div>
  <div>Col 3</div>
</div>

<!-- Hide on mobile -->
<div class="hidden md:block">Visible on medium screens and up</div>
```

## TypeScript Patterns

### Type-safe API responses

```typescript
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode: number;
  timestamp: string;
}

// Usage
const response: ApiResponse<User> = {
  success: true,
  message: "Success",
  data: { id: "1", name: "John" },
  statusCode: 200,
  timestamp: new Date().toISOString(),
};
```

### Union types for states

```typescript
type LoadingState = "idle" | "loading" | "success" | "error";

interface ComponentState {
  status: LoadingState;
  data?: any;
  error?: string;
}
```

### Discriminated unions for complex states

```typescript
type LoadingState = { status: "idle" } | { status: "loading" } | { status: "success"; data: User } | { status: "error"; error: string };
```

## Debugging Tips

### Log in console

```typescript
console.log("Value:", value);
console.table(array);
console.error("Error:", error);
console.warn("Warning:", warning);
```

### Breakpoints in DevTools

```typescript
// Open DevTools (F12), go to Sources tab
// Click line number to add breakpoint
// Code will pause when that line executes
debugger; // Manually pause execution
```

### Check auth state

```typescript
// In browser console
localStorage.getItem("auth_token");
localStorage.getItem("refresh_token");
```

### Monitor API calls

```typescript
// F12 → Network tab
// Look for XHR/Fetch requests
// Check request headers and response
```

## File Path Quick Reference

```
Services:
  Core: src/core/services/api.service.ts
  Auth: src/features/auth/services/auth.service.ts

Guards:
  src/core/guards/auth.guard.ts
  src/core/guards/no-auth.guard.ts

Interceptors:
  src/core/interceptors/auth.interceptor.ts
  src/core/interceptors/error.interceptor.ts

Models:
  src/core/models/api.model.ts
  src/core/models/auth.model.ts

Routing:
  src/app/app.routes.ts
  src/features/auth/auth-routing.module.ts
  src/features/dashboard/dashboard-routing.module.ts

Utilities:
  src/shared/utils/common.utils.ts
  src/shared/utils/storage.utils.ts

Styles:
  src/styles.css (Global)
  tailwind.config.js (Config)

Config:
  src/environments/environment.ts (Dev)
  src/environments/environment.prod.ts (Prod)
  .env.example (Env vars)
```

## Common Errors & Solutions

### Module not found

```typescript
// Make sure to import module in declaration
import { YourModule } from 'path/to/module';

@NgModule({
  imports: [YourModule]
})
```

### Observable not unsubscribed

```typescript
// Use async pipe (recommended)
{{ data$ | async }}

// Or use takeUntil
import { takeUntil } from 'rxjs/operators';

subscription = this.service.data$.pipe(
  takeUntil(this.destroy$)
).subscribe(...);

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

### CORS errors

```typescript
// Make sure API_URL in environment matches backend server
// Backend should have CORS enabled for your frontend URL
```

### Token expiry issues

```typescript
// AuthService automatically refreshes tokens
// If issues occur, check:
// 1. refreshToken endpoint exists
// 2. Token format is correct
// 3. Check server token expiry settings
```

## Environment Variables Cheat Sheet

```bash
# .env file
API_URL=http://localhost:3000/api        # Your API base URL
API_VERSION=v1                            # API version
AUTH_TOKEN_KEY=auth_token                 # localStorage key for access token
REFRESH_TOKEN_KEY=refresh_token           # localStorage key for refresh token
APP_NAME=Toprec Admin Dashboard           # App display name
APP_ENVIRONMENT=development               # Environment name
```

---

**Save this file as a bookmark for quick reference!**
