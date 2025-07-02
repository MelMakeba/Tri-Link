/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, VehicleStatus } from 'generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { ReturnCarDto } from './dto/return-car.dto';
import { BookingResponseDto } from './dto/booking-response.dto';
import { Booking, BookingStatus, User, Vehicle } from '../../generated/prisma';
import { ApiResponseService } from '../shared/api-response.service';
import { Request } from 'express';
import { MailerService } from '../shared/mailer/mailer.service';
import { VehicleService } from '../vehicle/vehicle.service';
import { PaymentStatus } from '../../generated/prisma';
import { UserRole } from '../../generated/prisma';
import { ApiResponse } from 'src/shared/interfaces/api-response.interface';

// Type definitions for bookings with relations
type BookingWithRelations = Booking & {
  customer: User;
  vehicle: Vehicle & {
    agent?: User | null;
  };
};

interface BookingNotificationContext {
  bookingNumber: string;
  customerName: string;
  agentName?: string;
  vehicleDetails: string;
  startDate: string;
  endDate: string;
  returnDate?: string;
  totalPrice: number;
  status: string;
  pickupLocation: string;
  returnLocation: string;
  condition?: string;
  fuelLevel?: string;
  mileage?: number;
  // Add missing properties
  name: string;
  car: string;
  bookingDate: string;
  price: number;
}

@Injectable()
export class BookingsService {
  async update(
    id: string,
    updateBookingDto: UpdateBookingDto,
    user: { id: string; role: UserRole },
  ): Promise<ApiResponse<BookingResponseDto>> {
    // Find the booking
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: {
          include: {
            agent: true,
          },
        },
      },
    });

    // Check if booking exists
    if (!booking) {
      throw new NotFoundException(
        this.apiResponse.notFound('Booking not found', `/bookings/${id}`),
      );
    }

    // Check permissions based on role
    if (
      (user.role !== UserRole.ADMIN &&
        user.role === UserRole.CUSTOMER &&
        booking.customerId !== user.id) ||
      (user.role === UserRole.AGENT &&
        booking.vehicle.agent &&
        booking.vehicle.agent.id !== user.id)
    ) {
      throw new ForbiddenException(
        this.apiResponse.forbidden(
          'You are not authorized to update this booking',
        ),
      );
    }

    // Prevent updating certain fields based on role
    let updateData: any = { ...updateBookingDto };

    // Remove relation fields that can't be directly updated
    delete updateData.vehicleId;
    delete updateData.customerId;

    // Only admin and agents can update status
    if (user.role === UserRole.CUSTOMER) {
      const { status, ...allowedUpdates } = updateData;
      updateData = allowedUpdates;
    }

    // Update booking
    const updatedBooking = await this.prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        vehicle: {
          include: {
            agent: true,
          },
        },
      },
    });

    // Return updated booking
    return this.apiResponse.success(
      this.toBookingResponseDto(updatedBooking),
      'Booking updated successfully',
    );
  }

  async remove(
    id: string,
    user: { id: string; role: UserRole },
  ): Promise<ApiResponse<{ id: string }>> {
    // Check if user is admin
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        this.apiResponse.forbidden('Only administrators can delete bookings'),
      );
    }

    // Find the booking first to check if it exists
    const booking = await this.prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new NotFoundException(
        this.apiResponse.notFound('Booking not found', `/bookings/${id}`),
      );
    }

    // Delete the booking
    await this.prisma.booking.delete({
      where: { id },
    });

    // Return success response
    return this.apiResponse.success({ id }, 'Booking deleted successfully');
  }
  async findOne(id: string, userId: string, role: UserRole): Promise<any> {
    // Find the booking with all necessary relations
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: {
          include: {
            agent: true,
          },
        },
      },
    });

    // Check if booking exists
    if (!booking) {
      throw new NotFoundException(
        this.apiResponse.notFound('Booking not found', `/bookings/${id}`),
      );
    }

    // Authorization check based on role
    if (
      // Customers can only access their own bookings
      (role === UserRole.CUSTOMER && booking.customerId !== userId) ||
      // Agents can only access bookings for their vehicles
      (role === UserRole.AGENT &&
        booking.vehicle.agent &&
        booking.vehicle.agent.id !== userId)
    ) {
      throw new ForbiddenException(
        this.apiResponse.forbidden(
          'You are not authorized to access this booking',
        ),
      );
    }

    // Return the booking data with success response
    return this.apiResponse.success(
      this.toBookingResponseDto(booking),
      'Booking retrieved successfully',
    );
  }
  async findAvailableVehicles(
    startDate: string,
    endDate: string,
    location?: string,
    category?: string,
  ) {
    // Convert string dates to Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException(
        this.apiResponse.error('Invalid date format. Use YYYY-MM-DD format.'),
      );
    }

    if (start >= end) {
      throw new BadRequestException(
        this.apiResponse.error('End date must be after start date'),
      );
    }

    // Find vehicles that are not booked during the given period
    const bookedVehicleIds = await this.prisma.booking.findMany({
      where: {
        OR: [
          // Case 1: Booking start date falls within the requested period
          {
            startDate: {
              gte: start,
              lte: end,
            },
          },
          // Case 2: Booking end date falls within the requested period
          {
            endDate: {
              gte: start,
              lte: end,
            },
          },
          // Case 3: Booking completely encompasses the requested period
          {
            startDate: {
              lte: start,
            },
            endDate: {
              gte: end,
            },
          },
        ],
        status: {
          in: ['PENDING', 'CONFIRMED', 'ACTIVE'],
        },
      },
      select: {
        vehicleId: true,
      },
    });

    const unavailableVehicleIds = bookedVehicleIds.map(
      (booking) => booking.vehicleId,
    );

    // Build query for available vehicles
    const whereClause: any = {
      status: VehicleStatus.AVAILABLE, // Use your enum instead of boolean fields
    };

    // Don't include vehicles that are already booked
    if (unavailableVehicleIds.length > 0) {
      whereClause.id = {
        notIn: unavailableVehicleIds,
      };
    }

    // Add optional filters
    if (location) {
      whereClause.location = {
        contains: location,
        mode: 'insensitive',
      };
    }

    if (category) {
      whereClause.category = category;
    }

    // Query available vehicles
    const availableVehicles = await this.prisma.vehicle.findMany({
      where: whereClause,
      include: {
        agent: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Transform the response
    const vehicles = availableVehicles.map((vehicle) => ({
      id: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      category: vehicle.category,
      transmission: vehicle.transmission,
      fuelType: vehicle.fuelType,
      seats: vehicle.seats,
      pricePerDay: vehicle.pricePerDay,
      location: vehicle.location,
      description: vehicle.description,
      hasAC: vehicle.hasAC,
      hasGPS: vehicle.hasGPS,
      hasBluetooth: vehicle.hasBluetooth,
      hasUSB: vehicle.hasUSB,
      agent: vehicle.agent
        ? `${vehicle.agent.firstName} ${vehicle.agent.lastName}`
        : null,
      images: vehicle.images || [], // Assuming images is already a string array
    }));

    return this.apiResponse.success(
      { vehicles, count: vehicles.length }, // Data as first parameter
      'Available vehicles retrieved successfully', // Message as second parameter
    );
  }
  constructor(
    private readonly prisma: PrismaService,
    private readonly apiResponse: ApiResponseService,
    private readonly mailService: MailerService,
    private readonly vehicleService: VehicleService,
  ) {}

  private generateBookingNumber(): string {
    return `BOOK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  private prepareNotificationContext(
    booking: BookingWithRelations,
  ): BookingNotificationContext {
    return {
      bookingNumber: booking.bookingNumber,
      customerName: `${booking.customer.firstName} ${booking.customer.lastName}`,
      agentName: booking.vehicle.agent
        ? `${booking.vehicle.agent.firstName} ${booking.vehicle.agent.lastName}`
        : undefined,
      vehicleDetails: `${booking.vehicle.make} ${booking.vehicle.model} (${booking.vehicle.licensePlate})`,
      startDate: booking.startDate.toISOString(),
      endDate: booking.endDate.toISOString(),
      totalPrice: booking.totalPrice,
      status: booking.status,
      pickupLocation: booking.pickupLocation,
      returnLocation: booking.returnLocation,
      name: `${booking.customer.firstName} ${booking.customer.lastName}`,
      car: `${booking.vehicle.make} ${booking.vehicle.model}`,
      bookingDate: booking.startDate.toISOString(),
      price: booking.totalPrice,
    };
  }

  private async sendBookingNotifications(
    booking: BookingWithRelations,
  ): Promise<void> {
    const context = this.prepareNotificationContext(booking);

    try {
      // Send to customer
      await this.mailService.sendBookingNotification(
        booking.customer.email,
        context,
        'user',
      );

      // Send to agent if vehicle has an agent
      if (booking.vehicle.agent) {
        await this.mailService.sendBookingNotification(
          booking.vehicle.agent.email,
          context,
          'agent',
        );

        await this.mailService.sendBookingNotification(
          'admin@tri-link.com',
          context,
          'admin',
        );
      }
    } catch (error) {
      console.error('Failed to send booking notifications:', error);
    }
  }

  private async sendReturnNotifications(
    booking: BookingWithRelations,
    returnData: ReturnCarDto,
  ): Promise<void> {
    const context: BookingNotificationContext = {
      ...this.prepareNotificationContext(booking),
      returnDate: new Date().toISOString(),
      condition: returnData.condition,
      fuelLevel: returnData.fuelLevel,
      mileage: returnData.mileage,
    };

    try {
      // Send to customer
      await this.mailService.sendReturnNotification(
        booking.customer.email,
        context,
        'user',
      );

      // Send to agent if vehicle has an agent
      if (booking.vehicle.agent) {
        await this.mailService.sendReturnNotification(
          booking.vehicle.agent.email,
          context,
          'agent',
        );
      }

      // Send to admin
      await this.mailService.sendReturnNotification(
        'admin@tri-link.com',
        context,
        'admin',
      );
    } catch (error) {
      console.error('Failed to send return notifications:', error);
    }
  }

  private toBookingResponseDto(
    booking: BookingWithRelations,
  ): BookingResponseDto {
    return {
      id: booking.id,
      bookingNumber: booking.bookingNumber,
      startDate: booking.startDate,
      endDate: booking.endDate,
      startTime: booking.startTime ?? undefined,
      endTime: booking.endTime ?? undefined,
      status: booking.status,
      totalPrice: booking.totalPrice,
      discountPrice: booking.discountPrice ?? undefined,
      finalPrice: booking.finalPrice,
      couponCode: booking.couponCode ?? undefined,
      pickupLocation: booking.pickupLocation,
      returnLocation: booking.returnLocation,
      notes: booking.notes ?? undefined,
      driverLicenseNumber: booking.driverLicenseNumber ?? undefined,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      customer: {
        id: booking.customer.id,
        firstName: booking.customer.firstName,
        lastName: booking.customer.lastName,
        email: booking.customer.email,
      },
      vehicle: {
        id: booking.vehicle.id,
        make: booking.vehicle.make,
        model: booking.vehicle.model,
        licensePlate: booking.vehicle.licensePlate,
      },
    };
  }

  async create(customerId: string, dto: CreateBookingDto, req?: Request) {
    // 1. Verify customer exists and has CUSTOMER role
    const customer = await this.prisma.user.findUnique({
      where: { id: customerId },
    });

    if (!customer || customer.role !== 'CUSTOMER') {
      throw new NotFoundException(
        this.apiResponse.notFound('Customer not found', req?.path),
      );
    }

    // 2. Check vehicle availability
    const isAvailable = await this.vehicleService.checkAvailability(
      dto.vehicleId,
      dto.startDate,
      dto.endDate,
    );

    if (!isAvailable.data || !isAvailable.data.available) {
      throw new ConflictException(
        this.apiResponse.error(
          'Vehicle not available for selected dates',
          409,
          'Availability conflict',
          req?.path,
        ),
      );
    }

    // 3. Get vehicle details for pricing
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: dto.vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException(
        this.apiResponse.notFound('Vehicle not found', req?.path),
      );
    }

    // 4. Calculate pricing
    const days = Math.ceil(
      (new Date(dto.endDate).getTime() - new Date(dto.startDate).getTime()) /
        (1000 * 60 * 60 * 24),
    );

    const totalPrice = days * vehicle.pricePerDay;
    const finalPrice = totalPrice - (dto.discountPrice || 0);

    // 5. Create booking
    const bookingData = {
      ...dto,
      bookingNumber: this.generateBookingNumber(),
      totalPrice,
      finalPrice,
      customerId,
      status: BookingStatus.PENDING, // Use enum instead of string
    };

    // Filter out undefined values
    Object.keys(bookingData).forEach(
      (key) => bookingData[key] === undefined && delete bookingData[key],
    );

    // Safer date/time handling

    // Use these date objects in your Prisma create call
    const booking = await this.prisma.booking.create({
      data: {
        ...bookingData,
        // Convert to ISO string if they're Date objects, otherwise parse from strings
        startDate:
          bookingData.startDate instanceof Date
            ? bookingData.startDate.toISOString()
            : this.parseDateTimeString(
                bookingData.startDate,
                bookingData.startTime || '00:00', // Add default time
              ).toISOString(),
        endDate:
          bookingData.endDate instanceof Date
            ? bookingData.endDate.toISOString()
            : this.parseDateTimeString(
                bookingData.endDate,
                bookingData.endTime || '00:00', // Add default time
              ).toISOString(),
      },
      include: {
        customer: true,
        vehicle: {
          include: {
            agent: true,
          },
        },
      },
    });

    // 6. Send notifications
    await this.sendBookingNotifications(booking);

    return this.apiResponse.success(
      this.toBookingResponseDto(booking),
      'Booking created successfully',
      201,
      req?.path,
    );
  }

  async findAllForCustomer(
    customerId: string,
    page?: number,
    limit?: number,
    status?: string,
    req?: Request,
  ) {
    // Verify customer exists
    const customer = await this.prisma.user.findUnique({
      where: { id: customerId },
    });

    if (!customer || customer.role !== 'CUSTOMER') {
      throw new NotFoundException(
        this.apiResponse.notFound('Customer not found', req?.path),
      );
    }

    const bookings = await this.prisma.booking.findMany({
      where: { customerId },
      include: {
        customer: true,
        vehicle: {
          include: {
            agent: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return this.apiResponse.success(
      bookings.map((booking) => this.toBookingResponseDto(booking)),
      'Bookings retrieved successfully',
      200,
      req?.path,
    );
  }

  async findOneForCustomer(customerId: string, id: string, req?: Request) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: {
          include: {
            agent: true,
          },
        },
      },
    });

    if (!booking || booking.customerId !== customerId) {
      throw new NotFoundException(
        this.apiResponse.notFound('Booking not found', req?.path),
      );
    }

    return this.apiResponse.success(
      this.toBookingResponseDto(booking),
      'Booking retrieved successfully',
      200,
      req?.path,
    );
  }

  async updateForCustomer(
    customerId: string,
    id: string,
    dto: UpdateBookingDto,
    req?: Request,
  ) {
    const existingBooking = await this.prisma.booking.findUnique({
      where: { id },
    });

    if (!existingBooking || existingBooking.customerId !== customerId) {
      throw new NotFoundException(
        this.apiResponse.notFound('Booking not found', req?.path),
      );
    }

    // Prevent modifying certain fields for customers
    const { status, ...updateData } = dto;

    const updatePrismaData = {
      ...Object.entries(updateData)
        .filter(([_, value]) => value !== undefined)
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
    };

    const updatedBooking = await this.prisma.booking.update({
      where: { id },
      data: updatePrismaData,
      include: {
        customer: true,
        vehicle: {
          include: {
            agent: true,
          },
        },
      },
    });

    return this.apiResponse.success(
      this.toBookingResponseDto(updatedBooking),
      'Booking updated successfully',
      200,
      req?.path,
    );
  }

  async cancelBooking(customerId: string, id: string, req?: Request) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: {
          include: {
            agent: true,
          },
        },
      },
    });

    if (!booking || booking.customerId !== customerId) {
      throw new NotFoundException(
        this.apiResponse.notFound('Booking not found', req?.path),
      );
    }

    // Check if booking can be cancelled
    if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
      throw new BadRequestException(
        this.apiResponse.error(
          'Booking cannot be cancelled',
          400,
          'Invalid booking status',
          req?.path,
        ),
      );
    }

    const updatedBooking = await this.prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        customer: true,
        vehicle: {
          include: {
            agent: true,
          },
        },
      },
    });

    // Send cancellation notification
    await this.sendBookingNotifications(updatedBooking);

    return this.apiResponse.success(
      this.toBookingResponseDto(updatedBooking),
      'Booking cancelled successfully',
      200,
      req?.path,
    );
  }

  async findAllForAgent(
    agentId: string,
    page?: number,
    limit?: number,
    status?: string,
    req?: Request,
  ) {
    // Verify agent exists and has AGENT role
    const agent = await this.prisma.user.findUnique({
      where: { id: agentId },
    });

    if (!agent || agent.role !== 'AGENT') {
      throw new NotFoundException(
        this.apiResponse.notFound('Agent not found', req?.path),
      );
    }

    const bookings = await this.prisma.booking.findMany({
      where: {
        vehicle: { agentId },
      },
      include: {
        customer: true,
        vehicle: {
          include: {
            agent: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return this.apiResponse.success(
      bookings.map((booking) => this.toBookingResponseDto(booking)),
      'Bookings retrieved successfully',
      200,
      req?.path,
    );
  }

  async updateStatus(id: string, status: BookingStatus, req?: Request) {
    const booking = await this.prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        customer: true,
        vehicle: {
          include: {
            agent: true,
          },
        },
      },
    });

    // Send status update notification
    await this.sendBookingNotifications(booking);

    return this.apiResponse.success(
      this.toBookingResponseDto(booking),
      'Booking status updated successfully',
      200,
      req?.path,
    );
  }
  async returnCar(bookingId: string, dto: ReturnCarDto, req?: Request) {
    // 1. Get the booking with relations
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        vehicle: {
          include: {
            agent: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException(
        this.apiResponse.notFound('Booking not found', req?.path),
      );
    }

    // 2. Validate booking can be returned
    if (booking.status !== 'ACTIVE') {
      throw new BadRequestException(
        this.apiResponse.error(
          'Only active bookings can be returned',
          400,
          'Invalid booking status',
          req?.path,
        ),
      );
    }

    // 3. Update vehicle status and mileage if provided
    const vehicleUpdateData: { status: VehicleStatus; mileage?: number } = {
      status: VehicleStatus.AVAILABLE,
    };

    if (dto.mileage !== undefined && dto.mileage !== null) {
      vehicleUpdateData.mileage = dto.mileage;
    }

    await this.prisma.vehicle.update({
      where: { id: booking.vehicleId },
      data: vehicleUpdateData,
    });

    // 4. Update booking status
    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.COMPLETED,
      },
      include: {
        customer: true,
        vehicle: {
          include: {
            agent: true,
          },
        },
      },
    });

    // 5. Send return notifications
    await this.sendReturnNotifications(updatedBooking, dto);

    return this.apiResponse.success(
      this.toBookingResponseDto(updatedBooking),
      'Car returned successfully',
      200,
      req?.path,
    );
  }

  // Additional helper methods for admin/internal use
  async findById(id: string): Promise<BookingWithRelations | null> {
    return this.prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: {
          include: {
            agent: true,
          },
        },
      },
    });
  }

  async findAll(page?: number, limit?: number, status?: string, req?: Request) {
    const bookings = await this.prisma.booking.findMany({
      include: {
        customer: true,
        vehicle: {
          include: {
            agent: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return this.apiResponse.success(
      bookings.map((booking) => this.toBookingResponseDto(booking)),
      'All bookings retrieved successfully',
      200,
      req?.path,
    );
  }

  // Method to get bookings by user role
  async findByUserRole(
    userRole: 'CUSTOMER' | 'AGENT' | 'ADMIN',
    req?: Request,
  ) {
    // Fix: Use proper typing instead of 'any'
    let whereClause: Prisma.BookingWhereInput = {};

    if (userRole === 'CUSTOMER') {
      whereClause = {
        customer: {
          role: 'CUSTOMER',
        },
      };
    } else if (userRole === 'AGENT') {
      whereClause = {
        vehicle: {
          agent: {
            role: 'AGENT',
          },
        },
      };
    }

    const bookings = await this.prisma.booking.findMany({
      where: whereClause,
      include: {
        customer: true,
        vehicle: {
          include: {
            agent: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return this.apiResponse.success(
      bookings.map((booking) => this.toBookingResponseDto(booking)),
      `Bookings for ${userRole.toLowerCase()}s retrieved successfully`,
      200,
      req?.path,
    );
  }

  private formatDate(date: Date | string): string {
    if (date instanceof Date) {
      // Format as YYYY-MM-DD
      return date.toISOString().split('T')[0];
    }
    return date; // If it's already a string
  }

  // Safer date/time handling
  parseDateTimeString(dateInput: string | Date, timeStr: string): Date {
    try {
      // If it's already a Date, just return it
      if (dateInput instanceof Date) {
        return dateInput;
      }

      // Parse date parts
      const [year, month, day] = dateInput.split('-').map(Number);

      // Parse time parts
      const [hours, minutes] = timeStr.split(':').map(Number);

      // Create date object
      return new Date(year, month - 1, day, hours, minutes, 0);
    } catch (error) {
      throw new Error(`Invalid date or time format: ${dateInput} ${timeStr}`);
    }
  }
}
