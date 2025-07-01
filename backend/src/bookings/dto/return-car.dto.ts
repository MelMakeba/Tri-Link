import { IsString, IsNumber, IsOptional } from 'class-validator';

export class ReturnCarDto {
  @IsString()
  condition: string;

  @IsString()
  fuelLevel: string;

  @IsNumber()
  @IsOptional()
  mileage?: number;
}
