import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-email-verification',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './email-verification.component.html',
  styleUrls: ['./email-verification.component.css']
})
export class EmailVerificationComponent implements OnInit {
  isVerifying = true;
  verified = false;
  error = false;
  errorMessage = '';
  isResending = false;
  token: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token');
    
    if (!this.token) {
      this.isVerifying = false;
      this.error = true;
      this.errorMessage = 'Invalid verification link. Please check your email and try again.';
      return;
    }

    this.verifyEmail();
  }

  verifyEmail() {
    if (!this.token) return;

    this.authService.verifyEmail(this.token).subscribe({
      next: (response) => {
        this.isVerifying = false;
        if (response.success) {
          this.verified = true;
          // Optionally redirect after a delay
          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 3000);
        } else {
          this.error = true;
          this.errorMessage = response.message || 'Verification failed.';
        }
      },
      error: (error) => {
        this.isVerifying = false;
        this.error = true;
        this.errorMessage = error.message || 'Verification failed. Please try again.';
      }
    });
  }

  // resendVerification() {
  //   this.isResending = true;
    
  //   // Get email from current user or ask user to provide it
  //   const currentUser = this.authService.getCurrentUser();
  //   const email = currentUser?.email;

  //   this.authService.resendVerification(email).subscribe({
  //     next: (response) => {
  //       this.isResending = false;
  //       this.error = false;
  //       this.errorMessage = '';
  //       // Show success message
  //       alert(response.message || 'Verification email sent successfully!');
  //     },
  //     error: (error) => {
  //       this.isResending = false;
  //       this.errorMessage = error.message || 'Failed to resend verification email.';
  //     }
  //   });
  // }
}
