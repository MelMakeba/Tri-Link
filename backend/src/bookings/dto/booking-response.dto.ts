import { BookingStatus } from '../../../generated/prisma';

export class BookingResponseDto {
  id: string;
  bookingNumber: string;
  startDate: Date;
  endDate: Date;
  startTime: Date;
  endTime: Date;
  status: BookingStatus;
  totalPrice: number;
  discountPrice?: number;
  finalPrice: number;
  couponCode?: string;
  pickupLocation: string;
  returnLocation: string;
  notes?: string;
  driverLicenseNumber?: string;
  createdAt: Date;
  updatedAt: Date;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  vehicle: {
    id: string;
    make: string;
    model: string;
    licensePlate: string;
  };
}
