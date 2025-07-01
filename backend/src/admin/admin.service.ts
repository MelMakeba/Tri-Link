/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  BookingStatus,
  DisputeStatus,
  UserRole,
  VehicleStatus,
} from 'generated/prisma';
import { DisputeResolutionDto } from './dto/admin.dto';

export interface SystemStats {
  totalUsers: number;
  totalVehicles: number;
  activeRentals: number;
  totalBookings: number;
  pendingBookings: number;
  totalRevenue: number;
  monthlyRevenue: number;
  todayBookings: number;
  usersByRole: {
    ADMIN: number;
    AGENT: number;
    CUSTOMER: number;
  };
  bookingsByStatus: {
    PENDING: number;
    CONFIRMED: number;
    ACTIVE: number;
    COMPLETED: number;
    CANCELLED: number;
    REJECTED: number;
  };
  topVehicles: Array<{
    id: string;
    make: string;
    model: string;
    bookingCount: number;
  }>;
  recentActivity: Array<{
    type: 'booking' | 'user_registered' | 'vehicle_added';
    description: string;
    timestamp: Date;
  }>;
}

export interface BookingApprovalDto {
  status: 'CONFIRMED' | 'CANCELLED' | 'REJECTED';
  notes?: string;
}

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getSystemStats(): Promise<SystemStats> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    try {
      const [
        totalUsers,
        totalVehicles,
        activeRentals,
        totalBookings,
        pendingBookings,
        totalRevenue,
        monthlyRevenue,
        todayBookings,
        usersByRole,
        bookingsByStatus,
        topVehicles,
        recentBookings,
        recentUsers,
        recentVehicles,
      ] = await Promise.all([
        // Basic counts
        this.prisma.user.count(),
        this.prisma.vehicle.count(),
        this.prisma.booking.count({
          where: { status: BookingStatus.ACTIVE },
        }),
        this.prisma.booking.count(),
        this.prisma.booking.count({
          where: { status: BookingStatus.PENDING },
        }),

        // Revenue calculations
        this.prisma.booking.aggregate({
          _sum: { finalPrice: true },
          where: { status: BookingStatus.COMPLETED },
        }),
        this.prisma.booking.aggregate({
          _sum: { finalPrice: true },
          where: {
            status: BookingStatus.COMPLETED,
            createdAt: { gte: startOfMonth },
          },
        }),

        // Today's bookings
        this.prisma.booking.count({
          where: {
            createdAt: { gte: startOfDay },
          },
        }),

        // User distribution by role
        this.prisma.user.groupBy({
          by: ['role'],
          _count: { role: true },
        }),

        // Booking distribution by status
        this.prisma.booking.groupBy({
          by: ['status'],
          _count: { status: true },
        }),

        // Top vehicles by booking count
        this.prisma.booking.groupBy({
          by: ['vehicleId'],
          _count: { vehicleId: true },
          orderBy: { _count: { vehicleId: 'desc' } },
          take: 5,
        }),

        // Recent bookings for activity
        this.prisma.booking.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: { select: { firstName: true, lastName: true } },
            vehicle: { select: { make: true, model: true } },
          },
        }),

        // Recent users for activity
        this.prisma.user.findMany({
          take: 3,
          orderBy: { createdAt: 'desc' },
          select: { firstName: true, lastName: true, createdAt: true },
        }),

        // Recent vehicles for activity
        this.prisma.vehicle.findMany({
          take: 2,
          orderBy: { createdAt: 'desc' },
          select: { make: true, model: true, createdAt: true },
        }),
      ]);

      // Get vehicle details for top vehicles
      const topVehiclesWithDetails = await Promise.all(
        topVehicles.map(async (item) => {
          const vehicle = await this.prisma.vehicle.findUnique({
            where: { id: item.vehicleId },
            select: { id: true, make: true, model: true },
          });

          if (!vehicle) {
            throw new NotFoundException(
              `Vehicle with id ${item.vehicleId} not found`,
            );
          }

          return {
            id: vehicle.id,
            make: vehicle.make,
            model: vehicle.model,
            bookingCount: item._count.vehicleId,
          };
        }),
      );

      // Transform user role data with proper typing
      const userRoleMap = usersByRole.reduce(
        (acc, item) => {
          if (
            item.role === UserRole.ADMIN ||
            item.role === UserRole.AGENT ||
            item.role === UserRole.CUSTOMER
          ) {
            acc[item.role] = item._count.role;
          }
          return acc;
        },
        { ADMIN: 0, AGENT: 0, CUSTOMER: 0 } as Record<UserRole, number>,
      );

      // Transform booking status data with proper typing
      const bookingStatusMap = bookingsByStatus.reduce(
        (acc, item) => {
          if (
            item.status === BookingStatus.PENDING ||
            item.status === BookingStatus.CONFIRMED ||
            item.status === BookingStatus.ACTIVE ||
            item.status === BookingStatus.COMPLETED ||
            item.status === BookingStatus.CANCELLED ||
            item.status === BookingStatus.REJECTED
          ) {
            acc[item.status] = item._count.status;
          }
          return acc;
        },
        {
          PENDING: 0,
          CONFIRMED: 0,
          ACTIVE: 0,
          COMPLETED: 0,
          CANCELLED: 0,
          REJECTED: 0,
        } as Record<BookingStatus, number>,
      );

      // Build recent activity with proper typing
      const recentActivity: SystemStats['recentActivity'] = [
        ...recentBookings.map((booking) => ({
          type: 'booking' as const,
          description: `${booking.customer.firstName} ${booking.customer.lastName} booked ${booking.vehicle.make} ${booking.vehicle.model}`,
          timestamp: booking.createdAt,
        })),
        ...recentUsers.map((user) => ({
          type: 'user_registered' as const,
          description: `${user.firstName} ${user.lastName} registered`,
          timestamp: user.createdAt,
        })),
        ...recentVehicles.map((vehicle) => ({
          type: 'vehicle_added' as const,
          description: `${vehicle.make} ${vehicle.model} added to fleet`,
          timestamp: vehicle.createdAt,
        })),
      ]
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 10);

      return {
        totalUsers,
        totalVehicles,
        activeRentals,
        totalBookings,
        pendingBookings,
        totalRevenue: totalRevenue._sum.finalPrice ?? 0,
        monthlyRevenue: monthlyRevenue._sum.finalPrice ?? 0,
        todayBookings,
        usersByRole: userRoleMap,
        bookingsByStatus: bookingStatusMap,
        topVehicles: topVehiclesWithDetails,
        recentActivity,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch system stats: ${error.message}`,
      );
    }
  }

  // Booking Management
  async getPendingBookings() {
    try {
      return await this.prisma.booking.findMany({
        where: { status: BookingStatus.PENDING },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          vehicle: {
            select: {
              id: true,
              make: true,
              model: true,
              year: true,
              licensePlate: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch pending bookings: ${error.message}`,
      );
    }
  }

  async getAllBookings(status?: BookingStatus) {
    try {
      const where = status ? { status } : {};

      return await this.prisma.booking.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          vehicle: {
            select: {
              id: true,
              make: true,
              model: true,
              year: true,
              licensePlate: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch bookings: ${error.message}`,
      );
    }
  }

  async approveBooking(bookingId: string, dto: BookingApprovalDto) {
    try {
      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      if (booking.status !== BookingStatus.PENDING) {
        throw new BadRequestException(
          'Only pending bookings can be approved/rejected',
        );
      }

      return await this.prisma.booking.update({
        where: { id: bookingId },
        data: {
          status:
            dto.status === 'CONFIRMED'
              ? BookingStatus.CONFIRMED
              : dto.status === 'CANCELLED'
                ? BookingStatus.CANCELLED
                : BookingStatus.REJECTED,
          notes: dto.notes,
          updatedAt: new Date(),
        },
        include: {
          customer: {
            select: { firstName: true, lastName: true, email: true },
          },
          vehicle: { select: { make: true, model: true } },
        },
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to approve booking: ${error.message}`,
      );
    }
  }

  // User Management
  async getAllUsersWithStats() {
    try {
      return await this.prisma.user.findMany({
        include: {
          _count: {
            select: {
              bookings: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      throw new BadRequestException(`Failed to fetch users: ${error.message}`);
    }
  }

  async getUserDetails(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          bookings: {
            include: {
              vehicle: { select: { make: true, model: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: { bookings: true },
          },
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch user details: ${error.message}`,
      );
    }
  }

  async updateUserStatus(userId: string, isActive: boolean) {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: { isActive },
      });
    } catch (error) {
      throw new BadRequestException(
        `Failed to update user status: ${error.message}`,
      );
    }
  }

  async changeUserRole(userId: string, role: UserRole) {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: { role },
      });
      return { message: 'User role updated successfully', user };
    } catch (error) {
      throw new BadRequestException(
        `Failed to change user role: ${error.message}`,
      );
    }
  }

  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.prisma.user.delete({ where: { id } });
      return {
        success: true,
        message: `User with id ${id} deleted successfully.`,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to delete user: ${error.message}`);
    }
  }

  // Vehicle Management - Added missing methods for controller
  async getAllCarsWithStats() {
    try {
      return await this.prisma.vehicle.findMany({
        include: {
          agent: {
            select: { firstName: true, lastName: true },
          },
          _count: {
            select: {
              bookings: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch vehicles: ${error.message}`,
      );
    }
  }

  async getCarDetails(vehicleId: string) {
    try {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: vehicleId },
        include: {
          agent: {
            select: { firstName: true, lastName: true, email: true },
          },
          bookings: {
            include: {
              customer: { select: { firstName: true, lastName: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: { bookings: true },
          },
        },
      });

      if (!vehicle) {
        throw new NotFoundException('Vehicle not found');
      }

      return vehicle;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch vehicle details: ${error.message}`,
      );
    }
  }

  //   async updateCarStatus(vehicleId: string) {
  //     try {
  //       return await this.prisma.vehicle.update({
  //         where: { id: vehicleId },
  //         data: {
  //           updatedAt: new Date(),
  //         },
  //         include: {
  //           _count: {
  //             select: {
  //               bookings: true,
  //             },
  //           },
  //         },
  //       });
  //     } catch (error) {
  //       throw new BadRequestException(
  //         `Failed to update vehicle status: ${error.message}`,
  //       );
  //     }
  //   }

  async getAllVehiclesWithStats() {
    try {
      return await this.prisma.vehicle.findMany({
        include: {
          agent: {
            select: { firstName: true, lastName: true },
          },
          _count: {
            select: {
              bookings: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch vehicles: ${error.message}`,
      );
    }
  }

  async getVehicleDetails(vehicleId: string) {
    try {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: vehicleId },
        include: {
          agent: {
            select: { firstName: true, lastName: true, email: true },
          },
          bookings: {
            include: {
              customer: { select: { firstName: true, lastName: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: { bookings: true },
          },
        },
      });

      if (!vehicle) {
        throw new NotFoundException('Vehicle not found');
      }

      return vehicle;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch vehicle details: ${error.message}`,
      );
    }
  }

  async updateVehicleStatus(vehicleId: string, status: VehicleStatus) {
    try {
      return await this.prisma.vehicle.update({
        where: { id: vehicleId },
        data: { status },
      });
    } catch (error) {
      throw new BadRequestException(
        `Failed to update vehicle status: ${error.message}`,
      );
    }
  }

  // Location Management - Added missing method for controller
  //   async getAllLocationsWithStats() {
  //     try {
  //       return await this.prisma.location.findMany({
  //         include: {
  //           vehicles: {
  //             select: {
  //               id: true,
  //               isAvailable: true,
  //               status: true,
  //             },
  //           },
  //           _count: {
  //             select: {
  //               vehicles: true,
  //             },
  //           },
  //         },
  //         orderBy: {
  //           name: 'asc',
  //         },
  //       });
  //     } catch (error) {
  //       throw new BadRequestException(
  //         `Failed to fetch locations: ${error.message}`,
  //       );
  //     }
  //   }

  // Reviews Management - Added missing method for controller (renamed from getAllReviews)
  async getAllFeedback() {
    try {
      return await this.prisma.review.findMany({
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          vehicle: {
            select: {
              id: true,
              make: true,
              model: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch feedback: ${error.message}`,
      );
    }
  }

  async getAllReviews() {
    return this.getAllFeedback(); // Alias for backward compatibility
  }

  // Dispute Management - Added missing method for controller
  async getDisputes() {
    try {
      const disputes = await this.prisma.dispute.findMany({
        include: {
          comments: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 3, // Last 3 comments
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      });

      const stats = {
        total: disputes.length,
        byStatus: {
          PENDING: disputes.filter((d) => d.status === 'PENDING').length,
          IN_PROGRESS: disputes.filter((d) => d.status === 'IN_PROGRESS')
            .length,
          RESOLVED: disputes.filter((d) => d.status === 'RESOLVED').length,
          CLOSED: disputes.filter((d) => d.status === 'CLOSED').length,
        },
        byPriority: {
          CRITICAL: disputes.filter((d) => d.priority === 'CRITICAL').length,
          HIGH: disputes.filter((d) => d.priority === 'HIGH').length,
          MEDIUM: disputes.filter((d) => d.priority === 'MEDIUM').length,
          LOW: disputes.filter((d) => d.priority === 'LOW').length,
        },
      };

      return {
        disputes,
        stats,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch disputes: ${error.message}`,
      );
    }
  }

  async resolveDispute(id: string, dto: DisputeResolutionDto) {
    try {
      const dispute = await this.prisma.dispute.update({
        where: { id },
        data: {
          status: DisputeStatus.RESOLVED,
          resolution: dto.resolution,
          resolvedAt: new Date(),
        },
      });
      return { message: 'Dispute resolved successfully', dispute };
    } catch (error) {
      throw new BadRequestException(
        `Failed to resolve dispute: ${error.message}`,
      );
    }
  }

  // Revenue Analytics
  async getRevenueAnalytics(days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const bookings = await this.prisma.booking.findMany({
        where: {
          status: BookingStatus.COMPLETED,
          createdAt: { gte: startDate },
        },
        select: {
          finalPrice: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      // Group by date with proper typing
      const revenueByDate = bookings.reduce<Record<string, number>>(
        (acc, booking) => {
          const date = booking.createdAt.toISOString().split('T')[0];
          acc[date] = (acc[date] ?? 0) + booking.finalPrice;
          return acc;
        },
        {},
      );

      return {
        totalRevenue: bookings.reduce((sum, b) => sum + b.finalPrice, 0),
        averageBookingValue:
          bookings.length > 0
            ? bookings.reduce((sum, b) => sum + b.finalPrice, 0) /
              bookings.length
            : 0,
        bookingCount: bookings.length,
        revenueByDate,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch revenue analytics: ${error.message}`,
      );
    }
  }

  // Payment Analytics
  async getPaymentStats() {
    try {
      const [
        totalPayments,
        completedPayments,
        pendingPayments,
        failedPayments,
      ] = await Promise.all([
        this.prisma.payment.count(),
        this.prisma.payment.count({ where: { status: 'COMPLETED' } }),
        this.prisma.payment.count({ where: { status: 'PENDING' } }),
        this.prisma.payment.count({ where: { status: 'FAILED' } }),
      ]);

      const totalRevenue = await this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'COMPLETED' },
      });

      return {
        totalPayments,
        completedPayments,
        pendingPayments,
        failedPayments,
        totalRevenue: totalRevenue._sum.amount ?? 0,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch payment stats: ${error.message}`,
      );
    }
  }
}
