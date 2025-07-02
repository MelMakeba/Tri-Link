import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BookingService } from '../../../core/services/booking.service';
import { BookingStateService } from '../../../core/services/booking-state.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-booking-confirmation',
  imports: [CommonModule],
  templateUrl: './booking-confirmation.component.html',
  styleUrls: ['./booking-confirmation.component.css']
})
export class BookingConfirmationComponent implements OnInit {
  @Input() bookingId: string | null = null;
  booking: any = null;
  isLoading = false;
  error: string | null = null;

  constructor(
    public bookingStateService: BookingStateService,
    private bookingService: BookingService,
    private notification: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.bookingId) {
      const state = this.bookingStateService.currentState;
      if (state.bookingId) {
        this.bookingId = state.bookingId;
      } else {
        this.error = 'Booking ID not found. Please start a new booking.';
        return;
      }
    }

    // Only call if we have a booking ID
    if (this.bookingId) {
      this.loadBookingDetails();
    }
  }

  loadBookingDetails(): void {
    // Create a local constant that TypeScript can properly type-narrow
    const bookingId = this.bookingId;
    
    if (!bookingId) {
      this.error = 'No booking ID provided';
      return;
    }
    
    this.isLoading = true;
    // Now bookingId is known to be a string
    this.bookingService.getBookingDetails(bookingId).subscribe({
      next: (response) => {
        this.booking = response.data;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.error = error.error?.message || 'Failed to load booking details';
        this.notification.error(error);
      }
    });
  }

  viewBookings(): void {
    this.router.navigate(['/customer/bookings']);
  }

  newBooking(): void {
    this.bookingStateService.resetState();
    this.router.navigate(['/customer/book']);
  }

  printConfirmation(): void {
    window.print();
  }

  downloadPdf(): void {
    // In a real application, you would call a service to generate and download a PDF
    this.notification.info('Downloading booking confirmation as PDF...');
    
    // Simulate download
    setTimeout(() => {
      this.notification.success('PDF downloaded successfully!');
    }, 1500);
  }
}
