import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { AdminDashboardComponent } from './features/dashboard/admin-dashboard/admin-dashboard.component';
import { AgentDashboardComponent } from './features/dashboard/agent-dashboard/agent-dashboard.component';
import { CustomerDashboardComponent } from './features/dashboard/customer-dashboard/customer-dashboard.component';
import { CustomerLayoutComponent } from './layouts/customer-layout/customer-layout.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'auth/login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'auth/register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) },
  {
    path: 'auth/forgot-password',
    loadComponent: () => 
      import('./features/auth/forgot-password/forgot-password.component')
        .then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'auth/email-verification',
    loadComponent: () => 
      import('./features/auth/email-verification/email-verification.component')
        .then(m => m.EmailVerificationComponent)
  },
  {
    path: 'auth/reset-password',
    loadComponent: () => 
      import('./features/auth/reset-password/reset-password.component')
        .then(m => m.ResetPasswordComponent)
  },
  { path: 'home', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)},
  {path: 'admin/dashboard', component: AdminDashboardComponent, canActivate: [RoleGuard], data: {roles: 'ADMIN'}},
  { path: 'admin/bookings', loadComponent: () => import('./features/admin/bookings-list/bookings-list.component').then(m => m.BookingsListComponent), canActivate: [RoleGuard], data: {roles: 'ADMIN'} },
  { path: 'admin/users', loadComponent: () => import('./features/admin/users-list/users-list.component').then(m => m.UsersListComponent), canActivate: [RoleGuard], data: {roles: 'ADMIN'} },
  { path: 'admin/cars', loadComponent: () => import('./features/admin/cars-list/cars-list.component').then(m => m.CarsListComponent), canActivate: [RoleGuard], data: {roles: 'ADMIN'} },

  {path: 'agent/dashboard', component: AgentDashboardComponent, canActivate: [RoleGuard], data: {roles: 'AGENT'}},
  {path: 'agent/vehicles', loadComponent: () => import('./features/agent/vehicle-list/vehicle-list.component').then(m => m.VehicleListComponent), canActivate: [RoleGuard], data: {roles: 'AGENT'}},
  {
    path: 'agent/bookings',
    loadComponent: () => import('./features/agent/agent-bookings-list/agent-bookings-list.component')
      .then(m => m.AgentBookingsListComponent),
    canActivate: [AuthGuard],
    data: { roles: ['AGENT'] }
  },
  {path: 'customer/dashboard', component: CustomerDashboardComponent, canActivate: [RoleGuard], data: {roles: 'CUSTOMER'}},

  {path: 'profile', loadComponent: () => import('./shared/profile/profile-page/profile-page.component').then(m => m.ProfilePageComponent), canActivate: [AuthGuard]},

  {
    path: 'customer',
    component: CustomerLayoutComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['CUSTOMER'] },
    children: [
      {
        path: 'book',
        loadChildren: () => import('./features/bookings/bookings.module').then(m => m.BookingsModule)
      },
      {
        path: 'bookings',
        loadComponent: () => import('./features/bookings/my-bookings/my-bookings.component')
          .then(m => m.MyBookingsComponent)
      },
      {
        path: 'bookings/:id',
        loadComponent: () => import('./features/bookings/booking-details/booking-details.component')
          .then(m => m.BookingDetailsComponent)
      }
    ]
  },

  { path: '**', redirectTo: '/home' }
];
