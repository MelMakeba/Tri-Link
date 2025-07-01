import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailerService } from './mailer.service';
import { PrismaClient } from 'generated/prisma';

@Module({
  imports: [ConfigModule],
  providers: [MailerService, PrismaClient],
  exports: [MailerService],
})
export class MailerModule {}
