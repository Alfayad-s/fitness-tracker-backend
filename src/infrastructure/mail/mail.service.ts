import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import {
  buildOtpEmailHtml,
  buildOtpEmailSubject,
  buildOtpEmailText,
} from './templates/otp-email.template';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {}

  private getTransporter(): Transporter | null {
    if (this.transporter) {
      return this.transporter;
    }

    const host = this.configService.get<string>('mail.host');
    if (!host) {
      return null;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: this.configService.get<number>('mail.port'),
      secure: this.configService.get<number>('mail.port') === 465,
      auth: {
        user: this.configService.get<string>('mail.user'),
        pass: this.configService.get<string>('mail.pass'),
      },
    });

    return this.transporter;
  }

  private isDevelopment(): boolean {
    return process.env.NODE_ENV !== 'production';
  }

  private logOtpInDev(
    email: string,
    otp: string,
    purpose: 'login' | 'register' | 'reset-password',
  ): void {
    if (!this.isDevelopment()) {
      return;
    }
    this.logger.log(`[DEV] ${purpose.toUpperCase()} OTP for ${email}: ${otp}`);
  }

  async sendLoginOtp(email: string, otp: string): Promise<void> {
    this.logOtpInDev(email, otp, 'login');
    await this.sendOtpEmail(email, otp, 'login');
  }

  async sendRegisterOtp(email: string, otp: string): Promise<void> {
    this.logOtpInDev(email, otp, 'register');
    await this.sendOtpEmail(email, otp, 'register');
  }

  async sendResetPasswordOtp(email: string, otp: string): Promise<void> {
    this.logOtpInDev(email, otp, 'reset-password');
    await this.sendOtpEmail(email, otp, 'reset-password');
  }

  private async sendOtpEmail(
    email: string,
    otp: string,
    purpose: 'login' | 'register' | 'reset-password',
  ): Promise<void> {
    const subject = buildOtpEmailSubject(purpose);
    const text = buildOtpEmailText(otp, purpose);
    const html = buildOtpEmailHtml(otp, purpose);
    await this.send(email, subject, text, html);
  }

  private async send(
    to: string,
    subject: string,
    text: string,
    html?: string,
  ): Promise<void> {
    const transporter = this.getTransporter();

    if (!transporter) {
      if (!this.isDevelopment()) {
        this.logger.warn(`SMTP not configured — could not send email to ${to}`);
      }
      return;
    }

    await transporter.sendMail({
      from: this.configService.get<string>('mail.from'),
      to,
      subject,
      text,
      html,
    });
  }
}
