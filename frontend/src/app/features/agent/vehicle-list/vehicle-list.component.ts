import { Component, OnInit } from '@angular/core';
import { AgentVehicleService } from '../../../core/services/vehicle.service';
import { CommonModule } from '@angular/common';
import { VehicleFormComponent } from '../vehicle-form/vehicle-form.component';
import { RouterLinkActive, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Vehicle } from '../../../core/models/vehicle.model';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-vehicle-list',
  templateUrl: './vehicle-list.component.html',
  styleUrls: ['./vehicle-list.component.css'],
  standalone: true,
  imports: [CommonModule, VehicleFormComponent, RouterLinkActive, FormsModule, RouterModule]
})
export class VehicleListComponent implements OnInit {
  vehicles: Vehicle[] = [];
  isLoading = false;
  error: string | null = null;
  searchTerm = '';
  showVehicleForm = false;
  selectedVehicle: Vehicle | null = null;
  selectedVehicleForView: Vehicle | null = null;

  constructor(
    private vehicleService: AgentVehicleService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.refreshVehicles();
  }

  refreshVehicles(): void {
    this.isLoading = true;
    this.vehicleService.getVehicles().subscribe({
      next: (res) => {
        // More robust handling of the response
        if (Array.isArray(res)) {
          this.vehicles = res;
        } else if (res && Array.isArray(res.data)) {
          this.vehicles = res.data;
        } else if (res && res.data && Array.isArray(res.data)) {
          this.vehicles = res.data;
        } else {
          // If no array is found, initialize as empty array
          console.error('Unexpected response format:', res);
          this.vehicles = [];
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading vehicles:', err);
        this.error = 'Failed to load vehicles';
        this.vehicles = []; // Ensure it's always an array
        this.isLoading = false;
      }
    });
  }

  searchVehicles(): void {
    if (!this.searchTerm) {
      this.refreshVehicles();
      return;
    }
    this.vehicles = this.vehicles.filter(car =>
      car.make?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      car.model?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      car.licensePlate?.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  openAddVehicle(): void {
    this.selectedVehicle = null;
    this.showVehicleForm = true;
  }

  editVehicle(car: any): void {
    this.selectedVehicle = car;
    this.showVehicleForm = true;
  }

  deleteVehicle(id: string): void {
    if (confirm('Are you sure you want to delete this vehicle?')) {
      this.vehicleService.deleteVehicle(id).subscribe({
        next: () => {
          this.refreshVehicles();
          this.notification.success('Vehicle deleted successfully');
        },
        error: (err) => {
          this.error = 'Failed to delete vehicle';
          this.notification.error('Failed to delete vehicle', 'Error');
        }
      });
    }
  }

  closeVehicleForm(event: any): void {
    this.showVehicleForm = false;
    this.selectedVehicle = null;
  }

  viewVehicle(car: Vehicle) {
    this.selectedVehicleForView = car;
  }

  closeVehicleView() {
    this.selectedVehicleForView = null;
  }
}
