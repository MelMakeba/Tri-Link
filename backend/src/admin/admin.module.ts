import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UserService } from '../users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CloudinaryService } from 'src/shared/cloudinary/cloudinary.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [],
  controllers: [AdminController],
  providers: [
    AdminService,
    UserService,
    PrismaService,
    ConfigService,
    CloudinaryService,
    JwtService,
  ],
  exports: [AdminService],
})
export class AdminModule {}
