import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { BookingStatus, UserRole } from 'generated/prisma';

export class BookingApprovalDto {
  @IsEnum(['CONFIRMED', 'CANCELLED'])
  status: 'CONFIRMED' | 'CANCELLED';

  @IsOptional()
  @IsString()
  adminNotes?: string;
}

export class DisputeResolutionDto {
  @IsNotEmpty()
  @IsString()
  resolution: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  refundAmount?: number;

  @IsNotEmpty()
  @IsString()
  adminNotes: string;
}

export class UpdateUserStatusDto {
  @IsOptional()
  isActive?: boolean;
}

export class UpdateCarStatusDto {
  @IsOptional()
  isAvailable?: boolean;
}

export class ChangeUserRoleDto {
  @IsEnum(UserRole)
  role: UserRole;
}

export class BookingFilterDto {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  carId?: string;

  @IsOptional()
  @IsString()
  locationId?: string;
}

export class RevenueAnalyticsDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  days?: number = 30;
}
