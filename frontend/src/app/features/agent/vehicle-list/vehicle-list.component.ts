import { Component, OnInit } from '@angular/core';
import { AgentVehicleService } from '../../../core/services/vehicle.service';
import { CommonModule } from '@angular/common';
import { VehicleFormComponent } from '../vehicle-form/vehicle-form.component';
import { RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Vehicle } from '../../../core/models/vehicle.model';

@Component({
  selector: 'app-vehicle-list',
  templateUrl: './vehicle-list.component.html',
  styleUrls: ['./vehicle-list.component.css'],
  standalone: true,
  imports: [CommonModule, VehicleFormComponent, RouterLinkActive, FormsModule]
})
export class VehicleListComponent implements OnInit {
  vehicles: Vehicle[] = [];
  isLoading = false;
  error: string | null = null;
  searchTerm = '';
  showVehicleForm = false;
  selectedVehicle: Vehicle | null = null;

  constructor(private vehicleService: AgentVehicleService) {}

  ngOnInit(): void {
    this.refreshVehicles();
  }

  refreshVehicles(): void {
    this.isLoading = true;
    this.vehicleService.getVehicles().subscribe({
      next: (res) => {
        this.vehicles = res?.data || res || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load vehicles';
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
        next: () => this.refreshVehicles(),
        error: () => this.error = 'Failed to delete vehicle'
      });
    }
  }

  closeVehicleForm(event: any): void {
    this.showVehicleForm = false;
    this.selectedVehicle = null;
  }
}
