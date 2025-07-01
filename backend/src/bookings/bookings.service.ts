/* eslint-disable @typescript-eslint/no-unused-vars */
import { Prisma, VehicleStatus } from 'generated/prisma';
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
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
export class BookingService {
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
      startTime: booking.startTime,
      endTime: booking.endTime,
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
    const booking = await this.prisma.booking.create({
      data: {
        ...dto,
        bookingNumber: this.generateBookingNumber(),
        totalPrice,
        finalPrice,
        customerId,
        status: 'PENDING',
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

  async findAllForCustomer(customerId: string, req?: Request) {
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

  async findAllForAgent(agentId: string, req?: Request) {
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

  async findAll(req?: Request) {
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

  async searchAvailableVehicles(
    startDate: Date,
    endDate: Date,
    location?: string,
    category?: string,
  ) {
    // Example logic: Find vehicles not booked in the given date range
    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        location: location ? location : undefined,
        category: category ? category : undefined,
        bookings: {
          none: {
            OR: [
              {
                startDate: { lte: endDate },
                endDate: { gte: startDate },
              },
            ],
          },
        },
      },
    });

    return this.apiResponse.success(
      vehicles,
      'Available vehicles retrieved successfully',
    );
  }
}
