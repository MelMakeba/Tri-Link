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
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateVehicleDto) {
    return this.vehicleService.create(req.user.id, dto, req);
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
  @UseInterceptors(FilesInterceptor('images'))
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
        },
      },
    },
  })
  uploadImages(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.vehicleService.uploadImages(req.user.id, id, files, req);
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
}
