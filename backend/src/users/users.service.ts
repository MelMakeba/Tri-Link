import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryService } from 'src/shared/cloudinary/cloudinary.service';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { UserRole } from 'generated/prisma';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });
  }

  async updateProfileImage(userId: string, file: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Optionally delete old image
    if (user.avatar) {
      const oldPublicId = this.cloudinary.extractPublicIdFromUrl(user.avatar);
      await this.cloudinary.deleteFile(oldPublicId).catch(() => {});
    }

    const uploadResult = await this.cloudinary.uploadAvatar(
      file,
      userId,
      user.avatar ?? undefined,
    );
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatar: uploadResult.secure_url },
    });
  }

  async getAllUsers() {
    return this.prisma.user.findMany();
  }

  async getTotalUsers() {
    return this.prisma.user.count();
  }

  async changeUserRole(userId: string, role: UserRole) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  }

  async deleteUser(userId: string) {
    return this.prisma.user.delete({ where: { id: userId } });
  }
}
