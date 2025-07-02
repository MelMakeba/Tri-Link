import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { BookingService } from '../../../core/services/booking.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Booking} from '../../../core/models/booking.model';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe, RouterModule],
  templateUrl: './my-bookings.component.html',
  styleUrls: ['./my-bookings.component.css']
})
export class MyBookingsComponent implements OnInit {
  bookings: Booking[] = [];
  isLoading = false;
  error: string | null = null;
  
  constructor(
    private bookingService: BookingService,
    private notification: NotificationService,
    private router: Router
    
  ) {}
  
  ngOnInit(): void {
    this.loadBookings();
  }
  
  loadBookings(): void {
    this.isLoading = true;
    this.bookingService.getMyBookings().subscribe({
      next: (response) => {
        this.bookings = response.data;
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Failed to load bookings';
        this.isLoading = false;
        this.notification.error(error.message || 'Failed to load bookings');
      }
    });
  }
  
  cancelBooking(bookingId: string): void {
    if (confirm('Are you sure you want to cancel this booking?')) {
      this.bookingService.cancelBooking(bookingId).subscribe({
        next: () => {
          this.notification.success('Booking cancelled successfully');
          this.loadBookings(); // Reload bookings to update the list
        },
        error: (error) => {
          this.notification.error(error.message || 'Failed to cancel booking');
        }
      });
    }
  }
  
  getStatusClass(status: string): string {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
  goBack(): void {
    this.router.navigate(['/customer/dashboard']);
  }
}
