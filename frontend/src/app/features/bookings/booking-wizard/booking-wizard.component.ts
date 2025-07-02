import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLinkActive, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { BookingStateService } from '../../../core/services/booking-state.service';
import { BookingService } from '../../../core/services/booking.service';
import { BookingStep } from '../../../core/models/booking-step.enum';
import { BookingState } from '../../../core/models/booking-state.model';
import { NotificationService } from '../../../core/services/notification.service';
import { CommonModule } from '@angular/common';
import { CarSelectionComponent } from '../car-selection/car-selection.component';
import { DateTimeSelectionComponent } from '../date-time-selection/date-time-selection.component';
import { CustomerDetailsComponent } from '../customer-details/customer-details.component';
import { PaymentInformationComponent } from '../payment-information/payment-information.component';
import { BookingConfirmationComponent } from '../booking-confirmation/booking-confirmation.component';
import { AuthService } from '../../../core/services/auth.service'; // Make sure this import exists
import { BookingWizardService } from '../../../core/services/booking-wizard.service'; // Import the new service

@Component({
  selector: 'app-booking-wizard',
  standalone: true,
  imports: [
    CommonModule,
    CarSelectionComponent,
    DateTimeSelectionComponent,
    CustomerDetailsComponent,
    PaymentInformationComponent,
    BookingConfirmationComponent,
    RouterLinkActive,
    RouterModule
  ],
  templateUrl: './booking-wizard.component.html',
  styleUrls: ['./booking-wizard.component.css']
})
export class BookingWizardComponent implements OnInit, OnDestroy {
  BookingStep = BookingStep;
  currentStep: BookingStep = BookingStep.CAR_SELECTION;
  bookingState?: BookingState;
  steps = [
    { label: 'Select Car', step: BookingStep.CAR_SELECTION, icon: 'directions_car' },
    { label: 'Date & Time', step: BookingStep.DATE_TIME_SELECTION, icon: 'event' },
    { label: 'Your Details', step: BookingStep.CUSTOMER_DETAILS, icon: 'person' },
    { label: 'Payment', step: BookingStep.PAYMENT_INFORMATION, icon: 'payment' },
    { label: 'Confirmation', step: BookingStep.CONFIRMATION, icon: 'check_circle' }
  ];

  private subscription = new Subscription();
  isSubmitting = false;
  bookingId: string | null = null;

  constructor(
    private bookingStateService: BookingStateService,
    private bookingService: BookingService,
    private notification: NotificationService,
    private router: Router,
    private authService: AuthService, // Add this line
    private bookingWizardService: BookingWizardService // Inject the new service
  ) { }

  ngOnInit(): void {
    // Register this component
    this.bookingWizardService.setWizardComponentReference(this);

    this.subscription.add(
      this.bookingStateService.state$.subscribe(state => {
        this.bookingState = state;
        this.currentStep = state.currentStep;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  nextStep(): void {
    this.bookingStateService.nextStep();
  }

  prevStep(): void {
    this.bookingStateService.prevStep();
  }

  goToStep(step: BookingStep): void {
    // Validate if we can go to this step (prevent skipping)
    if (this.canNavigateToStep(step)) {
      this.bookingStateService.goToStep(step);
    }
  }

  canNavigateToStep(step: BookingStep): boolean {
    // Prevent skipping steps forward, but allow going back
    if (step > this.currentStep) {
      return false;
    }
    return true;
  }

  submitBooking(): void {
    const bookingState = this.bookingStateService.currentState;
    
    if (!bookingState.selectedVehicle) {
      this.notification.error('Please select a vehicle before booking');
      return;
    }
    
    if (!bookingState.startDate || !bookingState.endDate) {
      this.notification.error('Please select valid start and end dates');
      return;
    }
    
    // Create booking with string representations, not Date objects
    const booking = {
      vehicleId: bookingState.selectedVehicle.id,
      
      // Format dates as YYYY-MM-DD strings
      startDate: this.formatDate(bookingState.startDate),
      endDate: this.formatDate(bookingState.endDate),
      
      // Send times as separate fields with null -> undefined conversion
      startTime: bookingState.startTime || undefined,  // Convert null to undefined
      endTime: bookingState.endTime || undefined,      // Convert null to undefined
      
      // Other fields
      pickupLocation: bookingState.pickupLocation,
      returnLocation: bookingState.returnLocation,
      notes: bookingState.notes || undefined,          // In case notes is nullable
      driverLicenseNumber: bookingState.driverLicenseNumber
    };
    
    this.bookingService.createBooking(booking).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.bookingId = response.data.id;
        this.notification.success('Booking created successfully!');
        // Go to confirmation step
        this.bookingStateService.goToStep(BookingStep.CONFIRMATION);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.notification.error(error.error?.message || 'Failed to create booking. Please try again.');
      }
    });
  }

  // Helper method to format dates
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
  }

  resetBooking(): void {
    this.bookingStateService.resetState();
  }

  viewBookings(): void {
    this.router.navigate(['/customer/bookings']);
  }

  getStepClass(step: BookingStep): string {
    if (this.currentStep === step) {
      return 'active';
    }
    if (this.currentStep > step) {
      return 'completed';
    }
    return '';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
