# Toprec Admin Dashboard - Project Structure Guide

## Overview

This is a clean, scalable Angular admin dashboard project with authentication, built with Tailwind CSS and following Angular best practices.

## Folder Structure

```
src/
├── app/                          # Main app component and routing
│   ├── app.component.*          # Root component
│   ├── app.config.ts            # App configuration with providers
│   ├── app.routes.ts            # Main routing configuration
│   └── app.module.ts            # App module (if needed)
│
├── core/                         # Core module - singleton services, guards, interceptors
│   ├── services/                # Core services (API, Auth shared logic)
│   │   ├── api.service.ts       # HTTP API wrapper service
│   │   └── ...
│   ├── guards/                  # Route guards
│   │   ├── auth.guard.ts        # Protects authenticated routes
│   │   ├── no-auth.guard.ts     # Protects public routes
│   │   └── ...
│   ├── interceptors/            # HTTP interceptors
│   │   ├── auth.interceptor.ts  # Adds auth headers & handles 401
│   │   ├── error.interceptor.ts # Global error handling
│   │   └── ...
│   └── models/                  # Shared data models/interfaces
│       ├── api.model.ts         # API response interfaces
│       ├── auth.model.ts        # Auth-related models
│       └── ...
│
├── features/                     # Feature modules
│   ├── auth/                     # Authentication module
│   │   ├── pages/               # Page components (Login, SignUp, etc.)
│   │   ├── components/          # Feature-specific components
│   │   ├── services/            # Feature-specific services
│   │   ├── auth.module.ts       # Module declaration
│   │   ├── auth-routing.module.ts
│   │   └── ...
│   └── dashboard/               # Dashboard module
│       ├── pages/               # Page components (Dashboard, etc.)
│       ├── components/          # Dashboard components (Sidebar, etc.)
│       ├── dashboard.module.ts  # Module declaration
│       ├── dashboard-routing.module.ts
│       └── ...
│
├── shared/                       # Shared components, pipes, directives
│   ├── components/              # Reusable components (Button, Input, etc.)
│   ├── pipes/                   # Custom pipes
│   ├── directives/              # Custom directives
│   ├── utils/                   # Utility functions
│   │   ├── common.utils.ts      # Common utilities
│   │   ├── storage.utils.ts     # Local/session storage helpers
│   │   └── ...
│   └── shared.module.ts         # Shared module
│
├── environments/                 # Environment configurations
│   ├── environment.ts           # Development environment
│   ├── environment.prod.ts      # Production environment
│   └── ...
│
├── index.html                    # Main HTML
├── main.ts                       # Application entry point
└── styles.css                    # Global styles with Tailwind

root/
├── tailwind.config.js            # Tailwind CSS configuration
├── postcss.config.js             # PostCSS configuration
├── .env.example                  # Environment variables example
├── tsconfig.json                 # TypeScript configuration
├── angular.json                  # Angular CLI configuration
└── package.json                  # Dependencies
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

- Copy `.env.example` to `.env`
- Update with your API endpoints and configuration

### 3. Tailwind CSS

Already configured. Styles are in `src/styles.css` and `tailwind.config.js`

### 4. Running the Application

```bash
npm start
# or
ng serve
```

## Architecture Highlights

### Core Module

- **Singleton Services**: API, Auth, etc.
- **Guards**: Protect routes based on authentication
- **Interceptors**: Add auth headers, handle errors globally
- **Models**: Shared data interfaces

### Feature Modules

- **Auth Module**: Login, SignUp, Password Reset
- **Dashboard Module**: Main dashboard functionality
- Lazy-loaded for better performance

### Shared Module

- Reusable components, pipes, directives
- Common utilities and helpers

## API Integration

### ApiService

Generic HTTP service that handles all API calls:

```typescript
// GET request
this.apiService.get<User>("/users/profile");

// POST request
this.apiService.post<AuthResponse>("/auth/login", credentials);

// PUT request
this.apiService.put<User>("/users/profile", updatedUser);

// DELETE request
this.apiService.delete<void>("/users/1");

// Paginated request
this.apiService.getPaginated<User>("/users", { page: 1, limit: 10 });
```

### AuthService

Handles authentication:

```typescript
// Login
authService.login(credentials).subscribe(...)

// SignUp
authService.signUp(data).subscribe(...)

// Logout
authService.logout()

// Check if authenticated
authService.isAuthenticated()

// Get current user
authService.getCurrentUser().subscribe(...)
```

### HTTP Interceptors

1. **AuthInterceptor**:

   - Adds Authorization header to all requests
   - Handles 401 errors with token refresh

2. **ErrorInterceptor**:
   - Global error handling
   - Logs errors to console

## Environment Variables

### Required Variables

```
API_URL=http://localhost:3000/api
API_VERSION=v1
AUTH_TOKEN_KEY=auth_token
REFRESH_TOKEN_KEY=refresh_token
APP_NAME=Toprec Admin Dashboard
APP_ENVIRONMENT=development
```

## Styling with Tailwind

### Global Classes (in `src/styles.css`)

```css
.btn-primary     /* Primary button */
/* Primary button */
.btn-secondary   /* Secondary button */
.card            /* Card container */
.input-field; /* Form input */
```

### Custom Colors (in `tailwind.config.js`)

```
primary:   #1F2937
secondary: #6B7280
accent:    #3B82F6
success:   #10B981
error:     #EF4444
warning:   #F59E0B
```

## Adding New Features

### 1. Create a new feature module

```bash
ng generate module features/new-feature
```

### 2. Create components

```bash
ng generate component features/new-feature/pages/main
ng generate component features/new-feature/components/sub-component
```

### 3. Create routing

```typescript
// In new-feature-routing.module.ts
const routes: Routes = [
  {
    path: '',
    component: MainComponent,
    children: [...]
  }
];
```

### 4. Register in app.routes.ts

```typescript
{
  path: 'feature',
  canActivate: [AuthGuard],
  loadChildren: () => import('../features/new-feature/new-feature.module').then(m => m.NewFeatureModule),
}
```

## Best Practices

1. **Services**: Keep logic in services, components just for presentation
2. **Data Binding**: Use OnPush change detection for performance
3. **Error Handling**: Use ErrorInterceptor for global handling
4. **Security**: Always validate user input, use strong auth tokens
5. **Styling**: Use Tailwind utilities, avoid custom CSS
6. **Lazy Loading**: Load feature modules on demand
7. **Unsubscribe**: Always unsubscribe from observables (use async pipe or takeUntil)

## Next Steps

1. Create Login and SignUp pages based on UI designs
2. Create Dashboard main page and components
3. Add more feature modules as needed
4. Configure API endpoints in `.env` when available
5. Add unit tests for services and components
