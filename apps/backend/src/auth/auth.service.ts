import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../common/prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { OtpService } from './otp.service';
import { TokenService } from './token.service';
import {
  RegisterEmailDto,
  LoginEmailDto,
  VerifyOtpDto,
  GoogleAuthDto,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private otpService: OtpService,
    private tokenService: TokenService,
  ) {}

  async registerWithEmail(dto: RegisterEmailDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Este e-mail já está cadastrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        fullName: dto.fullName,
        phone: dto.phone,
        roles: ['CLIENT'],
        authProvider: 'EMAIL',
        profile: {
          create: {
            displayName: dto.fullName,
          },
        },
      },
      include: { profile: true },
    });

    // Send verification email (async)
    await this.tokenService.createEmailVerificationToken(user.id, user.email);

    const tokens = await this.generateTokens(user.id, user.email, user.roles);

    this.logger.log(`New user registered: ${user.email}`);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async loginWithEmail(dto: LoginEmailDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    if (user.isBanned) {
      throw new UnauthorizedException('Conta suspensa. Entre em contato com o suporte');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.roles);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async loginWithGoogle(dto: GoogleAuthDto) {
    // Verify Google token and extract user info
    // In production: use google-auth-library to verify idToken
    // This is a placeholder for the Google OAuth flow
    const googlePayload = await this.verifyGoogleToken(dto.idToken);

    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { googleId: googlePayload.sub },
          { email: googlePayload.email },
        ],
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: googlePayload.email,
          fullName: googlePayload.name,
          googleId: googlePayload.sub,
          avatarUrl: googlePayload.picture,
          isEmailVerified: true,
          roles: ['CLIENT'],
          authProvider: 'GOOGLE',
          profile: {
            create: {
              displayName: googlePayload.name,
            },
          },
        },
      });
    }

    if (user.isBanned) {
      throw new UnauthorizedException('Conta suspensa');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        googleId: googlePayload.sub,
        lastLoginAt: new Date(),
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.roles);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async requestPhoneOtp(phone: string) {
    await this.otpService.sendOtp(phone);
    return { message: 'Código enviado por SMS' };
  }

  async verifyPhoneOtp(dto: VerifyOtpDto) {
    const isValid = await this.otpService.verifyOtp(dto.phone, dto.code);
    if (!isValid) {
      throw new BadRequestException('Código inválido ou expirado');
    }

    let user = await this.prisma.user.findFirst({
      where: { phone: dto.phone },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phone: dto.phone,
          isPhoneVerified: true,
          roles: ['CLIENT'],
          authProvider: 'PHONE',
          profile: { create: { displayName: dto.phone } },
        },
      });
    } else {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { isPhoneVerified: true, lastLoginAt: new Date() },
      });
    }

    const tokens = await this.generateTokens(user.id, user.email || user.phone, user.roles);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    const payload = await this.tokenService.verifyRefreshToken(refreshToken);
    if (!payload) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.isBanned) {
      throw new UnauthorizedException('Usuário não encontrado ou suspenso');
    }

    // Rotate refresh token
    await this.tokenService.revokeRefreshToken(refreshToken);

    const tokens = await this.generateTokens(user.id, user.email, user.roles);
    return tokens;
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.tokenService.revokeRefreshToken(refreshToken);
    }
    return { message: 'Logout realizado com sucesso' };
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) return null;
    const isValid = await bcrypt.compare(password, user.passwordHash);
    return isValid ? user : null;
  }

  private async generateTokens(userId: string, identifier: string, roles: string[]) {
    const payload = { sub: userId, email: identifier, roles };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.tokenService.createRefreshToken(userId),
    ]);

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }

  private async verifyGoogleToken(idToken: string): Promise<any> {
    // Placeholder: In production, use google-auth-library
    // const { OAuth2Client } = require('google-auth-library');
    // const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    // const ticket = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
    // return ticket.getPayload();
    throw new BadRequestException('Google OAuth not configured');
  }
}
