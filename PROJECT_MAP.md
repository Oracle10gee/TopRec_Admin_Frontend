# 🗺️ Toprec Admin Dashboard - Visual Project Map

## Project Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    ANGULAR APP (Main)                        │
│                   app.component.ts/html                      │
│                    app.routes.ts                             │
│                    app.config.ts                             │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        v            v            v
    ┌────────┐  ┌─────────┐  ┌──────────┐
    │  /auth │  │ /dash   │  │ /shared  │
    │  Lazy  │  │ Lazy    │  │ Shared   │
    │Loaded  │  │Loaded   │  │Services  │
    └────┬───┘  └────┬────┘  └──────────┘
         │           │
         v           v
    ┌─────────────┐  ┌──────────────┐
    │ AUTH MODULE │  │ DASHBOARD    │
    │ & FEATURES  │  │ MODULE       │
    └─────────────┘  └──────────────┘
```

## Data Flow Architecture

```
                    ┌─────────────────┐
                    │  User Browser   │
                    └────────┬────────┘
                             │
                      ┌──────v──────┐
                      │  Component  │
                      │  (Login,    │
                      │  Dashboard) │
                      └──────┬──────┘
                             │
                      ┌──────v──────┐
                      │  Service    │
                      │ (AuthSvc,   │
                      │  UserSvc)   │
                      └──────┬──────┘
                             │
                      ┌──────v──────┐
                      │ ApiService  │
                      │   (GET, POST)
                      └──────┬──────┘
                             │
              ┌──────────────v────────────────┐
              │  HTTP Interceptors            │
              │  - Auth Interceptor           │
              │  - Error Interceptor          │
              └──────────────┬─────────────────┘
                             │
                      ┌──────v──────┐
                      │   Backend   │
                      │    API      │
                      └─────────────┘
```

## Feature Module Structure

```
┌─ AUTH FEATURE ─────────────────────────────────────┐
│                                                    │
│  Pages/                                           │
│  ├── login/               → Login page            │
│  └── signup/              → SignUp page           │
│                                                   │
│  Components/                                      │
│  ├── login-form/          → Form component       │
│  ├── signup-form/         → Form component       │
│  └── password-reset/      → Reset component      │
│                                                   │
│  Services/                                        │
│  └── auth.service.ts      → Auth logic           │
│                                                   │
│  auth.module.ts                                   │
│  auth-routing.module.ts                          │
│                                                   │
└────────────────────────────────────────────────────┘

┌─ DASHBOARD FEATURE ────────────────────────────────┐
│                                                    │
│  Pages/                                           │
│  ├── main/                → Main dashboard       │
│  └── [other pages]/       → Additional pages     │
│                                                   │
│  Components/                                      │
│  ├── sidebar/             → Navigation sidebar   │
│  ├── navbar/              → Top navigation       │
│  ├── stats-card/          → Stat card widget     │
│  └── [other components]/  → Reusable widgets    │
│                                                   │
│  dashboard.module.ts                              │
│  dashboard-routing.module.ts                     │
│                                                   │
└────────────────────────────────────────────────────┘
```

## Core Layer Structure

```
┌─────────────────────────────────────────────┐
│           CORE MODULE (Singleton)            │
├─────────────────────────────────────────────┤
│                                             │
│  Services/                                  │
│  └── api.service.ts                         │
│      • Generic HTTP GET, POST, etc          │
│      • URL building                         │
│      • Pagination support                   │
│                                             │
│  Guards/                                    │
│  ├── auth.guard.ts                          │
│  │   → Only authenticated users             │
│  └── no-auth.guard.ts                       │
│      → Only unauthenticated users           │
│                                             │
│  Interceptors/                              │
│  ├── auth.interceptor.ts                    │
│  │   • Add auth headers                     │
│  │   • Handle 401 errors                    │
│  │   • Refresh tokens                       │
│  └── error.interceptor.ts                   │
│      • Global error handling                │
│      • Error logging                        │
│                                             │
│  Models/                                    │
│  ├── api.model.ts                           │
│  │   • ApiResponse interface                │
│  │   • PaginationParams interface           │
│  └── auth.model.ts                          │
│      • LoginRequest, SignUpRequest, etc     │
│      • User, AuthResponse, etc              │
│                                             │
└─────────────────────────────────────────────┘
```

## Shared Module Structure

```
┌──────────────────────────────────────────┐
│      SHARED MODULE (Multi-use)            │
├──────────────────────────────────────────┤
│                                          │
│  Components/                             │
│  ├── button/                             │
│  ├── modal/                              │
│  ├── loader/                             │
│  └── [other reusable components]/        │
│                                          │
│  Pipes/                                  │
│  ├── custom-pipe.pipe.ts                 │
│  └── [other pipes]/                      │
│                                          │
│  Directives/                             │
│  ├── custom-directive.directive.ts       │
│  └── [other directives]/                 │
│                                          │
│  Utils/                                  │
│  ├── common.utils.ts                     │
│  │   • formatDate, formatTime             │
│  │   • debounce, throttle                │
│  │   • isValidEmail, capitalize, etc      │
│  │                                        │
│  └── storage.utils.ts                    │
│      • localStorage helpers               │
│      • sessionStorage helpers             │
│                                          │
│  shared.module.ts (Export all)           │
│                                          │
└──────────────────────────────────────────┘
```

## Request Flow With Interceptors

```
Component
   │
   │ Makes HTTP Request
   │
   v
ApiService (api.service.get/post/etc)
   │
   │
   v
HttpClient
   │
   ├─── AuthInterceptor ───┐
   │                       │
   │  1. Add Auth Header   │
   │  2. Clone Request     │
   │                       │
   ├─── ErrorInterceptor──┐│
   │                      ││
   │  1. Log errors       ││
   │  2. Throw error      ││
   │                      ││
   v                      vv
Backend API
   │
   ├─ Success Response (200)
   │     └─→ Return to Component
   │
   └─ Error Response (401)
         └─→ AuthInterceptor catches
               └─→ Call RefreshToken
               └─→ Retry Request
               └─→ Return to Component
```

## Authentication State Management

```
┌─ User Not Authenticated ──────────────────────┐
│                                               │
│  User fills login form                        │
│           │                                   │
│           v                                   │
│  AuthService.login(credentials)              │
│           │                                   │
│           v                                   │
│  API Call to /auth/login                     │
│           │                                   │
│           v                                   │
│  ✓ Success: Token received                   │
│           │                                   │
│           v                                   │
│  Store tokens in localStorage                │
│  Update currentUserSubject                   │
│  Update isAuthenticatedSubject               │
│           │                                   │
│           v                                   │
│  ✓ User Authenticated                        │
│           │                                   │
│           v                                   │
│  Can access protected routes                │
│  All requests have auth header               │
│                                               │
└───────────────────────────────────────────────┘

┌─ Token Expiry Handling ───────────────────────┐
│                                               │
│  5 mins before token expiry                  │
│           │                                   │
│           v                                   │
│  Check token expiry time                     │
│           │                                   │
│           v                                   │
│  Call AuthService.refreshToken()             │
│           │                                   │
│           v                                   │
│  API Call to /auth/refresh                   │
│           │                                   │
│           v                                   │
│  Get new access token                        │
│  Store new token in localStorage             │
│           │                                   │
│           v                                   │
│  ✓ Token refreshed, user stays logged in     │
│                                               │
└───────────────────────────────────────────────┘
```

## Routing Structure

```
/
├── /auth (NoAuthGuard - public)
│   ├── /login          → LoginComponent
│   ├── /signup         → SignupComponent
│   ├── /forgot-password → ForgotPasswordComponent
│   └── /reset-password → ResetPasswordComponent
│
├── /dashboard (AuthGuard - protected)
│   ├── /               → DashboardMainComponent
│   ├── /users          → UsersComponent
│   ├── /settings       → SettingsComponent
│   └── /profile        → ProfileComponent
│
└── **                  → Redirect to /dashboard
```

## Service Dependency Injection

```
Components
    │
    ├─── AuthService
    │        │
    │        └─── ApiService
    │
    ├─── DashboardService
    │        │
    │        └─── ApiService
    │
    └─── UserService
             │
             └─── ApiService

All services injected at 'root' level
(Singleton pattern - one instance per app)
```

## TypeScript Type System

```
API Response:
┌────────────────────────────┐
│ ApiResponse<T>             │
├────────────────────────────┤
│ • success: boolean         │
│ • message: string          │
│ • data: T (Generic Type)   │
│ • statusCode: number       │
│ • timestamp: string        │
└────────────────────────────┘
         │
         └─→ T can be:
             • User
             • User[]
             • AuthResponse
             • Any type you define


Paginated Response:
┌──────────────────────────────┐
│ PaginatedResponse<T>         │
├──────────────────────────────┤
│ • data: T[]                  │
│ • pagination: {              │
│   - page: number             │
│   - limit: number            │
│   - total: number            │
│   - totalPages: number       │
│  }                           │
└──────────────────────────────┘
```

## Component Hierarchy (Example)

```
AppComponent
   │
   └─── RouterOutlet
            │
            ├─── Auth Feature Module
            │    └─── LoginComponent
            │         ├─── LoginFormComponent
            │         │    ├─── InputComponent
            │         │    └─── ButtonComponent
            │         └─── AuthService
            │
            └─── Dashboard Feature Module
                 └─── DashboardComponent
                      ├─── SidebarComponent
                      ├─── NavbarComponent
                      └─── MainContentComponent
                           ├─── StatsCardComponent
                           ├─── ChartComponent
                           └─── TableComponent
```

## Folder Organization Best Practices

```
✓ GOOD: Organized by Feature
features/
├── auth/
├── dashboard/
├── users/
└── reports/

✗ BAD: Organized by Type
components/
  ├── login/
  ├── navbar/
  ├── card/
  └── button/

services/
  ├── auth/
  ├── user/
  └── api/
```

## Development vs Production Build

```
Development (npm start):
├─ Source maps enabled    → Easy debugging
├─ Unminified code        → Readable code
├─ Watch mode enabled     → Auto-reload
└─ environment.ts loaded  → Dev API endpoints

Production (npm run build):
├─ Source maps disabled   → Smaller bundle
├─ Minified code          → Better performance
├─ AOT compilation        → Faster load
└─ environment.prod.ts loaded → Production APIs
```

---

This visual map helps understand:

- How files are organized
- How data flows through the app
- How authentication works
- How services interact
- How components are structured

**Print or bookmark this for reference during development!**
