import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  password = '';
  confirmPassword = '';
  message = '';
  error = '';
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  token: string | null = null;
  tokenValid = false;
  checkingToken = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token');
    
    if (!this.token) {
      this.checkingToken = false;
      this.error = 'Invalid reset link. Please request a new password reset.';
      return;
    }

    // this.validateToken();
  }

  // validateToken() {
  //   if (!this.token) return;

  //   this.authService.validateResetToken(this.token).subscribe({
  //     next: (response) => {
  //       this.checkingToken = false;
  //       this.tokenValid = response.valid;
  //       if (!response.valid) {
  //         this.error = response.message || 'Invalid or expired reset token.';
  //       }
  //     },
  //     error: (error) => {
  //       this.checkingToken = false;
  //       this.tokenValid = false;
  //       this.error = 'Invalid or expired reset token. Please request a new password reset.';
  //     }
  //   });
  // }

  onSubmit() {
    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match.';
      return;
    }

    if (!this.token) {
      this.error = 'Invalid reset token.';
      return;
    }

    if (!this.tokenValid) {
      this.error = 'Reset token is invalid or expired.';
      return;
    }

    this.isLoading = true;
    this.message = '';
    this.error = '';

    this.authService.resetPassword(this.token, this.password).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.message = response.message;
        // Reset form
        this.password = '';
        this.confirmPassword = '';
        
        // Redirect to login after a delay
        setTimeout(() => {
          this.router.navigate(['/auth/login'], {
            queryParams: { message: 'Password reset successful. Please log in with your new password.' }
          });
        }, 3000);
      },
      error: (error) => {
        this.isLoading = false;
        this.error = error.message || 'Failed to reset password. Please try again.';
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  getPasswordStrength(): number {
    let strength = 0;
    if (this.password.length >= 8) strength++;
    if (/[a-z]/.test(this.password)) strength++;
    if (/[A-Z]/.test(this.password)) strength++;
    if (/[0-9]/.test(this.password)) strength++;
    if (/[^A-Za-z0-9]/.test(this.password)) strength++;
    return Math.min(strength, 4);
  }

  getPasswordStrengthClass(index: number): string {
    const strength = this.getPasswordStrength();
    if (index < strength) {
      switch (strength) {
        case 1: return 'bg-red-500';
        case 2: return 'bg-yellow-500';
        case 3: return 'bg-blue-500';
        case 4: return 'bg-green-500';
        default: return 'bg-gray-200';
      }
    }
    return 'bg-gray-200';
  }

  getPasswordStrengthText(): string {
    const strength = this.getPasswordStrength();
    switch (strength) {
      case 0: return 'Enter a password';
      case 1: return 'Weak password';
      case 2: return 'Fair password';
      case 3: return 'Good password';
      case 4: return 'Strong password';
      default: return '';
    }
  }

  requestNewResetLink() {
    this.router.navigate(['/auth/forgot-password']);
  }
}
