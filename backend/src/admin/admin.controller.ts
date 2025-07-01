import {
  Controller,
  Get,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth-guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService, BookingApprovalDto } from './admin.service';
import { DisputeResolutionDto } from './dto/admin.dto';
import { BookingStatus, UserRole } from 'generated/prisma';

@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private adminService: AdminService) {}

  // Dashboard Stats
  @Get('stats')
  async getSystemStats() {
    return this.adminService.getSystemStats();
  }

  @Get('analytics/revenue')
  async getRevenueAnalytics(@Query('days', ParseIntPipe) days: number = 30) {
    return this.adminService.getRevenueAnalytics(days);
  }

  // Booking Management
  @Get('bookings')
  async getAllBookings(@Query('status') status?: BookingStatus) {
    return this.adminService.getAllBookings(status);
  }

  @Get('bookings/pending')
  async getPendingBookings() {
    return this.adminService.getPendingBookings();
  }

  @Put('bookings/:id/approve')
  async approveBooking(
    @Param('id') id: string,
    @Body() dto: BookingApprovalDto,
  ) {
    return this.adminService.approveBooking(id, dto);
  }

  // User Management
  @Get('users')
  async getAllUsers() {
    return this.adminService.getAllUsersWithStats();
  }

  @Get('users/:id')
  async getUserDetails(@Param('id') id: string) {
    return this.adminService.getUserDetails(id);
  }

  @Patch('users/:id/status')
  async updateUserStatus(
    @Param('id') id: string,
    @Body('isActive', ParseBoolPipe) isActive: boolean,
  ) {
    return this.adminService.updateUserStatus(id, isActive);
  }

  @Put('users/:id/role')
  async changeUserRole(@Param('id') id: string, @Body('role') role: UserRole) {
    // This uses the existing user service method
    return await this.adminService.changeUserRole(id, role);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    // This uses the existing user service method
    return await this.adminService.deleteUser(id);
  }

  // Car Management
  @Get('cars')
  async getAllCars() {
    return await this.adminService.getAllCarsWithStats();
  }

  @Get('cars/:id')
  async getCarDetails(@Param('id') id: string) {
    return this.adminService.getCarDetails(id);
  }

  //   @Patch('cars/:id/status')
  //   async updateCarStatus(
  //     @Param('id') id: string,
  //     @Body('isAvailable', ParseBoolPipe) ,
  //   ) {
  //     return await this.adminService.updateCarStatus(id);
  //   }

  // Location Management
  //   @Get('locations')
  //   async getAllLocations() {
  //     return await this.adminService.getAllLocationsWithStats();
  //   }

  // Feedback and Disputes
  @Get('feedback')
  async getAllFeedback() {
    return await this.adminService.getAllFeedback();
  }

  @Get('disputes')
  async getDisputes() {
    return await this.adminService.getDisputes();
  }

  @Put('disputes/:id/resolve')
  async resolveDispute(
    @Param('id') id: string,
    @Body() dto: DisputeResolutionDto,
  ) {
    return await this.adminService.resolveDispute(id, dto);
  }
}
