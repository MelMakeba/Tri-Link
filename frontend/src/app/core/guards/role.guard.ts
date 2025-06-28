import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { Injectable } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
    constructor(
        private authService: AuthService,
        private router: Router
    ) {}

    canActivate(route: ActivatedRouteSnapshot): boolean {
        const expectedRoles = route.data['expectedRoles'] as UserRole[];

        if (!this.authService.isAuthenticated()) {
            this.router.navigate(['/login']);
            return false;
        }

        if (!expectedRoles || this.authService.hasAnyRole(expectedRoles)) {
            return true;
        }
        const user = this.authService.getCurrentUser();
    if (user) {
      switch (user.role) {
        case UserRole.ADMIN:
          this.router.navigate(['/admin/dashboard']);
          break;
        case UserRole.AGENT:
          this.router.navigate(['/agent/dashboard']);
          break;
        case UserRole.CUSTOMER:
          this.router.navigate(['/customer/dashboard']);
          break;
      }
    }
    
    return false;
  }

        
    }