import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingService } from '../../../core/services/booking.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/user.model';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-booking-details',
  templateUrl: './booking-details.component.html',
  styleUrls: ['./booking-details.component.css']
})
export class BookingDetailsComponent implements OnInit, OnDestroy {
  booking: any = null;
  isLoading = false;
  error: string | null = null;
  userRole: string = '';
  
  statusUpdateForm: FormGroup;
  isUpdatingStatus = false;
  
  private subscription = new Subscription();
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookingService: BookingService,
    private notification: NotificationService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.statusUpdateForm = this.fb.group({
      status: [''],
      notes: ['']
    });
  }
  
  ngOnInit(): void {
    this.userRole = this.authService.getCurrentUser()?.role || '';
    
    this.route.paramMap.subscribe(params => {
      const bookingId = params.get('id');
      if (bookingId) {
        this.loadBookingDetails(bookingId);
      }
    });
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  
  loadBookingDetails(bookingId: string): void {
    this.isLoading = true;
    
    this.subscription.add(
      this.bookingService.getBookingDetails(bookingId).subscribe({
        next: (response) => {
          this.booking = response.data;
          
          // Set current status in form
          this.statusUpdateForm.patchValue({
            status: this.booking.status
          });
          
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Failed to load booking details';
          this.notification.error(this.error);
          this.isLoading = false;
        }
      })
    );
  }
  
  updateBookingStatus(): void {
    if (this.statusUpdateForm.invalid || !this.booking) {
      return;
    }
    
    const formData = this.statusUpdateForm.value;
    this.isUpdatingStatus = true;
    
    this.subscription.add(
      this.bookingService.updateBookingStatus(
        this.booking.id, 
        formData.status,
        formData.notes
      ).subscribe({
        next: (response) => {
          this.notification.success('Booking status updated successfully');
          this.booking = response.data;
          this.isUpdatingStatus = false;
        },
        error: (err) => {
          this.notification.error('Failed to update booking status');
          this.isUpdatingStatus = false;
        }
      })
    );
  }
  
  canEditStatus(): boolean {
    if (!this.booking) return false;
    
    // Admin can edit all bookings
    if (this.userRole === UserRole.ADMIN) {
      return true;
    }
    
    // Agents can only edit their own vehicle bookings
    if (this.userRole === UserRole.AGENT) {
      return this.booking.vehicle?.agent?.id === this.authService.getCurrentUser()?.id;
    }
    
    return false;
  }
  
  goBack(): void {
    if (this.userRole === UserRole.ADMIN) {
      this.router.navigate(['/admin/bookings']);
    } else if (this.userRole === UserRole.AGENT) {
      this.router.navigate(['/agent/bookings']);
    } else {
      this.router.navigate(['/bookings']);
    }
  }
}
