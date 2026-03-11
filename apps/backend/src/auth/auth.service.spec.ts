import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { OtpService } from './otp.service';
import { TokenService } from './token.service';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    emailVerificationToken: {
      create: jest.fn(),
    },
  };

  const mockJwt = { signAsync: jest.fn().mockResolvedValue('mock-access-token') };
  const mockConfig = { get: jest.fn().mockReturnValue('test-value') };
  const mockOtp = { sendOtp: jest.fn(), verifyOtp: jest.fn() };
  const mockTokenService = {
    createRefreshToken: jest.fn().mockResolvedValue('mock-refresh-token'),
    verifyRefreshToken: jest.fn(),
    revokeRefreshToken: jest.fn(),
    createEmailVerificationToken: jest.fn(),
  };
  const mockUsersService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
        { provide: OtpService, useValue: mockOtp },
        { provide: TokenService, useValue: mockTokenService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('registerWithEmail()', () => {
    it('should register a new user successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@email.com',
        fullName: 'Test User',
        roles: ['CLIENT'],
        profile: {},
      });

      const result = await service.registerWithEmail({
        email: 'Test@Email.com',
        password: 'Pass@1234',
        fullName: 'Test User',
      });

      expect(result.user.email).toBe('test@email.com');
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

      await expect(
        service.registerWithEmail({ email: 'existing@email.com', password: 'Pass@1234', fullName: 'User' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('loginWithEmail()', () => {
    it('should login successfully with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('Pass@1234', 12);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@email.com',
        passwordHash: hashedPassword,
        roles: ['CLIENT'],
        isBanned: false,
      });
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.loginWithEmail({
        email: 'test@email.com',
        password: 'Pass@1234',
      });

      expect(result.accessToken).toBe('mock-access-token');
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPassword', 12);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@email.com',
        passwordHash: hashedPassword,
        isBanned: false,
      });

      await expect(
        service.loginWithEmail({ email: 'test@email.com', password: 'WrongPassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for banned user', async () => {
      const hashedPassword = await bcrypt.hash('Pass@1234', 12);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@email.com',
        passwordHash: hashedPassword,
        isBanned: true,
      });

      await expect(
        service.loginWithEmail({ email: 'test@email.com', password: 'Pass@1234' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
