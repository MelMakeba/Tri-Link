import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { User, LoginRequest, RegisterRequest, AuthResponse, UserRole } from '../models/user.model';
import { map } from 'rxjs';

// Additional interfaces for password reset functionality
export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  success: boolean;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword?: string;
}

export interface ResetPasswordResponse {
  message: string;
  success: boolean;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface VerifyEmailResponse {
  message: string;
  success: boolean;
  user?: User;
}

export interface ResendVerificationRequest {
  email?: string;
}

export interface ResendVerificationResponse {
  message: string;
  success: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:3000'; 
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);

  public currentUser$ = this.currentUserSubject.asObservable();
  public token$ = this.tokenSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadStoredAuth();
  }

  private loadStoredAuth(): void {
    const token = localStorage.getItem('access_token');
    const userString = localStorage.getItem('user');
    
    if (token && userString && userString !== 'undefined') {
      try {
        const user = JSON.parse(userString);
        this.tokenSubject.next(token);
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        this.clearStoredAuth();
      }
    }
  }

  private clearStoredAuth(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<any>(`${this.API_URL}/auth/login`, credentials)
      .pipe(
        map(response => ({
          user: response.data.user,
          accessToken: response.data.token,
          refreshToken: response.data.refreshToken
        })),
        tap(response => this.handleAuthSuccess(response)),
        catchError(this.handleError)
      );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<any>(`${this.API_URL}/auth/register`, userData)
      .pipe(
        map(response => ({
          user: response.data.user,
          accessToken: response.data.token,
          refreshToken: response.data.refreshToken
        })),
        tap(response => this.handleAuthSuccess(response)),
        catchError(this.handleError)
      );
  }

  // ============= PASSWORD RESET FUNCTIONALITY =============
  
  /**
   * Send forgot password email
   * @param email - User's email address
   * @returns Observable with success message
   */
  forgotPassword(email: string): Observable<ForgotPasswordResponse> {
    const request: ForgotPasswordRequest = { email };
    
    return this.http.post<any>(`${this.API_URL}/auth/forgot-password`, request)
      .pipe(
        map(response => ({
          message: response.message || 'Password reset instructions sent to your email.',
          success: response.success || true
        })),
        catchError(this.handleError)
      );
  }

  /**
   * Reset password using token
   * @param token - Reset token from email
   * @param password - New password
   * @returns Observable with success message
   */
  resetPassword(token: string, password: string): Observable<ResetPasswordResponse> {
    const request: ResetPasswordRequest = { token, password };
    
    return this.http.post<any>(`${this.API_URL}/auth/reset-password`, request)
      .pipe(
        map(response => ({
          message: response.message || 'Password has been reset successfully.',
          success: response.success || true
        })),
        catchError(this.handleError)
      );
  }

  /**
   * Validate reset token without resetting password
   * @param token - Reset token to validate
   * @returns Observable indicating if token is valid
   */
  // validateResetToken(token: string): Observable<{ valid: boolean; message?: string }> {
  //   return this.http.get<any>(`${this.API_URL}/auth/validate-reset-token/${token}`)
  //     .pipe(
  //       map(response => ({
  //         valid: response.valid || false,
  //         message: response.message
  //       })),
  //       catchError(error => {
  //         return throwError(() => ({
  //           valid: false,
  //           message: 'Invalid or expired reset token.'
  //         }));
  //       })
  //     );
  // }

  // ============= EMAIL VERIFICATION FUNCTIONALITY =============
  
  /**
   * Verify email using token
   * @param token - Verification token from email
   * @returns Observable with verification result
   */
  verifyEmail(token: string): Observable<VerifyEmailResponse> {
    return this.http.get<any>(`${this.API_URL}/auth/verify-email/${token}`)
      .pipe(
        map(response => ({
          message: response.message || 'Email verified successfully.',
          success: response.success || true,
          user: response.data?.user
        })),
        tap(response => {
          // If user data is returned and verification is successful, update current user
          if (response.success && response.user) {
            this.currentUserSubject.next(response.user);
            localStorage.setItem('user', JSON.stringify(response.user));
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Resend verification email
   * @param email - Optional email if user is not logged in
   * @returns Observable with success message
   */
  // resendVerification(email?: string): Observable<ResendVerificationResponse> {
  //   const request: ResendVerificationRequest = email ? { email } : {};
    
  //   return this.http.post<any>(`${this.API_URL}/auth/resend-verification`, request)
  //     .pipe(
  //       map(response => ({
  //         message: response.message || 'Verification email has been sent.',
  //         success: response.success || true
  //       })),
  //       catchError(this.handleError)
  //     );
  // }

  /**
   * Check if current user's email is verified
   * @returns boolean indicating email verification status
   */
  isEmailVerified(): boolean {
    const user = this.getCurrentUser();
    return user?.emailVerified || false;
  }

  // ============= EXISTING METHODS =============

  private handleAuthSuccess(response: AuthResponse): void {
    localStorage.setItem('access_token', response.accessToken);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    if (response.refreshToken) {
      localStorage.setItem('refresh_token', response.refreshToken);
    }

    this.tokenSubject.next(response.accessToken);
    this.currentUserSubject.next(response.user);

    this.redirectByRole(response.user.role);
  }

  private redirectByRole(role: UserRole): void {
    switch (role) {
      case UserRole.ADMIN:
        this.router.navigate(['/admin/dashboard']);
        break;
      case UserRole.AGENT:
        this.router.navigate(['/agent/dashboard']);
        break;
      case UserRole.CUSTOMER:
        this.router.navigate(['/customer/dashboard']);
        break;
      default:
        this.router.navigate(['/login']);
        break;
    }
  }

  logout(): void {
    this.clearStoredAuth();
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  hasRole(role: UserRole): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  hasAnyRole(roles: UserRole[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }

  // ============= UTILITY METHODS =============

  /**
   * Generic error handler for HTTP requests
   * @param error - HTTP error response
   * @returns Observable error
   */
  private handleError(error: any): Observable<never> {
    console.error('AuthService Error:', error);
    
    let errorMessage = 'An unexpected error occurred. Please try again.';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (error.status === 0) {
      errorMessage = 'Unable to connect to the server. Please check your internet connection.';
    } else if (error.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    } else if (error.status === 404) {
      errorMessage = 'Service not found. Please contact support.';
    }

    return throwError(() => new Error(errorMessage));
  }

  /**
   * Refresh authentication token
   * @returns Observable with new auth response
   */
  // refreshToken(): Observable<AuthResponse> {
  //   const refreshToken = localStorage.getItem('refresh_token');
    
  //   if (!refreshToken) {
  //     this.logout();
  //     return throwError(() => new Error('No refresh token available'));
  //   }

    // return this.http.post<any>(`${this.API_URL}/auth/refresh-token`, { refreshToken })
    //   .pipe(
    //     map(response => ({
    //       user: response.data.user,
    //       accessToken: response.data.token,
    //       refreshToken: response.data.refreshToken
    //     })),
    //     tap(response => {
    //       localStorage.setItem('access_token', response.accessToken);
    //       if (response.refreshToken) {
    //         localStorage.setItem('refresh_token', response.refreshToken);
    //       }
    //       this.tokenSubject.next(response.accessToken);
    //       this.currentUserSubject.next(response.user);
    //     }),
    //     catchError(error => {
    //       this.logout();
    //       return throwError(() => error);
    //     })
    //   );
  // }

  /**
   * Update user profile
   * @param userData - Updated user data
   * @returns Observable with updated user
   */
  // updateProfile(userData: Partial<User>): Observable<User> {
  //   return this.http.put<any>(`${this.API_URL}/auth/profile`, userData)
  //     .pipe(
  //       map(response => response.data.user),
  //       tap(user => {
  //         this.currentUserSubject.next(user);
  //         localStorage.setItem('user', JSON.stringify(user));
  //       }),
  //       catchError(this.handleError)
  //     );
  // }

  /**
   * Change password for authenticated user
   * @param currentPassword - Current password
   * @param newPassword - New password
   * @returns Observable with success message
   */
  changePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    const request = { currentPassword, newPassword };
    
    return this.http.post<any>(`${this.API_URL}/auth/change-password`, request)
      .pipe(
        map(response => ({
          message: response.message || 'Password changed successfully.'
        })),
        catchError(this.handleError)
      );
  }
}