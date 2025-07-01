import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AgentVehicleService {
  private baseUrl = 'http://localhost:3000/vehicles';

  constructor(private http: HttpClient) {}

  // Create a new vehicle
  createVehicle(vehicle: any): Observable<any> {
    return this.http.post(`${this.baseUrl}`, vehicle);
  }

  // Get all vehicles (paginated)
  getVehicles(page: number = 1, limit: number = 10): Observable<any> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get(`${this.baseUrl}`, { params });
  }

  // Get a single vehicle by ID
  getVehicleById(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`);
  }

  // Update a vehicle
  updateVehicle(id: string, update: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, update);
  }

  // Delete a vehicle
  deleteVehicle(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  // Upload vehicle images
  uploadVehicleImages(id: string, images: File[]): Observable<any> {
    const formData = new FormData();
    images.forEach((file) => formData.append('images', file));
    return this.http.post(`${this.baseUrl}/${id}/images`, formData);
  }

  // Set vehicle availability
  setVehicleAvailability(id: string, status: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}/availability`, { status });
  }

  // Check vehicle availability
  checkVehicleAvailability(id: string, from: string, to: string): Observable<any> {
    let params = new HttpParams().set('from', from).set('to', to);
    return this.http.get(`${this.baseUrl}/${id}/availability`, { params });
  }
}