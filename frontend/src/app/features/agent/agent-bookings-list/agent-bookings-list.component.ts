import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BookingService } from '../../../core/services/booking.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { Router, RouterLinkActive, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-agent-bookings-list',
  imports: [CommonModule, ReactiveFormsModule, RouterLinkActive, RouterModule],
  standalone: true,
  templateUrl: './agent-bookings-list.component.html',
  styleUrls: ['./agent-bookings-list.component.css']
})
export class AgentBookingsListComponent implements OnInit, OnDestroy {
  bookings: any[] = [];
  isLoading = false;
  error: string | null = null;
  
  // Pagination
  currentPage = 1;
  totalPages = 1;
  pageSize = 10;
  
  // Filtering
  filterForm: FormGroup;
  
  private subscription = new Subscription();
  
  constructor(
    private bookingService: BookingService,
    private notification: NotificationService,
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.filterForm = this.fb.group({
      status: [''],
      startDate: [''],
      endDate: [''],
      searchTerm: ['']
    });
  }
  
  ngOnInit(): void {
    this.loadAgentBookings();
    
    // Apply filters when form changes
    this.subscription.add(
      this.filterForm.valueChanges.pipe(
        debounceTime(500)
      ).subscribe(() => {
        this.currentPage = 1;
        this.loadAgentBookings();
      })
    );
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  
  loadAgentBookings(): void {
    this.isLoading = true;
    
    const filters = this.filterForm.value;
    
    // Get bookings - the backend should filter for the agent's vehicles only
    this.subscription.add(
      this.bookingService.getBookings(
        this.currentPage,
        this.pageSize,
        filters
      ).subscribe({
        next: (response) => {
          this.bookings = response.data.bookings || response.data;
          this.totalPages = Math.ceil((response.data.total || response.data.length) / this.pageSize);
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Failed to load bookings';
          this.notification.error(this.error);
          this.isLoading = false;
        }
      })
    );
  }
  
  // Add missing methods referenced in template
  
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadAgentBookings();
    }
  }
  
  clearFilters(): void {
    this.filterForm.reset({
      status: '',
      startDate: '',
      endDate: '',
      searchTerm: ''
    });
  }
  
  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'ACTIVE':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
  
  viewDetails(bookingId: string): void {
    this.router.navigate(['/agent/bookings', bookingId]);
  }
  
  updateBookingStatus(bookingId: string, status: string): void {
    this.isLoading = true;
    
    this.subscription.add(
      this.bookingService.updateBookingStatus(bookingId, status).subscribe({
        next: () => {
          this.notification.success(`Booking status updated to ${status}`);
          this.loadAgentBookings();
        },
        error: () => {
          this.notification.error('Failed to update booking status');
          this.isLoading = false;
        }
      })
    );
  }
}
