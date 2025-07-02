import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { BookingStateService } from '../../../core/services/booking-state.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-date-time-selection',
  imports: [CommonModule, ReactiveFormsModule],
  standalone: true,
  templateUrl: './date-time-selection.component.html',
  styleUrls: ['./date-time-selection.component.css']
})
export class DateTimeSelectionComponent implements OnInit {
  dateForm: FormGroup;
  minDate: string;
  maxDate: string;
  totalPrice = 0;
  numberOfDays = 0;
  pricePerDay = 0;
  availableStartTimes = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
  availableEndTimes = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

  constructor(
    private fb: FormBuilder,
    private bookingStateService: BookingStateService,
    private notification: NotificationService
  ) {
    // Set min date to today and max date to 1 year from now
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
    
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    this.maxDate = nextYear.toISOString().split('T')[0];
    
    this.dateForm = this.fb.group({
      startDate: [this.minDate, Validators.required],
      endDate: [this.minDate, Validators.required],
      startTime: ['10:00', Validators.required],
      endTime: ['18:00', Validators.required]
    });
  }

  ngOnInit(): void {
    const state = this.bookingStateService.currentState;
    if (!state.selectedVehicle) {
      this.notification.warning('Please select a vehicle first');
      this.bookingStateService.goToStep(0);
      return;
    }

    this.pricePerDay = state.selectedVehicle.pricePerDay;
    
    // Initialize form with values from state if available
    if (state.startDate && state.endDate) {
      this.dateForm.patchValue({
        startDate: state.startDate.toISOString().split('T')[0],
        endDate: state.endDate.toISOString().split('T')[0],
        startTime: state.startTime || '10:00',
        endTime: state.endTime || '18:00'
      });
    }
    
    // Calculate initial totals
    this.calculateTotals();
    
    // Listen for form changes to update totals
    this.dateForm.valueChanges.subscribe(() => {
      this.calculateTotals();
    });
  }

  calculateTotals(): void {
    const { startDate, endDate } = this.dateForm.value;
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Validate date range
      if (end < start) {
        this.dateForm.get('endDate')?.setErrors({ invalidRange: true });
        return;
      } else {
        this.dateForm.get('endDate')?.setErrors(null);
      }
      
      // Calculate number of days
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      this.numberOfDays = Math.max(1, diffDays);
      
      // Calculate total price
      this.totalPrice = this.pricePerDay * this.numberOfDays;
    }
  }

  saveAndContinue(): void {
    if (this.dateForm.invalid) {
      this.notification.error('Please correct the errors in the form');
      return;
    }
    
    const { startDate, endDate, startTime, endTime } = this.dateForm.value;
    
    // Update booking state
    this.bookingStateService.setDateTime(
      new Date(startDate),
      new Date(endDate),
      startTime,
      endTime
    );
    
    // Navigate to next step
    this.bookingStateService.nextStep();
  }
}
