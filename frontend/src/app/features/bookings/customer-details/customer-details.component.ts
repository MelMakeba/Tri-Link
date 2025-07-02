import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BookingStateService } from '../../../core/services/booking-state.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UserProfileService } from '../../../core/services/user-profile.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-customer-details',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './customer-details.component.html',
  styleUrls: ['./customer-details.component.css']
})
export class CustomerDetailsComponent implements OnInit {
  detailsForm: FormGroup;
  isLoading = false;
  bookingWizardService: any;
  
  constructor(
    private fb: FormBuilder,
    public bookingStateService: BookingStateService,
    private notification: NotificationService,
    private userProfileService: UserProfileService
  ) {
    this.detailsForm = this.fb.group({
      pickupLocation: ['', Validators.required],
      returnLocation: ['', Validators.required],
      driverLicenseNumber: ['', Validators.required],
      notes: [''],
      agreeToTerms: [false, Validators.requiredTrue]
    });
  }

  ngOnInit(): void {
    const state = this.bookingStateService.currentState;
    if (!state.selectedVehicle || !state.startDate || !state.endDate) {
      this.notification.warning('Please complete previous steps first');
      this.bookingStateService.goToStep(0);
      return;
    }

    // Load user profile data
    this.loadUserProfile();
    
    // Initialize form with values from state if available
    if (state.pickupLocation) {
      this.detailsForm.patchValue({
        pickupLocation: state.pickupLocation,
        returnLocation: state.returnLocation || state.pickupLocation,
        driverLicenseNumber: state.driverLicenseNumber,
        notes: state.notes
      });
    }
  }

  loadUserProfile(): void {
    this.isLoading = true;
    // Use the correct method name from your UserProfileService
    this.userProfileService.getProfile().subscribe({  // Changed from getCurrentUserProfile
      next: (response) => {
        this.isLoading = false;
        const profile = response.data;
        
        // If we have profile data but no values in state yet, pre-populate fields
        if (profile && !this.bookingStateService.currentState.pickupLocation) {
          if (profile.address) {
            this.detailsForm.patchValue({
              pickupLocation: profile.address,
              returnLocation: profile.address,
            });
          }
          
          if (profile.driverLicenseNumber) {
            this.detailsForm.patchValue({
              driverLicenseNumber: profile.driverLicenseNumber
            });
          }
        }
      },
      error: () => {
        this.isLoading = false;
        // Silent fail - we'll just let the user fill in the form manually
      }
    });
  }

  usePickupAsReturn(): void {
    const pickupValue = this.detailsForm.get('pickupLocation')?.value;
    this.detailsForm.patchValue({ returnLocation: pickupValue });
  }

  saveAndContinue(): void {
    if (this.detailsForm.invalid) {
      this.notification.error('Please complete all required fields');
      return;
    }

    const values = this.detailsForm.value;
    
    // Update booking state
    this.bookingStateService.setCustomerDetails(
      values.pickupLocation,
      values.returnLocation,
      values.driverLicenseNumber,
      values.notes
    );
    
    // Navigate to next step
    this.bookingStateService.nextStep();
  }

  nextStep(): void {
    if (this.detailsForm.invalid) {
      this.detailsForm.markAllAsTouched();
      return;
    }

    // Save form data first
    this.saveFormData();
    
    // Get parent component reference (add this line)
    const wizardComponent = this.bookingWizardService.getWizardComponentReference();
    
    // Now submit booking instead of just going to next step
    if (wizardComponent) {
      wizardComponent.submitBooking();
    } else {
      // Fallback if reference not available
      this.bookingStateService.nextStep();
    }
  }

  saveFormData(): void {
    const values = this.detailsForm.value;
    
    // Update booking state
    this.bookingStateService.setCustomerDetails(
      values.pickupLocation,
      values.returnLocation,
      values.driverLicenseNumber,
      values.notes
    );
  }
}
