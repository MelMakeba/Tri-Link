import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  email = '';
  message = '';
  error = '';
  isLoading = false;

  constructor(private authService: AuthService) {}

  onSubmit() {
    if (!this.email) return;
    
    this.isLoading = true;
    this.message = '';
    this.error = '';

    this.authService.forgotPassword(this.email).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.message = response.message;
        this.email = ''; // Reset form
      },
      error: (error) => {
        this.isLoading = false;
        this.error = error.message || 'Something went wrong. Please try again.';
      }
    });
  }
}