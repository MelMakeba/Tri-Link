import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dtos/create-vehicle.dto';
import { UpdateVehicleDto } from './dtos/update-vehicle.dto';
import { SetAvailabilityDto } from './dtos/set-availability.dto';
import { VehicleResponseDto } from './dtos/vehicle-response.dto';
import {
  CloudinaryService,
  TriLinkUploadType,
} from '../shared/cloudinary/cloudinary.service';
import { ApiResponseService } from '../shared/api-response.service';
import { Request } from 'express';
import { Vehicle } from 'generated/prisma';

@Injectable()
export class VehicleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly apiResponse: ApiResponseService,
  ) {}

  private toVehicleResponseDto(vehicle: Vehicle): VehicleResponseDto {
    return {
      id: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      licensePlate: vehicle.licensePlate,
      vin: vehicle.vin ?? undefined,
      status: vehicle.status,
      category: vehicle.category,
      seats: vehicle.seats,
      transmission: vehicle.transmission,
      fuelType: vehicle.fuelType,
      mileage: vehicle.mileage ?? undefined,
      description: vehicle.description ?? undefined,
      images: vehicle.images,
      pricePerDay: vehicle.pricePerDay,
      pricePerHour: vehicle.pricePerHour ?? undefined,
      features: {
        hasGPS: vehicle.hasGPS,
        hasAC: vehicle.hasAC,
        hasBluetooth: vehicle.hasBluetooth,
        hasUSB: vehicle.hasUSB,
        hasWiFi: vehicle.hasWiFi,
      },
      location: vehicle.location ?? undefined,
      city: vehicle.city ?? undefined,
      country: vehicle.country ?? undefined,
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt,
    };
  }

  async create(agentId: string, dto: CreateVehicleDto, req?: Request) {
    const vehicle = await this.prisma.vehicle.create({
      data: {
        ...dto,
        agentId,
      },
    });

    return this.apiResponse.success(
      this.toVehicleResponseDto(vehicle),
      'Vehicle created successfully',
      201,
      req?.path,
    );
  }

  async findAll(
    agentId: string,
    page: number = 1,
    limit: number = 10,
    req?: Request,
  ) {
    const skip = (page - 1) * limit;
    const [vehicles, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where: { agentId },
        skip,
        take: limit,
      }),
      this.prisma.vehicle.count({ where: { agentId } }),
    ]);

    if (vehicles.length === 0) {
      return this.apiResponse.noData('No vehicles found', 204, req?.path);
    }

    return this.apiResponse.paginated(
      vehicles.map((vehicle) => this.toVehicleResponseDto(vehicle)),
      page,
      limit,
      total,
      'Vehicles retrieved successfully',
    );
  }

  async findAllPublic(page: number = 1, limit: number = 10, req?: Request) {
    const skip = (page - 1) * limit;
    const [vehicles, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        skip,
        take: limit,
        // No status filter here
      }),
      this.prisma.vehicle.count(), // No status filter here
    ]);

    if (vehicles.length === 0) {
      return this.apiResponse.noData('No vehicles found', 204, req?.path);
    }

    return this.apiResponse.paginated(
      vehicles.map((vehicle) => this.toVehicleResponseDto(vehicle)),
      page,
      limit,
      total,
      'Vehicles retrieved successfully',
    );
  }

  async findOne(agentId: string, id: string, req?: Request) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle || vehicle.agentId !== agentId) {
      throw new NotFoundException(
        this.apiResponse.notFound('Vehicle not found', req?.path),
      );
    }

    return this.apiResponse.success(
      this.toVehicleResponseDto(vehicle),
      'Vehicle retrieved successfully',
      200,
      req?.path,
    );
  }

  async update(
    agentId: string,
    id: string,
    dto: UpdateVehicleDto,
    req?: Request,
  ) {
    const existingVehicle = await this.prisma.vehicle.findUnique({
      where: { id },
    });

    if (!existingVehicle || existingVehicle.agentId !== agentId) {
      throw new NotFoundException(
        this.apiResponse.notFound('Vehicle not found', req?.path),
      );
    }

    const updatedVehicle = await this.prisma.vehicle.update({
      where: { id },
      data: dto,
    });

    return this.apiResponse.success(
      this.toVehicleResponseDto(updatedVehicle),
      'Vehicle updated successfully',
      200,
      req?.path,
    );
  }

  async remove(agentId: string, id: string, req?: Request) {
    const existingVehicle = await this.prisma.vehicle.findUnique({
      where: { id },
    });

    if (!existingVehicle || existingVehicle.agentId !== agentId) {
      throw new NotFoundException(
        this.apiResponse.notFound('Vehicle not found', req?.path),
      );
    }

    await this.prisma.vehicle.delete({
      where: { id },
    });

    return this.apiResponse.success(
      null,
      'Vehicle deleted successfully',
      200,
      req?.path,
    );
  }

  async uploadImages(
    agentId: string,
    id: string,
    files: Express.Multer.File[],
    req?: Request,
  ) {
    const existingVehicle = await this.prisma.vehicle.findUnique({
      where: { id },
    });

    if (!existingVehicle || existingVehicle.agentId !== agentId) {
      throw new NotFoundException(
        this.apiResponse.notFound('Vehicle not found', req?.path),
      );
    }

    const uploadPromises = files.map((file) =>
      this.cloudinaryService.uploadFile(
        file,
        TriLinkUploadType.VEHICLE_IMAGE, // Or whatever your TriLinkUploadType enum value is for vehicles
        {
          entityId: id,
          entityType: 'vehicle',
          tags: [`agent-${agentId}`],
        },
      ),
    );

    const uploadedImages = await Promise.all(uploadPromises);

    const updatedVehicle = await this.prisma.vehicle.update({
      where: { id },
      data: {
        images: {
          push: uploadedImages.map((img) => img.secure_url),
        },
      },
    });

    return this.apiResponse.success(
      this.toVehicleResponseDto(updatedVehicle),
      'Images uploaded successfully',
      200,
      req?.path,
    );
  }

  async setAvailability(
    agentId: string,
    id: string,
    dto: SetAvailabilityDto,
    req?: Request,
  ) {
    // 1. Verify vehicle exists and belongs to agent
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle || vehicle.agentId !== agentId) {
      throw new NotFoundException(
        this.apiResponse.notFound('Vehicle not found', req?.path),
      );
    }

    // 2. Validate date range if provided
    if (dto.from && dto.to && dto.from >= dto.to) {
      throw new BadRequestException(
        this.apiResponse.error(
          'End date must be after start date',
          400,
          'Invalid date range',
          req?.path,
        ),
      );
    }

    // 3. Special handling for AVAILABLE status
    if (dto.status === 'AVAILABLE') {
      if (!dto.from || !dto.to) {
        throw new BadRequestException(
          this.apiResponse.error(
            'Availability period required when setting to AVAILABLE',
            400,
            'Missing dates',
            req?.path,
          ),
        );
      }

      const hasConflict = await this.hasBookingConflict(id, dto.from, dto.to);
      if (hasConflict) {
        throw new ConflictException(
          this.apiResponse.error(
            'Vehicle has existing bookings during this period',
            409,
            'Availability conflict',
            req?.path,
          ),
        );
      }
    }

    // 4. Update vehicle
    const updatedVehicle = await this.prisma.vehicle.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.status === 'AVAILABLE' && dto.from && dto.to
          ? {
              availableFrom: dto.from,
              availableTo: dto.to,
            }
          : {
              availableFrom: null,
              availableTo: null,
            }),
      },
    });

    return this.apiResponse.success(
      this.toVehicleResponseDto(updatedVehicle),
      'Vehicle availability updated successfully',
      200,
      req?.path,
    );
  }

  private async hasBookingConflict(
    vehicleId: string,
    from: Date,
    to: Date,
  ): Promise<boolean> {
    const overlappingBooking = await this.prisma.booking.findFirst({
      where: {
        vehicleId,
        OR: [
          {
            startDate: { lte: new Date(to) },
            endDate: { gte: new Date(from) },
          },
        ],
        status: { notIn: ['CANCELLED', 'REJECTED'] },
      },
    });

    return !!overlappingBooking;
  }

  async checkAvailability(id: string, from: Date, to: Date, req?: Request) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      throw new NotFoundException(
        this.apiResponse.notFound('Vehicle not found', req?.path),
      );
    }

    if (vehicle.status !== 'AVAILABLE') {
      return this.apiResponse.success(
        {
          available: false,
          reason: `Vehicle is currently ${vehicle.status}`,
        },
        'Availability checked',
        200,
        req?.path,
      );
    }

    const hasConflict = await this.hasBookingConflict(id, from, to);

    return this.apiResponse.success(
      {
        available: !hasConflict,
        reason: hasConflict
          ? 'Vehicle is booked for the requested dates'
          : null,
      },
      'Availability checked successfully',
      200,
      req?.path,
    );
  }
}
