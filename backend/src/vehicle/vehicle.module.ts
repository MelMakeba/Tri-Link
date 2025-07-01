import { Module } from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { VehicleController } from './vehicle.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ApiResponseService } from 'src/shared/api-response.service';
import { ConfigService } from '@nestjs/config';
import { CloudinaryService } from 'src/shared/cloudinary/cloudinary.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [],
  controllers: [VehicleController],
  providers: [
    VehicleService,
    PrismaService,
    ApiResponseService,
    ConfigService,
    CloudinaryService,
    JwtService,
  ],
  exports: [VehicleService],
})
export class VehicleModule {}
