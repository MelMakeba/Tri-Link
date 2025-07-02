import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { ConfigService } from '@nestjs/config';
import { ApiResponseService } from 'src/shared/api-response.service';
import { MailerModule } from 'src/shared/mailer/mailer.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { VehicleService } from 'src/vehicle/vehicle.service';
import { VehicleModule } from 'src/vehicle/vehicle.module';
import { CloudinaryService } from 'src/shared/cloudinary/cloudinary.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  providers: [
    BookingsService,
    ConfigService,
    ApiResponseService,
    PrismaService,
    VehicleService,
    CloudinaryService,
    JwtService,
  ],
  imports: [MailerModule, VehicleModule],
  controllers: [BookingsController],
})
export class BookingsModule {}
