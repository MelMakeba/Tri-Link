import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Vehicle, VehicleStatus } from '../../../core/models/vehicle.model';
import { AgentVehicleService } from '../../../core/services/vehicle.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vehicle-form',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './vehicle-form.component.html',
  styleUrls: ['./vehicle-form.component.css']
})
export class VehicleFormComponent implements OnInit {
  @Input() vehicle: Vehicle | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  form: Partial<Vehicle> = {};
  isSaving = false;
  error: string | null = null;

  statusOptions: VehicleStatus[] = ['AVAILABLE', 'RENTED', 'MAINTENANCE', 'INACTIVE'];

  // For file upload
  selectedFiles: File[] = [];
  previewUrls: string[] = [];
  private maxFileSize = 5 * 1024 * 1024; // 5MB
  private allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];

  constructor(private vehicleService: AgentVehicleService) {}

  ngOnInit() {
    if (this.vehicle) {
      this.form = { ...this.vehicle };
      this.previewUrls = this.vehicle.images ? this.vehicle.images.map(img => typeof img === 'string' ? img : '') : [];
    } else {
      this.form = {
        make: '',
        model: '',
        year: new Date().getFullYear(),
        color: '',
        licensePlate: '',
        status: 'AVAILABLE',
        category: '',
        seats: 4,
        transmission: '',
        fuelType: '',
        pricePerDay: 0,
        hasGPS: false,
        hasAC: false,
        hasBluetooth: false,
        hasUSB: false,
        hasWiFi: false,
        images: []
      };
    }
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    this.handleFiles(files);
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFiles(input.files);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFiles(files);
    }
  }

  private handleFiles(files: FileList) {
    this.error = null;
    this.selectedFiles = [];
    this.previewUrls = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!this.allowedTypes.includes(file.type)) {
        this.error = 'Please select valid image files (PNG, JPG, JPEG)';
        continue;
      }
      if (file.size > this.maxFileSize) {
        this.error = 'Each file must be less than 5MB';
        continue;
      }
      this.selectedFiles.push(file);

      // Preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrls.push(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
    // Do NOT assign File[] to images; keep images as string[] (URLs)
    // this.form.images = this.selectedFiles; // REMOVE THIS LINE

    // Optionally, clear form.images if you want to reset URLs on new selection:
    this.form.images = [];
  }

  save() {
    this.isSaving = true;
    this.error = null;
    const saveOrUpdate$ = this.vehicle && this.vehicle.id
      ? this.vehicleService.updateVehicle(this.vehicle.id, this.form)
      : this.vehicleService.createVehicle(this.form);

    saveOrUpdate$.subscribe({
      next: (vehicleRes) => {
        // If there are files to upload, upload them
        if (this.selectedFiles.length && vehicleRes?.id) {
          this.vehicleService.uploadVehicleImages(vehicleRes.id, this.selectedFiles).subscribe({
            next: () => {
              this.isSaving = false;
              this.saved.emit();
              this.close.emit();
            },
            error: () => {
              this.isSaving = false;
              this.error = 'Vehicle saved, but image upload failed.';
              this.saved.emit();
              this.close.emit();
            }
          });
        } else {
          this.isSaving = false;
          this.saved.emit();
          this.close.emit();
        }
      },
      error: () => {
        this.isSaving = false;
        this.error = 'Failed to save vehicle';
      }
    });
  }

  cancel() {
    this.close.emit();
  }
}
