import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({
    description: 'ID of the vehicle to book',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID()
  vehicleId: string;

  @ApiProperty({
    description: 'Booking start date',
    example: '2024-07-01T00:00:00.000Z',
    type: Date,
  })
  @IsNotEmpty()
  @IsDateString()
  startDate: Date;

  @ApiProperty({
    description: 'Booking end date',
    example: '2024-07-05T00:00:00.000Z',
    type: Date,
  })
  @IsNotEmpty()
  @IsDateString()
  endDate: Date;

  @ApiProperty({
    description: 'Booking start time',
    example: '2024-07-01T09:00:00.000Z',
    type: Date,
  })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiProperty({
    description: 'Booking end time',
    example: '2024-07-05T17:00:00.000Z',
    type: Date,
  })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiProperty({
    description: 'Vehicle pickup location',
    example: 'Downtown Office - 123 Main St',
  })
  @IsNotEmpty()
  @IsString()
  pickupLocation: string;

  @ApiProperty({
    description: 'Vehicle return location',
    example: 'Downtown Office - 123 Main St',
  })
  @IsNotEmpty()
  @IsString()
  returnLocation: string;

  @ApiPropertyOptional({
    description: 'Additional notes for the booking',
    example: 'Please have the car ready by 9 AM',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Driver license number',
    example: 'DL123456789',
  })
  @IsOptional()
  @IsString()
  driverLicenseNumber?: string;

  @ApiPropertyOptional({
    description: 'Coupon code for discount',
    example: 'SUMMER2024',
  })
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiPropertyOptional({
    description: 'Discount amount to be applied',
    example: 50.0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  discountPrice?: number;
}
