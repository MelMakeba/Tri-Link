import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private baseUrl = 'http://localhost:3000/bookings';

  constructor(private http: HttpClient) {}

  // Get all bookings for the current customer
  getCustomerBookings(): Observable<any> {
    return this.http.get(`${this.baseUrl}`);
  }

  // Get a single booking by ID (Customer)
  getBookingById(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`);
  }

  // Create a new booking (Customer)
  createBooking(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}`, data);
  }

  // Update a booking (Customer)
  updateBooking(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, data);
  }

  // Cancel a booking (Customer)
  cancelBooking(id: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}/cancel`, {});
  }

  // Get all bookings for agent's vehicles (Agent)
  getAgentBookings(): Observable<any> {
    return this.http.get(`${this.baseUrl}/agent/mine`);
  }

  // Update booking status (Agent/Admin)
  updateBookingStatus(id: string, status: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}/status`, { status });
  }

  // Return a car (Agent/Admin)
  returnCar(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}/return`, data);
  }

  // Search available vehicles (Public)
  searchAvailableVehicles(params: { startDate: string, endDate: string, location: string, category: string }): Observable<any> {
    let httpParams = new HttpParams()
      .set('startDate', params.startDate)
      .set('endDate', params.endDate)
      .set('location', params.location)
      .set('category', params.category);

    return this.http.get(`${this.baseUrl}/availability/search`, { params: httpParams });
  }
}