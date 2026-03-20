import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomInt } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RequestOtpDto, VerifyOtpDto } from './dto/auth.dto';

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async send(dto: RequestOtpDto): Promise<void> {
    // Verificar rate limit: máx 3 OTPs em 10 minutos para o mesmo destinatário
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentCount = await this.prisma.otpCode.count({
      where: { recipient: dto.recipient, purpose: dto.purpose, createdAt: { gte: tenMinAgo } },
    });
    if (recentCount >= 3) {
      throw new BadRequestException('Limite de tentativas atingido. Aguarde 10 minutos.');
    }

    const code = randomInt(100000, 999999).toString();
    const hash = this.hashCode(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    await this.prisma.otpCode.create({
      data: {
        channel: dto.channel,
        purpose: dto.purpose,
        recipient: dto.recipient,
        codeHash: hash,
        expiresAt,
      },
    });

    // Em desenvolvimento, apenas loga o código
    if (this.config.get('NODE_ENV') !== 'production') {
      console.log(`[OTP DEV] ${dto.recipient} → ${code}`);
      return;
    }

    // Em produção, enviar pelo canal correto
    await this.dispatchOtp(dto.channel, dto.recipient, code);
  }

  async verify(dto: VerifyOtpDto): Promise<void> {
    const hash = this.hashCode(dto.code);
    const otp = await this.prisma.otpCode.findFirst({
      where: {
        recipient: dto.recipient,
        codeHash: hash,
        purpose: dto.purpose,
        verified: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      throw new BadRequestException('Código inválido ou expirado');
    }

    if (otp.attempts >= 5) {
      throw new BadRequestException('Muitas tentativas inválidas. Solicite um novo código.');
    }

    await this.prisma.otpCode.update({
      where: { id: otp.id },
      data: { verified: true },
    });
  }

  private hashCode(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }

  private async dispatchOtp(
    channel: string,
    recipient: string,
    code: string,
  ): Promise<void> {
    // Aqui conectar Twilio / SendGrid / WhatsApp Business API
    // Implementação real conforme .env TWILIO_* e SENDGRID_*
    console.log(`[OTP DISPATCH] channel=${channel} to=${recipient} code=${code}`);
  }
}
