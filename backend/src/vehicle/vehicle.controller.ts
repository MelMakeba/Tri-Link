import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { CreateVehicleDto } from './dtos/create-vehicle.dto';
import { UpdateVehicleDto } from './dtos/update-vehicle.dto';
import { SetAvailabilityDto } from './dtos/set-availability.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../auth/guards/auth-guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma';
import { Request } from 'express';
import { ApiBearerAuth, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { CheckAvailabilityDto } from './dtos/check-availability.dto';
import { memoryStorage } from 'multer';

interface AuthenticatedRequest extends Request {
  user: { id: string };
}

@ApiTags('Vehicles')
@Controller('vehicles')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Get()
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Req() req?: Request,
  ) {
    return this.vehicleService.findAllPublic(page, limit, req);
  }

  @Post()
  @UseGuards(AuthGuard)
  @Roles(UserRole.AGENT)
  @ApiBearerAuth()
  @UseInterceptors(
    FilesInterceptor('images', 2, {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit per file
        files: 2, // Maximum 2 files
      },
      fileFilter: (req, file, callback) => {
        const allowedMimes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
        ];

        if (allowedMimes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new Error(
              'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
            ),
            false,
          );
        }
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          maxItems: 2,
        },
        vehicleData: {
          type: 'string',
          description: 'Vehicle data as JSON string',
        },
      },
    },
  })
  async create(
    @Req() req: AuthenticatedRequest,
    @Body('vehicleData') vehicleDataString: string,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    try {
      // Parse the vehicle data from the form field
      const vehicleData = JSON.parse(vehicleDataString) as CreateVehicleDto;

      // Use type assertion for the response
      const vehicleResponse = (await this.vehicleService.create(
        req.user.id,
        vehicleData,
        req,
      )) as { data?: { id: string | number } };

      // If there are files to upload and vehicle was created successfully
      if (files?.length && vehicleResponse.data?.id) {
        // Upload the images
        const imagesResponse = await this.vehicleService.uploadImages(
          req.user.id,
          String(vehicleResponse.data.id), // Convert to string
          files,
          req,
        );

        // Return the vehicle with images
        return imagesResponse;
      }

      // Return the vehicle without images
      return vehicleResponse;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new BadRequestException('Invalid JSON in vehicleData field');
      }
      throw error;
    }
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @Roles(UserRole.AGENT)
  @ApiBearerAuth()
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.vehicleService.findOne(req.user.id, id, req);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  @Roles(UserRole.AGENT)
  @ApiBearerAuth()
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.vehicleService.update(req.user.id, id, dto, req);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @Roles(UserRole.AGENT)
  @ApiBearerAuth()
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.vehicleService.remove(req.user.id, id, req);
  }
  @Post(':id/images')
  @UseGuards(AuthGuard)
  @Roles(UserRole.AGENT)
  @UseInterceptors(
    FilesInterceptor('images', 2, {
      // Changed from 10 to 2
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit per file
        files: 2, // Maximum 2 files
      },
      fileFilter: (req, file, callback) => {
        // Only validate file types here - buffer is not available yet
        const allowedMimes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
        ];

        if (allowedMimes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new Error(
              'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
            ),
            false,
          );
        }
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          maxItems: 2, // Specify maximum 2 items
        },
      },
    },
  })
  uploadImages(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    // Add validation for files array
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    if (files.length > 2) {
      throw new BadRequestException('Maximum 2 images allowed');
    }

    // Enhanced validation for each file
    console.log('=== FILE UPLOAD DEBUG INFO ===');
    console.log('Number of files received:', files.length);

    files.forEach((file, index) => {
      console.log(`File ${index + 1} details:`, {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        buffer_exists: !!file.buffer,
        buffer_length: file.buffer?.length,
        fieldname: file.fieldname,
        encoding: file.encoding,
      });

      // Validate buffer exists and has content
      if (!file.buffer) {
        throw new BadRequestException(
          `File ${index + 1} (${file.originalname}) has no buffer data`,
        );
      }

      if (file.buffer.length === 0) {
        throw new BadRequestException(
          `File ${index + 1} (${file.originalname}) buffer is empty`,
        );
      }

      // Check for minimum realistic file size
      if (file.size < 100) {
        throw new BadRequestException(
          `File ${index + 1} (${file.originalname}) appears to be corrupted (size: ${file.size} bytes)`,
        );
      }

      // Validate buffer size matches file size
      if (file.buffer.length !== file.size) {
        console.warn(
          `File ${index + 1} size mismatch: reported=${file.size}, buffer=${file.buffer.length}`,
        );
      }

      // Use the class method for image buffer validation
      if (!this.validateImageBuffer(file.buffer)) {
        throw new BadRequestException(
          `File ${index + 1} (${file.originalname}) is not a valid image file.`,
        );
      }
    });

    console.log('=== END FILE UPLOAD DEBUG INFO ===');

    return this.vehicleService.uploadImages(req.user.id, id, files, req);
  }

  @Post('debug/upload')
  @UseInterceptors(
    FilesInterceptor('images', 2, {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit per file
        files: 2, // Maximum 2 files
      },
      fileFilter: (req, file, callback) => {
        console.log('FileFilter called with:', {
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          fieldname: file.fieldname,
        });

        const allowedMimes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
        ];

        if (allowedMimes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new Error(
              'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
            ),
            false,
          );
        }
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  debugUpload(@UploadedFiles() files: Express.Multer.File[]) {
    console.log('=== DEBUG UPLOAD ENDPOINT ===');
    console.log('Files received:', files?.length || 0);

    if (!files || files.length === 0) {
      return {
        success: false,
        message: 'No files received',
        debug: { files: null },
      };
    }

    const fileInfo = files.map((file, index) => ({
      index: index + 1,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      fieldname: file.fieldname,
      encoding: file.encoding,
      buffer_exists: !!file.buffer,
      buffer_length: file.buffer?.length,
      buffer_first_bytes: file.buffer
        ? file.buffer.toString('hex', 0, Math.min(8, file.buffer.length))
        : null,
    }));

    console.log('File details:', fileInfo);

    return {
      success: true,
      message: `Received ${files.length} file(s)`,
      files: fileInfo,
    };
  }
  @Put(':id/availability')
  @UseGuards(AuthGuard)
  @Roles(UserRole.AGENT)
  @ApiBearerAuth()
  setAvailability(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: SetAvailabilityDto,
  ) {
    return this.vehicleService.setAvailability(req.user.id, id, dto, req);
  }

  @Get(':id/availability')
  @ApiBearerAuth()
  checkAvailability(
    @Param('id') id: string,
    @Query() dto: CheckAvailabilityDto,
    @Req() req?: Request,
  ) {
    return this.vehicleService.checkAvailability(id, dto.from, dto.to, req);
  }

  private validateImageBuffer(buffer: Buffer): boolean {
    // Basic check for image file signatures (magic numbers)
    if (!buffer || buffer.length < 4) return false;

    const signatures = [
      [0x89, 0x50, 0x4e, 0x47], // PNG
      [0xff, 0xd8, 0xff], // JPG/JPEG
      [0x47, 0x49, 0x46, 0x38], // GIF
    ];

    return signatures.some((sig) =>
      sig.every((byte, idx) => buffer[idx] === byte),
    );
  }
}
