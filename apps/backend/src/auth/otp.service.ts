import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly OTP_TTL = 600; // 10 minutes
  private readonly OTP_MAX_ATTEMPTS = 5;

  constructor(private configService: ConfigService) {}

  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOtp(phone: string): Promise<void> {
    const otp = this.generateOtp();
    const key = `otp:${phone}`;

    // In production: store in Redis with TTL
    // For now, log it (replace with actual SMS provider)
    this.logger.log(`OTP for ${phone}: ${otp}`);

    // TODO: Integrate with SMS provider (Twilio, AWS SNS, etc.)
    // await this.smsService.send(phone, `Seu código SERVIX: ${otp}. Válido por 10 minutos.`);

    // Store OTP hash (never store raw OTP)
    // await this.redis.set(key, hashedOtp, 'EX', this.OTP_TTL);
  }

  async verifyOtp(phone: string, code: string): Promise<boolean> {
    const key = `otp:${phone}`;

    // TODO: Retrieve from Redis and compare
    // const storedHash = await this.redis.get(key);
    // if (!storedHash) return false;
    // const isValid = await bcrypt.compare(code, storedHash);
    // if (isValid) await this.redis.del(key);
    // return isValid;

    // Placeholder for development
    if (this.configService.get('NODE_ENV') === 'development' && code === '123456') {
      return true;
    }

    return false;
  }
}
