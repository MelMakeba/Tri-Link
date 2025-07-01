/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unused-vars */
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
  CloudinaryUploadResult,
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
    // Validate maximum 2 images
    if (files.length > 2) {
      throw new BadRequestException('Maximum 2 images allowed per vehicle');
    }

    const existingVehicle = await this.prisma.vehicle.findUnique({
      where: { id },
    });

    if (!existingVehicle || existingVehicle.agentId !== agentId) {
      throw new NotFoundException(
        this.apiResponse.notFound('Vehicle not found', req?.path),
      );
    }

    // Check if adding these images would exceed the 2 image limit
    const currentImageCount = Array.isArray(existingVehicle.images)
      ? existingVehicle.images.length
      : 0;

    if (currentImageCount + files.length > 2) {
      throw new BadRequestException(
        `Cannot add ${files.length} images. Vehicle already has ${currentImageCount} image(s). Maximum 2 images allowed.`,
      );
    }

    // Validate each file before processing
    files.forEach((file, index) => {
      if (!file.buffer || file.buffer.length === 0) {
        throw new BadRequestException(
          `File ${index + 1} is empty or corrupted`,
        );
      }

      if (file.size < 100) {
        throw new BadRequestException(
          `File ${index + 1} appears to be corrupted (size: ${file.size} bytes)`,
        );
      }
    });

    try {
      // Upload images sequentially to avoid overwhelming the service
      const uploadedImages: CloudinaryUploadResult[] = [];

      for (const file of files) {
        try {
          const uploadResult: CloudinaryUploadResult =
            await this.cloudinaryService.uploadFile(
              file,
              TriLinkUploadType.VEHICLE_IMAGE,
              {
                entityId: id,
                entityType: 'vehicle',
                tags: [`agent-${agentId}`],
              },
            );
          uploadedImages.push(uploadResult);
        } catch (uploadError: any) {
          // If one upload fails, clean up any successful uploads
          for (const uploaded of uploadedImages) {
            try {
              await this.cloudinaryService.deleteFile(uploaded.public_id);
            } catch (deleteError) {
              console.warn(
                `Failed to cleanup uploaded file: ${uploaded.public_id}`,
              );
            }
          }
          throw new BadRequestException(
            `Failed to upload ${file.originalname}: ${uploadError.message}`,
          );
        }
      }

      // Update vehicle with new image URLs
      const imageUrls = uploadedImages.map((img) => img.secure_url);
      const currentImages = Array.isArray(existingVehicle.images)
        ? existingVehicle.images
        : [];

      const updatedVehicle = await this.prisma.vehicle.update({
        where: { id },
        data: {
          images: [...currentImages, ...imageUrls],
        },
      });

      return this.apiResponse.success(
        this.toVehicleResponseDto(updatedVehicle),
        `${uploadedImages.length} image(s) uploaded successfully`,
        200,
        req?.path,
      );
    } catch (error: any) {
      throw new BadRequestException(
        `Image upload failed: ${error.message || 'Unknown error'}`,
      );
    }
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
