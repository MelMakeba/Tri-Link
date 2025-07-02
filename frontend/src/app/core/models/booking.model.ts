import { User } from './user.model';
import { Vehicle } from './vehicle.model';

// Match the BookingStatus enum from the backend
export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED'
}

// For creating new bookings
export interface BookingDto {
  vehicleId: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  pickupLocation: string;
  returnLocation: string;
  notes?: string;
  driverLicenseNumber?: string;
  couponCode?: string;
  discountPrice?: number;  
}

// Complete booking model matching the backend schema
export interface Booking {
  // Primary fields
  id: string;
  bookingNumber: string;
  vehicleId: string;
  
  // Status
  status: string; // Changed to string for flexibility
  
  // Date and time fields
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  
  // Price details
  totalPrice: number;
  discountPrice?: number;
  finalPrice: number;
  couponCode?: string;
  
  // Location details
  pickupLocation: string;
  returnLocation: string;
  
  // Additional info
  notes?: string;
  driverLicenseNumber?: string;
  
  // Timestamps
  createdAt?: string; // Made optional
  updatedAt?: string; // Made optional
  
  // Relations (optional for responses that don't include them)
  customerId: string;
 
  // Define these properties to match the template
  customer?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  
  vehicle?: {
    make: string;
    model: string;
    year: number;
    category: string;
    images?: string[];
    seats?: number;
    transmission?: string;
    fuelType?: string;
  };
}

// Helper functions for date conversions
export function formatDateForApi(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function parseBookingDates(booking: Booking): Booking & { 
  startDateObj: Date;
  endDateObj: Date;
  createdAtObj?: Date;
  updatedAtObj?: Date;
} {
  return {
    ...booking,
    startDateObj: new Date(booking.startDate),
    endDateObj: new Date(booking.endDate),
    createdAtObj: booking.createdAt ? new Date(booking.createdAt) : undefined,
    updatedAtObj: booking.updatedAt ? new Date(booking.updatedAt) : undefined
  };
}