import { IsEmail, IsEnum, IsString, MinLength, MaxLength, IsMobilePhone } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestOtpDto {
  @ApiProperty({ example: '+5511987654321' })
  @IsString()
  recipient: string;

  @ApiProperty({ enum: ['EMAIL', 'SMS', 'WHATSAPP'] })
  @IsEnum(['EMAIL', 'SMS', 'WHATSAPP'])
  channel: 'EMAIL' | 'SMS' | 'WHATSAPP';

  @ApiProperty({ enum: ['REGISTRATION', 'LOGIN', 'PASSWORD_RESET', 'PHONE_VERIFICATION'] })
  @IsEnum(['REGISTRATION', 'LOGIN', 'PASSWORD_RESET', 'PHONE_VERIFICATION'])
  purpose: 'REGISTRATION' | 'LOGIN' | 'PASSWORD_RESET' | 'PHONE_VERIFICATION';
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+5511987654321' })
  @IsString()
  recipient: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  code: string;

  @ApiProperty({ enum: ['EMAIL', 'SMS', 'WHATSAPP'] })
  @IsEnum(['EMAIL', 'SMS', 'WHATSAPP'])
  channel: 'EMAIL' | 'SMS' | 'WHATSAPP';

  @ApiProperty({ enum: ['REGISTRATION', 'LOGIN', 'PASSWORD_RESET', 'PHONE_VERIFICATION'] })
  @IsEnum(['REGISTRATION', 'LOGIN', 'PASSWORD_RESET', 'PHONE_VERIFICATION'])
  purpose: 'REGISTRATION' | 'LOGIN' | 'PASSWORD_RESET' | 'PHONE_VERIFICATION';
}

export class LoginEmailDto {
  @ApiProperty({ example: 'usuario@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SenhaSegura123!' })
  @IsString()
  @MinLength(8)
  password: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'usuario@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SenhaSegura123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @ApiProperty({ example: 'João' })
  @IsString()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Silva' })
  @IsString()
  @MaxLength(100)
  lastName: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}
