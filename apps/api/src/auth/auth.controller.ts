import { Controller, Post, Body, Get, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import {
  RequestOtpDto,
  VerifyOtpDto,
  RegisterDto,
  LoginEmailDto,
  RefreshTokenDto,
} from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly otpService: OtpService,
  ) {}

  /** Solicita código OTP por SMS/WhatsApp/Email */
  @Post('otp/request')
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar código OTP' })
  async requestOtp(@Body() dto: RequestOtpDto) {
    await this.otpService.send(dto);
    return { message: 'Código enviado com sucesso.' };
  }

  /** Verifica OTP e retorna tokens (login ou registro) */
  @Post('otp/verify')
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar código OTP e obter tokens' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.loginWithOtp(dto);
  }

  /** Login por email + senha */
  @Post('login')
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login com email e senha' })
  async loginEmail(@Body() dto: LoginEmailDto) {
    return this.authService.loginWithPassword(dto);
  }

  /** Registro por email + senha */
  @Post('register')
  @ApiOperation({ summary: 'Criar conta com email e senha' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /** Renova access token com refresh token */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar access token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  /** Revoga sessão atual */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout (revogar token)' })
  async logout(@CurrentUser('sessionId') sessionId: string) {
    await this.authService.logout(sessionId);
    return { message: 'Sessão encerrada.' };
  }

  /** Retorna dados do usuário autenticado */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Dados do usuário autenticado' })
  me(@CurrentUser() user: { id: string; email?: string; phone?: string; roles: string[] }) {
    return user;
  }
}
