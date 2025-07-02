/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma';
import { BookingStatus } from '../../generated/prisma';
import { AuthGuard } from 'src/auth/guards/auth-guard';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiResponse({ status: 201, description: 'Booking created successfully.' })
  async create(@Req() req, @Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(req.user.id, createBookingDto);
  }

  @Get('get-all')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all bookings (paginated)' })
  @ApiResponse({ status: 200, description: 'Returns all bookings.' })
  async findAll(
    @Req() req,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: BookingStatus,
  ) {
    const userId = req.user.id;
    const role = req.user.role;

    // Only admins can see all bookings
    if (role === UserRole.ADMIN) {
      return this.bookingsService.findAll(page, limit, status);
    }

    // Agents see bookings for their vehicles
    if (role === UserRole.AGENT) {
      return this.bookingsService.findAllForAgent(userId, page, limit, status);
    }

    // Customers see their own bookings
    return this.bookingsService.findAllForCustomer(userId, page, limit, status);
  }

  @Get('/availability/search')
  @ApiOperation({ summary: 'Search for available vehicles in a date range' })
  @ApiResponse({ status: 200, description: 'Returns available vehicles.' })
  async searchAvailability(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('location') location?: string,
    @Query('category') category?: string,
  ) {
    return this.bookingsService.findAvailableVehicles(
      startDate,
      endDate,
      location,
      category,
    );
  }

  @Get('get/:id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get booking by ID' })
  @ApiResponse({ status: 200, description: 'Returns booking by ID.' })
  async findOne(@Req() req, @Param('id') id: string) {
    const userId = req.user.id;
    const role = req.user.role;

    return this.bookingsService.findOne(id, userId, role);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a booking' })
  @ApiResponse({ status: 200, description: 'Booking updated successfully.' })
  async update(
    @Req() req,
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
  ) {
    return this.bookingsService.update(id, updateBookingDto, req.user);
  }

  @Put(':id/status')
  @UseGuards(AuthGuard)
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update booking status' })
  @ApiResponse({
    status: 200,
    description: 'Booking status updated successfully.',
  })
  async updateStatus(
    @Req() req,
    @Param('id') id: string,
    @Body('status') status: BookingStatus,
  ) {
    return this.bookingsService.updateStatus(id, status, req.user);
  }

  @Put(':id/cancel')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a booking' })
  @ApiResponse({ status: 200, description: 'Booking cancelled successfully.' })
  async cancelBooking(@Req() req, @Param('id') id: string) {
    return this.bookingsService.cancelBooking(id, req.user);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a booking' })
  @ApiResponse({ status: 200, description: 'Booking deleted successfully.' })
  async remove(@Req() req, @Param('id') id: string) {
    return this.bookingsService.remove(id, req.user);
  }
}
