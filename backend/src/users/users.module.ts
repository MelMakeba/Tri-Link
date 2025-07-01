import { Module } from '@nestjs/common';
import { UserService } from './users.service';
import { UserController } from './users.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailerModule } from 'src/shared/mailer/mailer.module';
import { CloudinaryService } from 'src/shared/cloudinary/cloudinary.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Module({
  providers: [
    UserService,
    PrismaService,
    CloudinaryService,
    ConfigService,
    JwtService,
  ],
  imports: [MailerModule],
  controllers: [UserController],
})
export class UsersModule {}
