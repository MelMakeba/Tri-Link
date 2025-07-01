import { IsDate, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { VehicleStatus } from '../../../generated/prisma';

export class SetAvailabilityDto {
  @IsEnum(VehicleStatus)
  status: VehicleStatus;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  from?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  to?: Date;

  // Optional: Add validation for status transitions
  // @ValidateIf(o => o.status === 'AVAILABLE')
  // @IsDate()
  // @Type(() => Date)
  // from: Date;
}
