// src/booking/booking.controller.ts
import {
  Controller,
  Post,
  Get,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { BookingService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { ReturnCarDto } from './dto/return-car.dto';
import { AuthGuard } from '../auth/guards/auth-guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, BookingStatus } from '../../generated/prisma';
import { Request } from 'express';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: { id: string; role: UserRole };
}

@ApiTags('Bookings')
@ApiBearerAuth()
@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @UseGuards(AuthGuard)
  @Roles(UserRole.CUSTOMER)
  async create(
    @Body() createBookingDto: CreateBookingDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.bookingService.create(req.user.id, createBookingDto, req);
  }

  @Get()
  @UseGuards(AuthGuard)
  @Roles(UserRole.CUSTOMER)
  async findAllForCustomer(@Req() req: AuthenticatedRequest) {
    return this.bookingService.findAllForCustomer(req.user.id, req);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @Roles(UserRole.CUSTOMER)
  async findOneForCustomer(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.bookingService.findOneForCustomer(req.user.id, id, req);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  @Roles(UserRole.CUSTOMER)
  async updateForCustomer(
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.bookingService.updateForCustomer(
      req.user.id,
      id,
      updateBookingDto,
      req,
    );
  }

  @Put(':id/cancel')
  @UseGuards(AuthGuard)
  @Roles(UserRole.CUSTOMER)
  async cancel(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.bookingService.cancelBooking(req.user.id, id, req);
  }

  @Get('agent/mine')
  @UseGuards(AuthGuard)
  @Roles(UserRole.AGENT)
  async findAllForAgent(@Req() req: AuthenticatedRequest) {
    return this.bookingService.findAllForAgent(req.user.id, req);
  }

  @Put(':id/status')
  @UseGuards(AuthGuard)
  @Roles(UserRole.AGENT, UserRole.ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: BookingStatus,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.bookingService.updateStatus(id, status, req);
  }

  @Put(':id/return')
  @UseGuards(AuthGuard)
  @Roles(UserRole.AGENT, UserRole.ADMIN)
  async returnCar(
    @Param('id') id: string,
    @Body() returnCarDto: ReturnCarDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.bookingService.returnCar(id, returnCarDto, req);
  }

  @Get('availability/search')
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiQuery({ name: 'location', required: false })
  @ApiQuery({ name: 'category', required: false })
  async searchAvailableVehicles(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('location') location?: string,
    @Query('category') category?: string,
  ) {
    return this.bookingService.searchAvailableVehicles(
      new Date(startDate),
      new Date(endDate),
      location,
      category,
    );
  }
}
