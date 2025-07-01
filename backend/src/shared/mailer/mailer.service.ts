/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';
import * as ejs from 'ejs';
import { PrismaClient } from 'generated/prisma';

export interface EmailOptions {
  to: string;
  subject: string;
  template?: string;
  context?: Record<string, any>;
  html?: string;
  text?: string;
}

export interface PasswordResetContext {
  name: string;
  token: string;
  expiresIn: string;
  resetUrl?: string;
}

export interface VerificationContext {
  name: string;
  token: string;
  verifyUrl?: string;
}

export interface BookingContext {
  name: string;
  car: string;
  bookingDate: string;
  startDate: string;
  endDate: string;
  price: number;
  agentName?: string;
  adminName?: string;
  userName?: string;
  [key: string]: any;
}

export interface PaymentContext {
  name: string;
  amount: number;
  paymentDate: string;
  receiptUrl?: string;
  [key: string]: any;
}

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter: nodemailer.Transporter;
  private templatesPath: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaClient,
  ) {
    this.templatesPath = path.join(process.cwd(), 'src/templates');
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const smtpConfig = {
      host: this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com'),
      port: parseInt(this.configService.get<string>('SMTP_PORT', '587')),
      secure: this.configService.get<string>('SMTP_SECURE', 'false') === 'true',
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
      tls: {
        rejectUnauthorized: false,
      },
    };

    this.transporter = nodemailer.createTransport(smtpConfig);
    this.logger.log('Email transporter initialized successfully');
  }

  async sendEmail(
    options: EmailOptions,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      let html = options.html;

      if (options.template && options.context) {
        html = await this.renderTemplate(options.template, options.context);
      }

      const mailOptions = {
        from: this.configService.get<string>(
          'SMTP_FROM',
          this.configService.get<string>('SMTP_USER', ''),
        ),
        to: options.to,
        subject: options.subject,
        html,
        text: options.text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Email sent successfully to ${options.to}: ${result.messageId}`,
      );

      return { success: true, messageId: result.messageId };
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${options.to}: ${error.message}`,
      );
      return { success: false, error: error.message };
    }
  }

  async sendPasswordResetEmail(to: string, context: PasswordResetContext) {
    const emailOptions: EmailOptions = {
      to,
      subject: 'Tri-Link - Password Reset Request',
      template: 'password-reset',
      context: {
        ...context,
        resetUrl:
          context.resetUrl ||
          `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:4200')}/reset-password?token=${context.token}`,
        expiresIn: context.expiresIn || '1 hour',
      },
    };
    return this.sendEmail(emailOptions);
  }

  async sendVerificationEmail(to: string, context: VerificationContext) {
    const emailOptions: EmailOptions = {
      to,
      subject: 'Tri-Link - Verify Your Email',
      template: 'email-verification',
      context: {
        ...context,
        verifyUrl:
          context.verifyUrl ||
          `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:4200')}/verify-email?token=${context.token}`,
      },
    };
    return this.sendEmail(emailOptions);
  }

  async sendBookingNotification(
    to: string,
    context: BookingContext,
    recipientType: 'user' | 'agent' | 'admin',
  ) {
    const templateMap = {
      user: 'booking-user',
      agent: 'booking-agent',
      admin: 'booking-admin',
    };
    const subjectMap = {
      user: 'Tri-Link - Your Booking Details',
      agent: 'Tri-Link - New Car Booking Assigned',
      admin: 'Tri-Link - New Booking Notification',
    };
    const emailOptions: EmailOptions = {
      to,
      subject: subjectMap[recipientType],
      template: templateMap[recipientType],
      context,
    };
    return this.sendEmail(emailOptions);
  }

  async sendReturnNotification(
    to: string,
    context: BookingContext,
    recipientType: 'user' | 'agent' | 'admin',
  ) {
    const templateMap = {
      user: 'return-user',
      agent: 'return-agent',
      admin: 'return-admin',
    };
    const subjectMap = {
      user: 'Tri-Link - Car Return Confirmation',
      agent: 'Tri-Link - Car Returned by Customer',
      admin: 'Tri-Link - Car Return Notification',
    };
    const emailOptions: EmailOptions = {
      to,
      subject: subjectMap[recipientType],
      template: templateMap[recipientType],
      context,
    };
    return this.sendEmail(emailOptions);
  }

  async sendPaymentReceipt(
    to: string,
    context: PaymentContext,
    recipientType: 'user' | 'agent',
  ) {
    const templateMap = {
      user: 'payment-user',
      agent: 'payment-agent',
    };
    const subjectMap = {
      user: 'Tri-Link - Payment Confirmation & Receipt',
      agent: 'Tri-Link - Customer Payment Received',
    };
    const emailOptions: EmailOptions = {
      to,
      subject: subjectMap[recipientType],
      template: templateMap[recipientType],
      context,
    };
    return this.sendEmail(emailOptions);
  }

  private async renderTemplate(
    templateName: string,
    context: Record<string, any>,
  ): Promise<string> {
    try {
      const filename = `${templateName}.ejs`;
      const templatePath = path.join(this.templatesPath, filename);

      if (!fs.existsSync(templatePath)) {
        throw new Error(
          `Template ${templateName} not found at ${templatePath}`,
        );
      }

      const templateOptions = {
        filename: templatePath,
        cache: process.env.NODE_ENV === 'production',
        compileDebug: process.env.NODE_ENV !== 'production',
      };

      const html = await ejs.renderFile(templatePath, context, templateOptions);
      return html;
    } catch (error) {
      this.logger.error(
        `Template rendering failed for ${templateName}: ${error.message}`,
      );
      throw error;
    }
  }

  async healthCheck(): Promise<{ status: string; details?: string }> {
    try {
      await this.transporter.verify();
      return { status: 'ok' };
    } catch (error) {
      return {
        status: 'error',
        details: error.message,
      };
    }
  }
}
