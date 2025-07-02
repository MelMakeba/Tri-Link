import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { BookingDto } from '../models/booking.model';
import { Vehicle, VehicleApiResponse } from '../models/vehicle.model';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  
  private baseUrl = `http://localhost:3000/bookings`;

  constructor(private http: HttpClient) { }

  searchAvailableVehicles(
    startDate: string, 
    endDate: string, 
    location?: string, 
    category?: string
  ): Observable<VehicleApiResponse> {
    let params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    
    if (location) {
      params = params.set('location', location);
    }
    
    if (category) {
      params = params.set('category', category);
    }
    
    return this.http.get<VehicleApiResponse>(`${this.baseUrl}/availability/search`, { params });
  }

  createBooking(booking: BookingDto): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(this.baseUrl, booking);
  }

  getBookingDetails(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/get/${id}`);
  }

  cancelBooking(id: string): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.baseUrl}/${id}/cancel`, {});
  }
  
  getMyBookings(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/get-all`);
  }
  updateBookingStatus(bookingId: string, status: string, notes?: string): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(
      `${this.baseUrl}/${bookingId}/status`,
      { 
        status, 
        ...(notes ? { notes } : {})
      }
    );
  }

  getBookings(page: number = 1, limit: number = 10, filters?: any): Observable<ApiResponse<any>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    // Add optional filters
    if (filters) {
      if (filters.status) params = params.set('status', filters.status);
      if (filters.startDate) params = params.set('startDate', filters.startDate);
      if (filters.endDate) params = params.set('endDate', filters.endDate);
      if (filters.searchTerm) params = params.set('searchTerm', filters.searchTerm);
    }
    
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/get-all`, { params });
  }

}