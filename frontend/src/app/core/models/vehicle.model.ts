export type VehicleStatus = 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'INACTIVE';

export interface Vehicle {
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
  hasGPS: boolean;
  hasAC: boolean;
  hasBluetooth: boolean;
  hasUSB: boolean;
  hasWiFi: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  location?: string;
  city?: string;
  country?: string;
  availableFrom?: string; // ISO date string
  availableTo?: string;   // ISO date string
  agentId?: string;
  // agent?: User; // Uncomment and import User if you want to include agent details
  // bookings?: Booking[]; // Uncomment and import Booking if needed
  // reviews?: Review[];   // Uncomment and import Review if needed
}

// Create this interface to match your API response structure
export interface VehicleApiResponse {
  success: boolean;
  message: string;
  data: {
    vehicles: VehicleFromApi[];
    count: number;
  };
  statusCode: number;
  timestamp: string;
}

// Create a separate interface for the vehicle data from API
export interface VehicleFromApi {
  id: string;
  make: string;
  model: string;
  year: number;
  category: string;
  transmission: string;
  fuelType: string;
  seats: number;
  pricePerDay: number;
  location: string | null;
  description: string | null;
  hasAC: boolean;
  hasGPS: boolean;
  hasBluetooth: boolean;
  hasUSB: boolean;
  agent: string | null;
  images: string[];
}