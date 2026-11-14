import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor(private configService: ConfigService) {}

  private getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({       
        host: this.configService.get('email.host'),
        port: this.configService.get('email.port'),
        secure: this.configService.get('email.secure'),
        auth: {
          user: this.configService.get('email.user'),
          pass: this.configService.get('email.password'),
        },
        // Connection pooling settings
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        rateLimit: 10, 
        // Timeout settings với số giây
        connectionTimeout: 60000,
        greetingTimeout: 30000, 
        socketTimeout: 60000,
      });
    }
    return this.transporter;
  }

  async sendPasswordResetCode(email: string, code: string, username: string) {
    const fromEmail = this.configService.get('email.fromEmail');
    const fromName = this.configService.get('email.fromName');

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: 'Password Reset Code - Nihonix',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello ${username},</p>
          <p>You have requested to reset your password. Use the following code to reset your password:</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${code}</h1>
          </div>
          <p><strong>This code will expire in 15 minutes.</strong></p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">This is an automated message from ${fromName}.</p>
        </div>
      `,
      text: `
        Password Reset Request
        
        Hello ${username},
        
        You have requested to reset your password. Use the following code to reset your password:
        
        ${code}
        
        This code will expire in 15 minutes.
        
        If you didn't request this password reset, please ignore this email.
        
        This is an automated message from ${fromName}.
      `
    };

    try {
      const result = await this.getTransporter().sendMail(mailOptions);
      
      console.log('📧 Email sent successfully:', {
        messageId: result.messageId,
        to: email,
        subject: mailOptions.subject
      });

      return {
        success: true,
        message: 'Password reset code sent successfully',
        messageId: result.messageId,
      };
    } catch (error) {

      throw new Error('Failed to send email. Please try again later.');
    }
  }

  // Cleanup method for graceful shutdown
  async closeTransporter(): Promise<void> {
    if (this.transporter) {
      await this.transporter.close();
      this.transporter = null;
    }
  }
}