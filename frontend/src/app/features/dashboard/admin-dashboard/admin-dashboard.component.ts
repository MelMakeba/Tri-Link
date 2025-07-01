import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { AdminDashboardService } from '../../../core/services/admin-dash.service';
import { UserProfileService } from '../../../core/services/user-profile.service';
import { User } from '../../../core/models/user.model';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service'; // Adjust path as needed

interface SystemStats {
  totalUsers: number;
  totalVehicles: number;
  activeRentals: number;
  totalBookings: number;
  pendingBookings: number;
  totalRevenue: number;
  monthlyRevenue: number;
  todayBookings: number;
  usersByRole: {
    ADMIN: number;
    AGENT: number;
    CUSTOMER: number;
  };
  // ...other fields...
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, NgChartsModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  currentUser: User | null = null;
  isLoading = false;
  error: string | null = null;
  notifications: any;

  constructor(
    private userProfileService: UserProfileService,
    private adminDashboardService: AdminDashboardService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
    this.loadStats();
  }

  private async loadUserProfile(): Promise<void> {
    try {
      this.isLoading = true;
      this.error = null;
      const user = await this.userProfileService.getProfile().toPromise();
      this.currentUser = user;
      // Load admin-specific data here
    } catch (error) {
      this.error = 'Failed to load user profile. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }
  today = new Date();
 
  // Dynamic properties from backend
  recentUsers: User[] = [];
  totalUsers = 0;
  totalAgents = 0; // <-- Add this line
  totalCustomers = 0; // <-- Add this line
  totalVehicles = 0;
  activeRentals = 0;
  totalBookings = 0;
  pendingBookings = 0;
  totalRevenue = 0;
  monthlyRevenue = 0;
  todayBookings = 0;
  usersByRole = {
    ADMIN: 0,
    AGENT: 0,
    CUSTOMER: 0
  };

  // Chart configuration
  public chartType: ChartType = 'line';
  
  public userChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Users',
        backgroundColor: '#86718e33',
        borderColor: '#351243',
        pointBackgroundColor: '#431216',
        fill: true,
        tension: 0.4
      }
    ]
  };

  public userChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(134, 113, 142, 0.1)'
        }
      },
      x: {
        grid: {
          color: 'rgba(134, 113, 142, 0.1)'
        }
      }
    }
  };

  // Method to load system stats

  loadStats(): void {
    this.isLoading = true;
    this.error = null;
    
    this.adminDashboardService.getSystemStats().subscribe({
      next: (data: SystemStats) => {
        this.totalUsers = data.totalUsers || 0;
        this.totalAgents = data.usersByRole?.AGENT || 0;
        this.totalCustomers = data.usersByRole?.CUSTOMER || 0;
        // ...other assignments...
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading system stats:', err);
        this.error = 'Failed to load system stats';
        this.isLoading = false;
        
        // Set default values on error
        this.setDefaultValues();
      }
    });
  }

  private updateChartData(growthData: Array<{ month: string; count: number }>): void {
    this.userChartData = {
      labels: growthData.map(item => item.month),
      datasets: [
        {
          data: growthData.map(item => item.count),
          label: 'Users',
          backgroundColor: '#86718e33',
          borderColor: '#351243',
          pointBackgroundColor: '#431216',
          fill: true,
          tension: 0.4
        }
      ]
    };
  }

  private generateFallbackChartData(): void {
    // Generate a simple growth pattern based on current total users
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
    const currentTotal = this.totalUsers;
    const growthData = months.map((month, index) => {
      // Simulate growth pattern
      const percentage = (index + 1) / months.length;
      return Math.floor(currentTotal * percentage);
    });

    this.userChartData = {
      labels: months,
      datasets: [
        {
          data: growthData,
          label: 'Users',
          backgroundColor: '#86718e33',
          borderColor: '#351243',
          pointBackgroundColor: '#431216',
          fill: true,
          tension: 0.4
        }
      ]
    };
  }

  private setDefaultValues(): void {
    this.totalUsers = 0;
    this.totalVehicles = 0;
    this.activeRentals = 0;
    this.totalBookings = 0;
    this.pendingBookings = 0;
    this.totalRevenue = 0;
    this.monthlyRevenue = 0;
    this.todayBookings = 0;
    this.usersByRole = { ADMIN: 0, AGENT: 0, CUSTOMER: 0 };
    
    // Set empty chart
    this.userChartData = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
      datasets: [
        {
          data: [0, 0, 0, 0, 0, 0, 0],
          label: 'Users',
          backgroundColor: '#86718e33',
          borderColor: '#351243',
          pointBackgroundColor: '#431216',
          fill: true,
          tension: 0.4
        }
      ]
    };
  }

  // Method to refresh data
  refreshData(): void {
    this.loadStats();
  }

  addUser() {
    // Navigate to add user page or open modal
    console.log('Add User clicked!');
    // You can replace this with actual navigation or modal logic
    // Example: this.router.navigate(['/users/add']);
  }

  manageRoles() {
    // Navigate to roles management page
    console.log('Manage Roles clicked!');
    // Example: this.router.navigate(['/roles']);
  }

  viewLogs() {
    // Navigate to logs page
    console.log('View Logs clicked!');
    // Example: this.router.navigate(['/logs']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  // Helper method to get notification count
  get notificationCount(): number {
    return this.notifications?.length || 0;
  }

  // Helper method to format user display
  formatUserRole(role: string): string {
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  }
}