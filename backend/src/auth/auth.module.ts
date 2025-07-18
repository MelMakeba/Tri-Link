import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ApiResponseService } from 'src/shared/api-response.service';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaService } from 'src/prisma/prisma.service';

import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailerModule } from 'src/shared/mailer/mailer.module';

@Module({
  providers: [
    AuthService,
    JwtStrategy,
    ApiResponseService,
    PrismaService,
    ConfigService,
  ],
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'trilink-secret-key',
      signOptions: { expiresIn: '1h' }, // Adjust the expiration time as needed
    }),
    MailerModule,
  ],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
