import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { BookingStateService } from '../../../core/services/booking-state.service';
import { BookingService } from '../../../core/services/booking.service';
import { Vehicle, VehicleApiResponse, VehicleFromApi } from '../../../core/models/vehicle.model';
import { NotificationService } from '../../../core/services/notification.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-car-selection',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './car-selection.component.html',
  styleUrls: ['./car-selection.component.css']
})
export class CarSelectionComponent implements OnInit {
  vehicles: Vehicle[] = []; // Use the proper type
  filteredVehicles: Vehicle[] = [];
  selectedVehicle: Vehicle | null = null;
  isLoading = false;
  searchForm: FormGroup;
  categories = ['Sedan', 'SUV', 'Hatchback', 'Truck', 'Van', 'Convertible', 'Coupe', 'Sports Car'];
  
  constructor(
    private bookingService: BookingService,
    private bookingStateService: BookingStateService,
    private fb: FormBuilder,
    private notification: NotificationService
  ) {
    this.searchForm = this.fb.group({
      location: [''],
      category: [''],
      startDate: [new Date().toISOString().split('T')[0]],
      endDate: [new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]]
    });
  }

  ngOnInit(): void {
    // Get selected vehicle from state if any
    const currentState = this.bookingStateService.currentState;
    this.selectedVehicle = currentState.selectedVehicle;
    
    // Set default dates if they exist in state
    if (currentState.startDate && currentState.endDate) {
      this.searchForm.patchValue({
        startDate: currentState.startDate.toISOString().split('T')[0],
        endDate: currentState.endDate.toISOString().split('T')[0]
      });
    }
    
    // Listen to form changes
    this.searchForm.valueChanges
      .pipe(debounceTime(500))
      .subscribe(() => {
        this.searchVehicles();
      });
    
    // Initial search
    this.searchVehicles();
  }

  searchVehicles(): void {
    this.isLoading = true;
    this.bookingService.searchAvailableVehicles(
      this.searchForm.get('startDate')?.value,
      this.searchForm.get('endDate')?.value,
      this.searchForm.get('location')?.value,
      this.searchForm.get('category')?.value
    ).subscribe({
      next: (response: VehicleApiResponse) => {
        this.isLoading = false;
        console.log('API Response:', response);
        
        if (response?.data?.vehicles && Array.isArray(response.data.vehicles)) {
          this.vehicles = response.data.vehicles.map(apiVehicle => this.mapApiVehicleToModel(apiVehicle));
          this.filteredVehicles = this.vehicles; // Add this line
          console.log('Mapped vehicles:', this.vehicles);
        } else {
          this.vehicles = [];
          this.filteredVehicles = []; // Add this line
          console.error('Unexpected API response structure:', response);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.vehicles = [];
        this.filteredVehicles = []; // Add this line
        this.notification.error(error.error?.message || 'Failed to search vehicles');
      }
    });
  }

  // Helper method to map API vehicle format to your model
  private mapApiVehicleToModel(apiVehicle: VehicleFromApi): Vehicle {
    return {
      id: apiVehicle.id,
      make: apiVehicle.make,
      model: apiVehicle.model,
      year: apiVehicle.year,
      color: 'Not specified', // Default value
      licensePlate: 'Not specified', // Default value
      status: 'AVAILABLE', // Default since these are available vehicles
      category: apiVehicle.category,
      transmission: apiVehicle.transmission,
      fuelType: apiVehicle.fuelType,
      seats: apiVehicle.seats,
      pricePerDay: apiVehicle.pricePerDay,
      location: apiVehicle.location || undefined,
      description: apiVehicle.description || undefined,
      images: apiVehicle.images || [],
      hasAC: apiVehicle.hasAC,
      hasGPS: apiVehicle.hasGPS,
      hasBluetooth: apiVehicle.hasBluetooth,
      hasUSB: apiVehicle.hasUSB,
      hasWiFi: false, // Default since not in API
      createdAt: new Date().toISOString(), // Default
      updatedAt: new Date().toISOString(), // Default
      // Additional properties with defaults
      agentId: apiVehicle.agent ? 'unknown' : undefined
    };
  }

  selectVehicle(vehicle: Vehicle | null): void {
    this.selectedVehicle = vehicle;
    
    if (vehicle) {
      // Update booking state with selected vehicle and current dates
      const formValues = this.searchForm.value;
      this.bookingStateService.selectVehicle(vehicle);
      
      // Also update dates in state
      this.bookingStateService.setDateTime(
        new Date(formValues.startDate),
        new Date(formValues.endDate),
        '10:00', // Default times
        '18:00'
      );
    } else {
      // Reset selected vehicle in state
      this.bookingStateService.updateState({ selectedVehicle: null });
    }
  }

  isSelected(vehicle: Vehicle): boolean {
    return this.selectedVehicle?.id === vehicle.id;
  }

  get canProceed(): boolean {
    return !!this.selectedVehicle;
  }
}
