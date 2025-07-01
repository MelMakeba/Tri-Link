import { VehicleStatus } from '../../../generated/prisma';

export class VehicleResponseDto {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  vin?: string;
  status: VehicleStatus;
  category: string;
  seats: number;
  transmission: string;
  fuelType: string;
  mileage?: number;
  description?: string;
  images: string[];
  pricePerDay: number;
  pricePerHour?: number;
  features: {
    hasGPS: boolean;
    hasAC: boolean;
    hasBluetooth: boolean;
    hasUSB: boolean;
    hasWiFi: boolean;
  };
  location?: string;
  city?: string;
  country?: string;
  createdAt: Date;
  updatedAt: Date;
}
