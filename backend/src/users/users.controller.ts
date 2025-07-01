import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  Patch,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth-guard';
import { UserService } from './users.service';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from 'generated/prisma';

// Define a type for requests with user
interface AuthenticatedRequest extends Request {
  user: { id: string };
}

@Controller('user')
@UseGuards(AuthGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Get('profile')
  async getProfile(@Req() req: AuthenticatedRequest) {
    return this.userService.getProfile(req.user.id);
  }

  @Patch('profile')
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(req.user.id, dto);
  }

  @Patch('profile/image')
  @UseInterceptors(FileInterceptor('file'))
  async updateProfileImage(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.userService.updateProfileImage(req.user.id, file);
  }

  // ADMIN: Get all users
  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async getAllUsers() {
    return this.userService.getAllUsers();
  }

  // ADMIN: Get total users count
  @Get('count')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async getTotalUsers() {
    return this.userService.getTotalUsers();
  }

  // ADMIN: Change user role
  @Put(':id/role')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async changeUserRole(@Param('id') id: string, @Body('role') role: UserRole) {
    return this.userService.changeUserRole(id, role);
  }

  // ADMIN: Delete user
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }
}
