import { CommonModule } from '@angular/common';
import { User } from '../../../core/models/user.model';
import { UserProfileService } from '../../../core/services/user-profile.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ProfileComponent } from '../profile/profile.component';
import { RouterLinkActive, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-profile-page',
  imports: [CommonModule, ProfileComponent, RouterLinkActive, RouterModule],
  standalone: true,
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.css']
})
export class ProfilePageComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  userRole: string = '';

  // Notification settings
  emailNotifications = true;
  smsNotifications = false;
  marketingUpdates = true;
  
  // Loading and error states
  isLoading = false;
  error: string | null = null;
  successMessage: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(private userProfileService: UserProfileService) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Load initial data
  private loadInitialData(): void {
    this.isLoading = true;
    this.error = null;
    
    // Load user profile data
    this.userProfileService.getProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.currentUser = user;
          this.userRole = user.role; // e.g., 'CUSTOMER', 'AGENT', 'ADMIN'
          this.loadNotificationSettings();
        },
        error: (error) => {
          console.error('Error loading user profile:', error);
          this.error = 'Failed to load profile data. Please try again.';
          this.isLoading = false;
        }
      });
  }

  // Load notification preferences
  private loadNotificationSettings(): void {
    if (!this.currentUser) return;

    // Replace with actual service call
    // this.userProfileService.getNotificationSettings(this.currentUser.id)
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe(settings => {
    //     this.emailNotifications = settings.email;
    //     this.smsNotifications = settings.sms;
    //     this.marketingUpdates = settings.marketing;
    //   });
  }

  // Profile event handlers (called by ProfileComponent)
  onProfileLoaded(user: User): void {
    console.log('Profile loaded:', user);
    this.currentUser = user;
    this.loadNotificationSettings();
  }

  onProfileUpdated(user: User): void {
    console.log('Profile updated:', user);
    this.currentUser = user;
    this.showSuccessMessage('Profile updated successfully!');
  }

  // Notification toggle methods
  toggleEmailNotifications(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.emailNotifications = target.checked;
    this.updateNotificationSetting('email', this.emailNotifications);
  }

  toggleSmsNotifications(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.smsNotifications = target.checked;
    this.updateNotificationSetting('sms', this.smsNotifications);
  }

  toggleMarketingUpdates(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.marketingUpdates = target.checked;
    this.updateNotificationSetting('marketing', this.marketingUpdates);
  }

  // Update notification setting
  private updateNotificationSetting(type: string, enabled: boolean): void {
    if (!this.currentUser) return;

    console.log(`${type} notifications ${enabled ? 'enabled' : 'disabled'} for user:`, this.currentUser.id);
    
    // Replace with actual service call
    // this.userProfileService.updateNotificationSetting(this.currentUser.id, type, enabled)
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe({
    //     next: () => {
    //       this.showSuccessMessage(`${this.capitalize(type)} notifications updated!`);
    //     },
    //     error: (error) => {
    //       console.error(`Error updating ${type} notifications:`, error);
    //       this.error = `Failed to update ${type} notifications.`;
    //       // Revert the toggle on error
    //       this.revertNotificationToggle(type, !enabled);
    //     }
    //   });
  }

  // Revert notification toggle on error
  private revertNotificationToggle(type: string, value: boolean): void {
    switch (type) {
      case 'email':
        this.emailNotifications = value;
        break;
      case 'sms':
        this.smsNotifications = value;
        break;
      case 'marketing':
        this.marketingUpdates = value;
        break;
    }
  }

  // Utility methods
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private showSuccessMessage(message: string): void {
    this.successMessage = message;
    this.error = null;
    
    // Clear message after 3 seconds
    setTimeout(() => {
      this.successMessage = null;
    }, 3000);
  }

  // Get user display name
  getUserDisplayName(): string {
    if (!this.currentUser) return 'Guest';
    
    if (this.currentUser.firstName) {
      return `${this.currentUser.firstName} ${this.currentUser.lastName || ''}`.trim();
    }
    
    return this.currentUser.email || 'User';
  }

  // Clear error message
  clearError(): void {
    this.error = null;
  }

  // Retry loading data
  onRetry(): void {
    this.error = null;
    this.loadInitialData();
  }

  viewBookingHistory() {
    // Implement logic to view booking history
  }

  redeemPoints() {
    // Implement logic to redeem loyalty points
  }

  downloadStatement() {
    // Implement logic to download statement
  }
}