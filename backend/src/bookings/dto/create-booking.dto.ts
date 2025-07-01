/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  IsDate,
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
  IsNotEmpty,
  MinDate,
  ValidateIf,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({
    description: 'ID of the vehicle to book',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  vehicleId: string;

  @ApiProperty({
    description: 'Booking start date',
    example: '2024-07-01T00:00:00.000Z',
    type: Date,
  })
  @IsDate()
  @Type(() => Date)
  @MinDate(new Date(), {
    message: 'Start date must be in the future',
  })
  startDate: Date;

  @ApiProperty({
    description: 'Booking end date',
    example: '2024-07-05T00:00:00.000Z',
    type: Date,
  })
  @IsDate()
  @Type(() => Date)
  @ValidateIf((obj) => obj.startDate)
  @Transform(({ value, obj }) => {
    // Ensure end date is after start date
    if (obj.startDate && new Date(value) <= new Date(obj.startDate)) {
      throw new Error('End date must be after start date');
    }
    return value;
  })
  endDate: Date;

  @ApiProperty({
    description: 'Booking start time',
    example: '2024-07-01T09:00:00.000Z',
    type: Date,
  })
  @IsDate()
  @Type(() => Date)
  startTime: Date;

  @ApiProperty({
    description: 'Booking end time',
    example: '2024-07-05T17:00:00.000Z',
    type: Date,
  })
  @IsDate()
  @Type(() => Date)
  endTime: Date;

  @ApiProperty({
    description: 'Vehicle pickup location',
    example: 'Downtown Office - 123 Main St',
  })
  @IsString()
  @IsNotEmpty()
  pickupLocation: string;

  @ApiProperty({
    description: 'Vehicle return location',
    example: 'Downtown Office - 123 Main St',
  })
  @IsString()
  @IsNotEmpty()
  returnLocation: string;

  @ApiPropertyOptional({
    description: 'Additional notes for the booking',
    example: 'Please have the car ready by 9 AM',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Driver license number',
    example: 'DL123456789',
  })
  @IsString()
  @IsOptional()
  driverLicenseNumber?: string;

  @ApiPropertyOptional({
    description: 'Coupon code for discount',
    example: 'SUMMER2024',
  })
  @IsString()
  @IsOptional()
  couponCode?: string;

  @ApiPropertyOptional({
    description: 'Discount amount to be applied',
    example: 50.0,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0, {
    message: 'Discount price cannot be negative',
  })
  @Type(() => Number)
  discountPrice?: number;
}
