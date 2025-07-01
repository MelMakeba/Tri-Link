import { NgChartsModule } from 'ng2-charts';
import { Component, OnInit } from '@angular/core';
import { AppCalendarComponent } from '../../../shared/calendar/calendar.component';
import { CommonModule } from '@angular/common';
import { ChartConfiguration, ChartType } from 'chart.js';
import { User } from '../../../core/models/user.model';
import { UserProfileService } from '../../../core/services/user-profile.service';
import { RouterLinkActive, RouterModule } from '@angular/router';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [
    AppCalendarComponent, 
    CommonModule, 
    NgChartsModule, 
    RouterLinkActive, 
    RouterModule
  ],
  templateUrl: './customer-dashboard.component.html',
  styleUrls: ['./customer-dashboard.component.css']
})
export class CustomerDashboardComponent implements OnInit {
  currentUser: User | null = null;
  isLoading = false;
  error: string | null = null;

  // Dashboard data
  today = new Date();
  activeBookings = 3;
  loyaltyPoints = 1250;
  pastBookings = 12;
  
  offers: any[] = [
    { id: 1, title: '20% Off Weekend Rentals', description: 'Valid until end of month' },
    { id: 2, title: 'Free Upgrade on Next Booking', description: 'Premium cars available' }
  ];

  // Chart properties
  chartType: ChartType = 'line';
  
  bookingChartData: ChartConfiguration['data'] = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Monthly Bookings',
      data: [2, 3, 1, 4, 2, 3],
      borderColor: '#351243',
      backgroundColor: 'rgba(53, 18, 67, 0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#351243',
      pointBorderColor: '#351243',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: '#351243'
    }]
  };

  bookingChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#351243',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false
        },
        ticks: {
          color: '#666'
        }
      },
      y: {
        beginAtZero: true,
        display: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: '#666',
          stepSize: 1
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  constructor(
    private userProfileService: UserProfileService,
    private userService: UserService // Properly inject UserService
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  // Load user profile
  private async loadUserProfile(): Promise<void> {
    try {
      this.isLoading = true;
      this.error = null;
      
      // Assuming userProfileService has a method to get current user
      const user = await this.userProfileService.getProfile().toPromise();
      this.onProfileLoaded(user);
      
    } catch (error) {
      console.error('Error loading user profile:', error);
      this.error = 'Failed to load user profile. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  // Profile event handlers
  onProfileLoaded(user: User): void {
    console.log('Profile loaded:', user);
    this.currentUser = user;
    this.loadCustomerSpecificData();
  }

  onProfileUpdated(user: User): void {
    console.log('Profile updated:', user);
    this.currentUser = user;
    // Handle any additional updates needed when profile changes
    this.updateDashboardData();
  }

  // Customer-specific methods
  private async loadCustomerSpecificData(): Promise<void> {
    if (!this.currentUser) return;

    try {
      // Load customer-specific data after profile is loaded
      // This could include booking history, loyalty points, etc.
      await Promise.all([
        this.loadBookingHistory(),
        this.loadLoyaltyPoints(),
        this.loadActiveBookings(),
        this.updateBookingChart()
      ]);
      
    } catch (error) {
      console.error('Error loading customer data:', error);
      this.error = 'Failed to load dashboard data.';
    }
  }

  private async loadBookingHistory(): Promise<void> {
    // Implementation to load booking history
    // This would typically call a service method
    console.log('Loading booking history for user:', this.currentUser?.id);
  }

  private async loadLoyaltyPoints(): Promise<void> {
    // Implementation to load loyalty points
    console.log('Loading loyalty points for user:', this.currentUser?.id);
  }

  private async loadActiveBookings(): Promise<void> {
    // Implementation to load active bookings
    console.log('Loading active bookings for user:', this.currentUser?.id);
  }

  private async updateBookingChart(): Promise<void> {
    // Update chart data based on user's actual booking history
    // This would fetch real data from your service
    console.log('Updating booking chart for user:', this.currentUser?.id);
  }

  private updateDashboardData(): void {
    // Refresh dashboard data when profile is updated
    this.loadCustomerSpecificData();
  }

  // Dashboard action methods
  bookCar(): void {
    console.log('Booking a car for user:', this.currentUser?.id);
    // Implement navigation to car booking page
    // this.router.navigate(['/book-car']);
  }

  viewBookingHistory(): void {
    console.log('Viewing booking history for user:', this.currentUser?.id);
    // Navigate to booking history or open modal
    // this.router.navigate(['/booking-history']);
  }

  redeemPoints(): void {
    if (this.loyaltyPoints <= 0) {
      console.log('No points available to redeem');
      return;
    }
    
    console.log('Redeeming loyalty points:', this.loyaltyPoints);
    // Handle points redemption logic
    // This could open a modal or navigate to redemption page
  }

  requestSupport(): void {
    console.log('Requesting support for user:', this.currentUser?.id);
    // Navigate to support page or open chat
    // this.router.navigate(['/support']);
  }

  viewOffers(): void {
    console.log('Viewing available offers');
    // Navigate to offers page or show offers modal
    // this.router.navigate(['/offers']);
  }

  // Utility methods
  getUserDisplayName(): string {
    if (!this.currentUser) return 'Guest';
    return this.currentUser.firstName 
      ? `${this.currentUser.firstName} ${this.currentUser.lastName || ''}`.trim()
      : this.currentUser.email || 'User';
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Error handling
  onRetry(): void {
    this.error = null;
    this.loadUserProfile();
  }
}