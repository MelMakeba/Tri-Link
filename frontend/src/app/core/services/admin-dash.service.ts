import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminDashboardService {
  private apiUrl = 'http://localhost:3000/admin';

  constructor(private http: HttpClient) {}

  getSystemStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats`);
  }

  getRevenueAnalytics(days: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/analytics/revenue?days=${days}`);
  }

  getAllBookings() {
    return this.http.get(`${this.apiUrl}/bookings`);
  }

  getBookingsByStatus(status: string) {
    return this.http.get(`${this.apiUrl}/bookings?status=${status}`);
  }

  getPendingBookings() {
    return this.http.get(`${this.apiUrl}/bookings/pending`);
  }

  approveBooking(bookingId: string, adminNotes: string) {
    return this.http.put(`${this.apiUrl}/bookings/${bookingId}/approve`, {
      status: 'CONFIRMED',
      adminNotes
    });
  }

  rejectBooking(bookingId: string, adminNotes: string) {
    return this.http.put(`${this.apiUrl}/bookings/${bookingId}/approve`, {
      status: 'CANCELLED',
      adminNotes
    });
  }

  getAllUsers() {
    return this.http.get(`${this.apiUrl}/users`);
  }

  getUserDetails(userId: string) {
    return this.http.get(`${this.apiUrl}/users/${userId}`);
  }

  updateUserStatus(userId: string, isActive: boolean) {
    return this.http.patch(`${this.apiUrl}/users/${userId}/status`, { isActive });
  }

  changeUserRole(userId: string, role: string) {
    return this.http.put(`${this.apiUrl}/users/${userId}/role`, { role });
  }

  deleteUser(userId: string) {
    return this.http.delete(`${this.apiUrl}/users/${userId}`);
  }

  getAllCars() {
    return this.http.get(`${this.apiUrl}/cars`);
  }

  getCarDetails(carId: string) {
    return this.http.get(`${this.apiUrl}/cars/${carId}`);
  }

  getAllFeedback(): Observable<any> {
    return this.http.get(`${this.apiUrl}/feedback`);
  }

  getAllDisputes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/disputes`);
  }
}