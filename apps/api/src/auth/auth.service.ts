import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from './otp.service';
import { LoginEmailDto, RegisterDto, VerifyOtpDto } from './dto/auth.dto';
import { TokenPair } from '@servicos/types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly otpService: OtpService,
  ) {}

  async loginWithPassword(dto: LoginEmailDto): Promise<TokenPair> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, passwordHash: true, status: true, email: true, phone: true },
    });

    if (!user?.passwordHash) throw new UnauthorizedException('Credenciais inválidas');
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciais inválidas');
    if (user.status === 'BANNED') throw new UnauthorizedException('Conta banida');
    if (user.status === 'SUSPENDED') throw new UnauthorizedException('Conta suspensa');

    return this.issueTokens(user.id);
  }

  async register(dto: RegisterDto): Promise<TokenPair> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email já cadastrado');

    const hash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: hash,
        profile: {
          create: {
            firstName: dto.firstName,
            lastName: dto.lastName,
          },
        },
      },
    });

    return this.issueTokens(user.id);
  }

  async loginWithOtp(dto: VerifyOtpDto): Promise<TokenPair> {
    await this.otpService.verify(dto);

    // Upsert: cria o usuário se não existir (login por telefone)
    const user = await this.prisma.user.upsert({
      where: dto.channel === 'EMAIL' ? { email: dto.recipient } : { phone: dto.recipient },
      update: {},
      create: {
        ...(dto.channel === 'EMAIL' ? { email: dto.recipient } : { phone: dto.recipient }),
        status: 'ACTIVE',
      },
    });

    return this.issueTokens(user.id);
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    const hash = await this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash: hash } });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    // Rotate: revoga o token antigo e emite um novo par
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(stored.userId);
  }

  async logout(sessionId: string): Promise<void> {
    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }

  // ─── Internal ─────────────────────────────────────────────────────────────

  private async issueTokens(userId: string): Promise<TokenPair> {
    const sessionId = uuidv4();
    const accessToken = this.jwt.sign({ sub: userId, sessionId }, { expiresIn: '15m' });
    const refreshToken = uuidv4();
    const refreshHash = await this.hashToken(refreshToken);

    const expiresIn = 7 * 24 * 60 * 60; // 7 dias em segundos
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    await Promise.all([
      this.prisma.userSession.create({
        data: { id: sessionId, userId, tokenHash: await this.hashToken(accessToken), expiresAt },
      }),
      this.prisma.refreshToken.create({
        data: { userId, tokenHash: refreshHash, expiresAt },
      }),
    ]);

    return { accessToken, refreshToken, expiresIn };
  }

  private async hashToken(token: string): Promise<string> {
    const { createHash } = await import('crypto');
    return createHash('sha256').update(token).digest('hex');
  }
}
