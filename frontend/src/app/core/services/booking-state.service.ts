import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Vehicle } from '../models/vehicle.model';
import { BookingStep } from '../models/booking-step.enum';
import { BookingState } from '../models/booking-state.model';
import { BookingDto } from '../models/booking.model';

@Injectable({
  providedIn: 'root'
})
export class BookingStateService {
  private initialState: BookingState = {
    bookingId: null, // Add this missing property
    selectedVehicle: null,
    startDate: null,
    endDate: null,
    startTime: null,
    endTime: null,
    pickupLocation: '',
    returnLocation: '',
    notes: '',
    driverLicenseNumber: '',
    paymentMethod: null,
    currentStep: BookingStep.CAR_SELECTION,
    couponCode: '',
    totalPrice: 0,
    finalPrice: 0,
    discountPrice: 0
  };

  private bookingStateSubject = new BehaviorSubject<BookingState>(this.initialState);
  
  constructor() { }

  // Expose the observable state
  get state$(): Observable<BookingState> {
    return this.bookingStateSubject.asObservable();
  }

  // Expose the current state value
  get currentState(): BookingState {
    return this.bookingStateSubject.getValue();
  }

  // Update specific fields in state
  updateState(partialState: Partial<BookingState>): void {
    this.bookingStateSubject.next({
      ...this.currentState,
      ...partialState
    });
  }

  // Set selected vehicle
  selectVehicle(vehicle: Vehicle): void {
    this.updateState({ 
      selectedVehicle: vehicle,
      totalPrice: vehicle.pricePerDay, // Initial price estimate
      finalPrice: vehicle.pricePerDay
    });
  }

  // Set date/time
  setDateTime(startDate: Date, endDate: Date, startTime: string, endTime: string): void {
    const days = this.calculateDays(startDate, endDate);
    const totalPrice = this.currentState.selectedVehicle ? 
      this.currentState.selectedVehicle.pricePerDay * days : 0;
    
    this.updateState({
      startDate,
      endDate,
      startTime,
      endTime,
      totalPrice,
      finalPrice: totalPrice - this.currentState.discountPrice
    });
  }

  // Calculate number of days
  private calculateDays(startDate: Date, endDate: Date): number {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  }

  // Set customer details
  setCustomerDetails(
    pickupLocation: string,
    returnLocation: string,
    driverLicenseNumber: string,
    notes: string
  ): void {
    this.updateState({
      pickupLocation,
      returnLocation,
      driverLicenseNumber,
      notes
    });
  }

  // Apply coupon
  applyCoupon(couponCode: string, discountAmount: number): void {
    const finalPrice = this.currentState.totalPrice - discountAmount;
    
    this.updateState({
      couponCode,
      discountPrice: discountAmount,
      finalPrice: finalPrice > 0 ? finalPrice : 0
    });
  }

  // Set payment method
  setPaymentMethod(paymentMethod: string): void {
    this.updateState({ paymentMethod });
  }

  // Navigate to next step
  nextStep(): void {
    const currentStepValue = this.currentState.currentStep;
    const nextStep = currentStepValue + 1;
    
    if (nextStep <= BookingStep.CONFIRMATION) {
      this.updateState({ currentStep: nextStep });
    }
  }

  // Navigate to previous step
  prevStep(): void {
    const currentStepValue = this.currentState.currentStep;
    const prevStep = currentStepValue - 1;
    
    if (prevStep >= BookingStep.CAR_SELECTION) {
      this.updateState({ currentStep: prevStep });
    }
  }

  // Go to specific step
  goToStep(step: BookingStep): void {
    this.updateState({ currentStep: step });
  }

  // Reset state
  resetState(): void {
    this.bookingStateSubject.next(this.initialState);
  }

  // Prepare booking data for API
  prepareBookingData(): BookingDto {
    const state = this.currentState;
    
    return {
      vehicleId: state.selectedVehicle?.id || '',
      startDate: state.startDate?.toISOString() || '',
      endDate: state.endDate?.toISOString() || '',
      startTime: state.startTime || undefined,
      endTime: state.endTime || undefined,
      pickupLocation: state.pickupLocation,
      returnLocation: state.returnLocation,
      notes: state.notes || undefined,
      driverLicenseNumber: state.driverLicenseNumber || undefined,
      couponCode: state.couponCode || undefined,
      discountPrice: state.discountPrice || undefined
    };
  }
}