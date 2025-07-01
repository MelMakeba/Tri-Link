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

  // For file upload - Limited to exactly 2 images
  selectedFiles: File[] = [];
  previewUrls: string[] = [];
  private readonly MAX_IMAGES = 2;
  private maxFileSize = 5 * 1024 * 1024; // 5MB
  private allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];

  // Categories and options based on your API
  categories = ['Sedan', 'SUV', 'Hatchback', 'Truck', 'Van', 'Convertible', 'Coupe'];
  transmissions = ['Manual', 'Automatic'];
  fuelTypes = ['Gasoline', 'Diesel', 'Electric', 'Hybrid'];

  showForm = false;

  constructor(private vehicleService: AgentVehicleService) {}

  ngOnInit() {
    // Set timeout to trigger animation
    setTimeout(() => {
      this.showForm = true;
    }, 50);

    if (this.vehicle) {
      this.form = { ...this.vehicle };
      this.previewUrls = this.vehicle.images ? 
        this.vehicle.images.map(img => typeof img === 'string' ? img : '').slice(0, this.MAX_IMAGES) : [];
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
        transmission: 'Automatic',
        fuelType: 'Gasoline',
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
    const dropZone = event.currentTarget as HTMLElement;
    dropZone.classList.add('drag-over');
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const dropZone = event.currentTarget as HTMLElement;
    dropZone.classList.remove('drag-over');
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const dropZone = event.currentTarget as HTMLElement;
    dropZone.classList.remove('drag-over');
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFiles(files);
    }
  }

  // Fix for vehicle form image handling
  private handleFiles(files: FileList) {
    this.error = null;

    // Check if trying to upload more than 2 images
    if (files.length > this.MAX_IMAGES) {
      this.error = `Please select exactly ${this.MAX_IMAGES} images. You selected ${files.length}.`;
      return;
    }

    // Check if total would exceed limit
    if (this.selectedFiles.length + files.length > this.MAX_IMAGES) {
      this.error = `Maximum ${this.MAX_IMAGES} images allowed. You currently have ${this.selectedFiles.length} selected.`;
      return;
    }

    const validFiles: File[] = [];
    const newPreviewUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file type
      if (!this.allowedTypes.includes(file.type)) {
        this.error = 'Please select valid image files (PNG, JPG, JPEG)';
        continue;
      }
      
      // Validate file size
      if (file.size > this.maxFileSize) {
        this.error = 'Each file must be less than 5MB';
        continue;
      }

      validFiles.push(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviewUrls.push(e.target?.result as string);
        
        // Update arrays when all files are processed
        if (newPreviewUrls.length === validFiles.length) {
          this.selectedFiles = [...this.selectedFiles, ...validFiles].slice(0, this.MAX_IMAGES);
          this.previewUrls = [...this.previewUrls, ...newPreviewUrls].slice(0, this.MAX_IMAGES);
        }
      };
      reader.readAsDataURL(file);
    }

    if (validFiles.length === 0 && !this.error) {
      this.error = 'No valid files selected';
    }
  }

  removeImage(index: number) {
    this.selectedFiles.splice(index, 1);
    this.previewUrls.splice(index, 1);
    this.error = null;
  }

  clearAllImages() {
    this.selectedFiles = [];
    this.previewUrls = [];
    this.form.images = [];
    this.error = null;
  }

  isFormValid(): boolean {
    return !!(
      this.form.make?.trim() &&
      this.form.model?.trim() &&
      this.form.year &&
      this.form.color?.trim() &&
      this.form.licensePlate?.trim() &&
      this.form.category &&
      this.form.seats &&
      this.form.transmission &&
      this.form.fuelType &&
      this.form.pricePerDay !== undefined &&
      this.form.pricePerDay >= 0
    );
  }

  save() {
    if (!this.isFormValid()) {
      this.error = 'Please fill in all required fields';
      return;
    }

    // Validate image count
    if (this.selectedFiles.length !== this.MAX_IMAGES && !this.vehicle) {
      this.error = `Please select exactly ${this.MAX_IMAGES} images`;
      return;
    }

    this.isSaving = true;
    this.error = null;

    // FIXED: Pass the selectedFiles to createVehicle for new vehicles
    const saveOrUpdate$ = this.vehicle && this.vehicle.id
      ? this.vehicleService.updateVehicle(this.vehicle.id, this.form)
      : this.vehicleService.createVehicle({
          make: this.form.make || '',
          model: this.form.model || '',
          year: this.form.year || 0,
          color: this.form.color || '',
          licensePlate: this.form.licensePlate || '',
          category: this.form.category || '',
          seats: this.form.seats || 0,
          transmission: this.form.transmission || '',
          fuelType: this.form.fuelType || '',
          pricePerDay: this.form.pricePerDay || 0,
          status: this.form.status || 'AVAILABLE',
          description: this.form.description || '',
          hasGPS: this.form.hasGPS || false,
          hasAC: this.form.hasAC || false,
          hasBluetooth: this.form.hasBluetooth || false,
          hasUSB: this.form.hasUSB || false,
          hasWiFi: this.form.hasWiFi || false
        }, this.selectedFiles); // Pass the selected files here!

    saveOrUpdate$.subscribe({
      next: (vehicleRes) => {
        // For existing vehicles that were updated, handle image upload separately
        if (this.vehicle && this.vehicle.id && this.selectedFiles.length > 0) {
          // Ensure exactly 2 images
          const imagesToUpload = this.selectedFiles.slice(0, this.MAX_IMAGES);
          
          this.vehicleService.uploadVehicleImages(vehicleRes.id, imagesToUpload).subscribe({
            next: () => {
              this.isSaving = false;
              this.saved.emit();
              this.close.emit();
            },
            error: (error) => {
              console.error('Image upload failed:', error);
              this.isSaving = false;
              this.error = 'Vehicle saved, but image upload failed.';
              this.saved.emit();
              this.close.emit();
            }
          });
        } else {
          // For new vehicles, images are already uploaded within createVehicle
          this.isSaving = false;
          this.saved.emit();
          this.close.emit();
        }
      },
      error: (error) => {
        console.error('Vehicle save failed:', error);
        this.isSaving = false;
        this.error = 'Failed to save vehicle. Please try again.';
      }
    });
  }

  cancel() {
    this.showForm = false;
    setTimeout(() => {
      this.close.emit();
    }, 300); // Match transition duration
  }

  // Helper methods for template
  get canAddImages(): boolean {
    return this.selectedFiles.length < this.MAX_IMAGES;
  }

  get remainingImageSlots(): number {
    return this.MAX_IMAGES - this.selectedFiles.length;
  }

  get imageCountText(): string {
    return `${this.selectedFiles.length}/${this.MAX_IMAGES} images selected`;
  }

  getFileNames(): string {
    return this.selectedFiles.map(file => file.name).join(', ');
  }
}
