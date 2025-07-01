import { VehicleStatus } from '../../../generated/prisma';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  make: string;

  @IsString()
  model: string;

  @IsNumber()
  year: number;

  @IsString()
  color: string;

  @IsString()
  licensePlate: string;

  @IsString()
  @IsOptional()
  vin?: string;

  @IsString()
  @IsOptional()
  status?: VehicleStatus;

  @IsString()
  category: string;

  @IsNumber()
  seats: number;

  @IsString()
  transmission: string;

  @IsString()
  fuelType: string;

  @IsNumber()
  @IsOptional()
  mileage?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsNumber()
  pricePerDay: number;

  @IsNumber()
  @IsOptional()
  pricePerHour?: number;

  @IsBoolean()
  @IsOptional()
  hasGPS?: boolean;

  @IsBoolean()
  @IsOptional()
  hasAC?: boolean;

  @IsBoolean()
  @IsOptional()
  hasBluetooth?: boolean;

  @IsBoolean()
  @IsOptional()
  hasUSB?: boolean;

  @IsBoolean()
  @IsOptional()
  hasWiFi?: boolean;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  country?: string;
}
