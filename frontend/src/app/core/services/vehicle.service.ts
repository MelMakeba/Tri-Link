import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { of, Observable, throwError } from 'rxjs';
import { tap, catchError, switchMap, map } from 'rxjs/operators';
import { Vehicle } from '../../core/models/vehicle.model';

export interface VehicleCreateRequest {
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  category: string;
  seats: number;
  transmission: string;
  fuelType: string;
  pricePerDay: number;
  status?: string;
  description?: string;
  hasGPS?: boolean;
  hasAC?: boolean;
  hasBluetooth?: boolean;
  hasUSB?: boolean;
  hasWiFi?: boolean;
}

export interface VehicleUpdateRequest extends Partial<VehicleCreateRequest> {
  // Partial makes all fields optional for updates
}

export interface VehicleAvailabilityRequest {
  status: 'available' | 'unavailable' | 'maintenance' | 'rented';
}

export interface VehicleAvailabilityCheck {
  from: string;
  to: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UploadResponse {
  message: string;
  imageUrls: string[];
  vehicleId: string;
}

export interface AvailabilityResponse {
  available: boolean;
  conflicts?: any[];
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AgentVehicleService {
  private baseUrl = 'http://localhost:3000/vehicles';

  constructor(private http: HttpClient) {}


  // Create a new vehicle with images
  createVehicle(vehicle: VehicleCreateRequest, images?: File[]): Observable<Vehicle> {
    console.log('CREATE VEHICLE CALLED WITH:', {
      vehicle,
      images: images ? `${images.length} images: ${images.map(f => f.name).join(', ')}` : 'no images'
    });
    
    // Create FormData object
    const formData = new FormData();
    
    // Add vehicle data as a properly formatted JSON string
    const vehicleJson = JSON.stringify({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      licensePlate: vehicle.licensePlate,
      category: vehicle.category,
      seats: vehicle.seats,
      transmission: vehicle.transmission,
      fuelType: vehicle.fuelType,
      pricePerDay: vehicle.pricePerDay,
      hasGPS: vehicle.hasGPS || false,
      hasAC: vehicle.hasAC || false,
      hasBluetooth: vehicle.hasBluetooth || false,
      hasUSB: vehicle.hasUSB || false,
      hasWiFi: vehicle.hasWiFi || false,
      description: vehicle.description || ""
    });
    
    // Add as a string field (not a Blob)
    formData.append('vehicleData', vehicleJson);
    
    // Add image files with extra logging
    if (images?.length) {
      console.log(`Adding ${images.length} images to form data`);
      images.forEach((file, i) => {
        console.log(`Adding image ${i+1}/${images.length}:`, {
          name: file.name, 
          type: file.type,
          size: `${(file.size/1024).toFixed(2)} KB`
        });
        formData.append('images', file);
      });
    } else {
      console.warn('No images provided for vehicle creation');
    }
    
    // Log the entire form data entries
    console.log('Form data entries:');
    // FormData doesn't have a built-in way to inspect its contents
    // This is a workaround to see what's in it
    for(const pair of (formData as any).entries()) {
      console.log(`${pair[0]}: ${pair[0] === 'images' ? 'File object' : pair[1]}`);
    }
    
    // Send the request
    return this.http.post<Vehicle>(`${this.baseUrl}`, formData).pipe(
      tap(response => {
        console.log('Vehicle created successfully:', response);
        // Check if images are in the response
        if (response.images?.length) {
          console.log(`Response includes ${response.images.length} images:`, response.images);
        } else {
          console.warn('Response does not include any images!');
        }
      }),
      catchError(error => {
        console.error('Error creating vehicle:', error);
        return throwError(() => error);
      })
    );
  }

  // Get all vehicles (paginated)
  getVehicles(page: number = 1, limit: number = 10): Observable<PaginatedResponse<Vehicle>> {
    let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
    console.log('Getting vehicles:', { page, limit });
    
    return this.http.get<PaginatedResponse<Vehicle>>(`${this.baseUrl}`, { params }).pipe(
      tap(response => console.log('Vehicles retrieved:', response)),
      catchError(error => {
        console.error('Error getting vehicles:', error);
        return throwError(() => error);
      })
    );
  }

  // Get a single vehicle by ID
  getVehicleById(id: string): Observable<Vehicle> {
    console.log('Getting vehicle by ID:', id);
    return this.http.get<Vehicle>(`${this.baseUrl}/${id}`).pipe(
      tap(response => console.log('Vehicle retrieved:', response)),
      catchError(error => {
        console.error('Error getting vehicle by ID:', error);
        return throwError(() => error);
      })
    );
  }


  // Delete a vehicle
  deleteVehicle(id: string): Observable<{ message: string }> {
    console.log('Deleting vehicle:', id);
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`).pipe(
      tap(response => console.log('Vehicle deleted:', response)),
      catchError(error => {
        console.error('Error deleting vehicle:', error);
        return throwError(() => error);
      })
    );
  }

  // Upload vehicle images with proper debugging
  uploadVehicleImages(id: string, images: File[]): Observable<UploadResponse> {
    console.log('uploadVehicleImages called with:', { 
      vehicleId: id, 
      imageCount: images.length,
      imageNames: images.map(f => f.name)
    });
    
    if (!id) {
      const error = 'Vehicle ID is required';
      console.error(error);
      return throwError(() => new Error(error));
    }

    if (!images || images.length === 0) {
      const error = 'No images provided for upload';
      console.error(error);
      return throwError(() => new Error(error));
    }

    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const invalidFiles = images.filter(file => !validTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      const error = `Invalid file types: ${invalidFiles.map(f => f.name).join(', ')}`;
      console.error(error);
      return throwError(() => new Error(error));
    }

    const formData = new FormData();
    images.forEach((file, index) => {
      console.log(`Adding file ${index + 1}:`, {
        name: file.name,
        size: file.size,
        type: file.type
      });
      formData.append('images', file);
    });

    const url = `${this.baseUrl}/${id}/images`;
    console.log('Making HTTP POST request to:', url);

    return this.http.post<UploadResponse>(url, formData).pipe(
      tap(response => console.log('Images uploaded successfully:', response)),
      catchError(error => {
        console.error('Image upload failed:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error
        });
        return throwError(() => error);
      })
    );
  }

  // Set vehicle availability
  setVehicleAvailability(id: string, status: VehicleAvailabilityRequest['status']): Observable<Vehicle> {
    console.log('Setting vehicle availability:', { id, status });
    return this.http.put<Vehicle>(`${this.baseUrl}/${id}/availability`, { status }).pipe(
      tap(response => console.log('Vehicle availability updated:', response)),
      catchError(error => {
        console.error('Error setting vehicle availability:', error);
        return throwError(() => error);
      })
    );
  }

  // Check vehicle availability
  checkVehicleAvailability(id: string, from: string, to: string): Observable<AvailabilityResponse> {
    let params = new HttpParams().set('from', from).set('to', to);
    console.log('Checking vehicle availability:', { id, from, to });
    
    return this.http.get<AvailabilityResponse>(`${this.baseUrl}/${id}/availability`, { params }).pipe(
      tap(response => console.log('Vehicle availability checked:', response)),
      catchError(error => {
        console.error('Error checking vehicle availability:', error);
        return throwError(() => error);
      })
    );
  }

  // Update vehicle with optional image upload
  updateVehicle(id: string, update: VehicleUpdateRequest, images?: File[]): Observable<Vehicle> {
    // First update the vehicle data
    return this.http.put<Vehicle>(`${this.baseUrl}/${id}`, update).pipe(
      switchMap(updatedVehicle => {
        // If no images to upload, just return the updated vehicle
        if (!images || images.length === 0) {
          return of(updatedVehicle);
        }
        
        // If images provided, upload them after updating vehicle data
        console.log(`Uploading ${images.length} images for vehicle ${id}`);
        const formData = new FormData();
        
        // Add all images to form data
        images.forEach(file => {
          formData.append('images', file);
        });
        
        // Use the specific endpoint for image uploads
        return this.http.post<any>(`${this.baseUrl}/${id}/images`, formData).pipe(
          map(response => {
            // Combine the updated vehicle with the new image URLs
            return {
              ...updatedVehicle,
              images: response.data.imageUrls || updatedVehicle.images
            };
          })
        );
      }),
      tap(response => console.log('Vehicle updated successfully:', response)),
      catchError(error => {
        console.error('Error updating vehicle:', error);
        return throwError(() => error);
      })
    );
  }

  // Upload images to an existing vehicle
  uploadImages(vehicleId: string, images: File[]): Observable<UploadResponse> {
    console.log(`Uploading ${images.length} images for vehicle ${vehicleId}`);
    const formData = new FormData();
    
    // Add all images to form data
    images.forEach(file => {
      formData.append('images', file);
    });
    
    return this.http.post<UploadResponse>(
      `${this.baseUrl}/${vehicleId}/images`, 
      formData
    ).pipe(
      tap(response => console.log('Images uploaded successfully:', response)),
      catchError(error => {
        console.error('Error uploading images:', error);
        return throwError(() => error);
      })
    );
  }
}