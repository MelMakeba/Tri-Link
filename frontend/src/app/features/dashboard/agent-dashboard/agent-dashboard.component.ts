import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { UserProfileService } from '../../../core/services/user-profile.service';
import { User } from '../../../core/models/user.model';
import { AgentVehicleService } from '../../../core/services/vehicle.service';
import { BookingService } from '../../../core/services/bookings.servicee';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-agent-dashboard',
  standalone: true,
  imports: [CommonModule, NgChartsModule, RouterModule],
  templateUrl: './agent-dashboard.component.html',
  styleUrls: ['./agent-dashboard.component.css']
})
export class AgentDashboardComponent implements OnInit {
  currentUser: User | null = null;
  isLoading = false;
  error: string | null = null;

  totalVehicles = 0;
  totalBookings = 0;
  averageRating = 0;

  agent = {
    firstName: 'Alex',
    avatar: '/assets/avatar-default.png'
  };
  today = new Date();

  assignedBookings = 4;
  upcomingReturns = 2;
  monthlyBookings = 12;
  rating = 4.8;

  // Updated chart configuration
  public chartType: ChartType = 'bar';
  
  public performanceChartData: ChartData<'bar'> = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        data: [2, 3, 4, 5, 6, 7, 8, 9, 10, 8, 7, 6],
        label: 'Bookings',
        backgroundColor: '#86718e',
        borderColor: '#351243',
        borderWidth: 1
      }
    ]
  };

  public performanceChartOptions: ChartConfiguration['options'] = {
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

  messages = [
    { from: 'Admin', text: 'Please confirm booking #123.' },
    { from: 'Customer', text: 'Pickup scheduled for tomorrow.' }
  ];

  constructor(
    private vehicleService: AgentVehicleService,
    private userProfileService: UserProfileService,
    private bookingService: BookingService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProfile();
    this.loadVehicles();
    this.loadBookings();
    this.loadRating();
  }

  loadProfile() {
    this.isLoading = true;
    this.userProfileService.getProfile().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Failed to load profile';
        this.isLoading = false;
      }
    });
  }

  loadVehicles() {
    this.vehicleService.getVehicles().subscribe({
      next: (res) => {
        this.totalVehicles = res?.data?.length || res?.data?.length || 0;
      }
    });
  }

  loadBookings() {
    // Replace with your actual bookings service if needed
    this.bookingService.getCustomerBookings?.().subscribe({
      next: (res) => {
        this.totalBookings = res?.data?.length || res?.length || 0;
      }
    });
  }

  loadRating() {
    // Replace with your actual rating logic/service
    this.averageRating = 4.7; // Example static value
  }

  confirmBooking() {
    alert('Booking confirmed!');
  }

  markReturned() {
    alert('Marked as returned!');
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
