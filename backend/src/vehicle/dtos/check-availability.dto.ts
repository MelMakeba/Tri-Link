import { Type } from 'class-transformer';
import { IsDate } from 'class-validator';

export class CheckAvailabilityDto {
  @IsDate()
  @Type(() => Date)
  from: Date;

  @IsDate()
  @Type(() => Date)
  to: Date;
}
