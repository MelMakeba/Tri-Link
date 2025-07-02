import { Vehicle } from './vehicle.model';
import { BookingStep } from './booking-step.enum';

export interface BookingState {
  bookingId: string | null;
  selectedVehicle: Vehicle | null;
  startDate: Date | null;
  endDate: Date | null;
  startTime: string | null;
  endTime: string | null;
  pickupLocation: string;
  returnLocation: string;
  notes: string;
  driverLicenseNumber: string;
  paymentMethod: string | null;
  couponCode: string;
  totalPrice: number;
  finalPrice: number;
  discountPrice: number;
  currentStep: BookingStep;
}