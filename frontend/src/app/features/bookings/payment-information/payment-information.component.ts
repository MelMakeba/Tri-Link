import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BookingStateService } from '../../../core/services/booking-state.service';
import { BookingService } from '../../../core/services/booking.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payment-information',
  imports: [CommonModule, ReactiveFormsModule],
  standalone: true,
  templateUrl: './payment-information.component.html',
  styleUrls: ['./payment-information.component.css']
})
export class PaymentInformationComponent implements OnInit {
  paymentForm: FormGroup;
  isApplyingCoupon = false;
  couponApplied = false;
  months = Array.from({ length: 12 }, (_, i) => i + 1);
  years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i);
  paymentMethods = ['Credit Card', 'PayPal'];
  isProcessing = false;

  constructor(
    private fb: FormBuilder,
    public bookingStateService: BookingStateService,
    private bookingService: BookingService,
    private notification: NotificationService
  ) {
    this.paymentForm = this.fb.group({
      paymentMethod: ['Credit Card', Validators.required],
      cardHolder: ['', Validators.required],
      cardNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{16}$/)]],
      expiryMonth: ['', Validators.required],
      expiryYear: ['', Validators.required],
      cvv: ['', [Validators.required, Validators.pattern(/^[0-9]{3,4}$/)]],
      couponCode: [''],
      savePaymentMethod: [false]
    });
  }

  ngOnInit(): void {
    const state = this.bookingStateService.currentState;
    if (!state.selectedVehicle || !state.startDate || !state.endDate || !state.pickupLocation) {
      this.notification.warning('Please complete previous steps first');
      this.bookingStateService.goToStep(0);
      return;
    }

    // Check if coupon was already applied
    if (state.couponCode) {
      this.paymentForm.patchValue({ couponCode: state.couponCode });
      this.couponApplied = true;
    }

    // Set default expiry date
    this.paymentForm.patchValue({
      expiryMonth: new Date().getMonth() + 1,
      expiryYear: new Date().getFullYear()
    });
  }

  get formattedCardNumber(): string {
    const value = this.paymentForm.get('cardNumber')?.value || '';
    return value.replace(/(.{4})/g, '$1 ').trim();
  }

  applyCoupon(): void {
    const couponCode = this.paymentForm.get('couponCode')?.value;
    if (!couponCode) {
      this.notification.error('Please enter a coupon code');
      return;
    }

    this.isApplyingCoupon = true;

    // This is where you would call your backend to validate the coupon
    // For now, we'll just simulate a successful coupon application
    setTimeout(() => {
      const discountAmount = Math.round(this.bookingStateService.currentState.totalPrice * 0.1);
      this.bookingStateService.applyCoupon(couponCode, discountAmount);
      this.couponApplied = true;
      this.isApplyingCoupon = false;
      this.notification.success(`Coupon applied! You saved $${discountAmount}`);
    }, 1000);
  }

  removeCoupon(): void {
    this.paymentForm.patchValue({ couponCode: '' });
    this.bookingStateService.applyCoupon('', 0);
    this.couponApplied = false;
  }

  confirmBooking(): void {
    if (this.paymentForm.invalid) {
      this.notification.error('Please complete all required fields');
      return;
    }

    this.isProcessing = true;
    const bookingData = this.bookingStateService.prepareBookingData();
    
    this.bookingService.createBooking(bookingData).subscribe({
      next: (response) => {
        this.isProcessing = false;
        this.bookingStateService.updateState({ bookingId: response.data.id });
        this.notification.success('Booking created successfully!');
        this.bookingStateService.nextStep();
      },
      error: (error) => {
        this.isProcessing = false;
        this.notification.error(error.error?.message || 'Failed to create booking. Please try again.');
      }
    });
  }

  submitPaymentInfo() {
    // Just store payment method preference, not actual payment
    this.bookingStateService.updateState({
      paymentMethod: this.paymentForm.value.paymentMethod,
      // Don't collect card details for now
    });
    
    this.bookingStateService.nextStep(); // Continue to confirmation
  }
}
