import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BookingService } from '../../../core/services/booking.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Booking } from '../../../core/models/booking.model';
import { catchError, finalize, of } from 'rxjs';

@Component({
  selector: 'app-booking-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './booking-details.component.html',
  styleUrls: ['./booking-details.component.css']
})
export class BookingDetailsComponent implements OnInit {
  bookingId: string = '';
  booking: Booking | null = null;
  isLoading: boolean = false;
  error: string | null = null;
  isCancelling: boolean = false;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookingService: BookingService,
    private notification: NotificationService
  ) {}
  
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.bookingId = id;
        this.loadBookingDetails();
      } else {
        this.error = 'Invalid booking ID';
      }
    });
  }
  
  loadBookingDetails(): void {
    this.isLoading = true;
    this.error = null;
    
    this.bookingService.getBookingDetails(this.bookingId).pipe(
      catchError(error => {
        this.error = error.message || 'Failed to load booking details';
        this.notification.error(error);
        return of(null);
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe(response => {
      if (response) {
        this.booking = response.data;
      }
    });
  }
  
  cancelBooking(): void {
    if (!this.booking) return;
    
    if (confirm('Are you sure you want to cancel this booking?')) {
      this.isCancelling = true;
      
      this.bookingService.cancelBooking(this.bookingId).pipe(
        catchError(error => {
          this.notification.error(error.message || 'Failed to cancel booking');
          return of(null);
        }),
        finalize(() => {
          this.isCancelling = false;
        })
      ).subscribe(response => {
        if (response) {
          this.notification.success('Booking cancelled successfully');
          this.loadBookingDetails(); // Reload to show updated status
        }
      });
    }
  }
  
  getStatusClass(status: string): string {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  }
  
  canCancelBooking(): boolean {
    return this.booking?.status === 'PENDING' || this.booking?.status === 'CONFIRMED';
  }
  
  goBack(): void {
    this.router.navigate(['/customer/bookings']);
  }
}
