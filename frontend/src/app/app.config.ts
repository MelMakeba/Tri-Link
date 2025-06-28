import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { AuthInterceptor } from './core/interceptors/auth.interceptors';
import { Routes } from '@angular/router';
// import { MainLayoutComponent } from './layouts/main-layout/main-layout/main-layout.component';
// import { HomeComponent } from './features/home/home/home.component';
// import { authGuard } from './core/guards/auth/auth.guard';
// import { adminGuard } from './core/guards/auth/admin.guard';
// import { agentGuard } from './core/guards/auth/agent.guard'; // Create this guard
// import { customerGuard } from './core/guards/auth/customer.guard'; // Create this guard

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimations(),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ]
};

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', component: HomeComponent },

      // Auth routes
      { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(c => c.LoginComponent) },
      { path: 'register', loadComponent: () => import('./features/auth/register/register.component').then(c => c.RegisterComponent) },
      // { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(c => c.ForgotPasswordComponent) },
      // { path: 'reset-password', loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(c => c.ResetPasswordComponent) },

      // // Customer routes
      // {
      //   path: 'customer',
      //   canActivate: [customerGuard],
      //   children: [
      //     { path: 'dashboard', loadComponent: () => import('./features/dashboards/customer-dashboard/customer-dashboard.component').then(c => c.CustomerDashboardComponent) },
      //     { path: 'cars', loadComponent: () => import('./features/customer/cars/customer-cars.component').then(c => c.CustomerCarsComponent) },
      //     // Add more customer-specific routes here
      //   ]
      // },

      // // Agent routes
      // {
      //   path: 'agent',
      //   canActivate: [agentGuard],
      //   children: [
      //     { path: 'dashboard', loadComponent: () => import('./features/dashboards/agent-dashboard/agent-dashboard.component').then(c => c.AgentDashboardComponent) },
      //     { path: 'cars', loadComponent: () => import('./features/agent/cars/agent-cars.component').then(c => c.AgentCarsComponent) },
      //     // Add more agent-specific routes here
      //   ]
      // },

      // // Admin routes
      // {
      //   path: 'admin',
      //   canActivate: [adminGuard],
      //   children: [
      //     { path: 'dashboard', loadComponent: () => import('./features/dashboards/admin-dashboard/admin-dashboard.component').then(c => c.AdminDashboardComponent) },
      //     { path: 'manage-users', loadComponent: () => import('./features/admin/manage-users/manage-users.component').then(c => c.ManageUsersComponent) },
      //     { path: 'cars', loadComponent: () => import('./features/admin/cars/admin-cars.component').then(c => c.AdminCarsComponent) },
      //     // Add more admin-specific routes here
      //   ]
      // },

      { path: '**', redirectTo: '' }
    ]
  }
];