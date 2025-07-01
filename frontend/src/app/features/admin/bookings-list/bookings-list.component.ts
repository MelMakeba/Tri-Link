import { Component, OnInit } from '@angular/core';
import { AdminDashboardService } from '../../../core/services/admin-dash.service';
import { CommonModule } from '@angular/common';
import { RouterLinkActive, RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-bookings-list',
  templateUrl: './bookings-list.component.html',
  imports: [CommonModule, RouterModule, RouterLinkActive]
})
export class BookingsListComponent implements OnInit {
  bookings: any[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(private adminService: AdminDashboardService) {}

  ngOnInit() {
    this.loadBookings();
  }

  loadBookings(status?: string) {
    this.isLoading = true;
    const obs = status
      ? this.adminService.getBookingsByStatus(status)
      : this.adminService.getAllBookings();
    obs.subscribe({
      next: (data: any) => {
        this.bookings = data;
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Failed to load bookings';
        this.isLoading = false;
      }
    });
  }

  approve(bookingId: string, notes: string) {
    this.adminService.approveBooking(bookingId, notes).subscribe(() => this.loadBookings());
  }

  reject(bookingId: string, notes: string) {
    this.adminService.rejectBooking(bookingId, notes).subscribe(() => this.loadBookings());
  }
}