import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/users.dto';

@ApiTags('users') @Controller('users') @UseGuards(JwtAuthGuard) @ApiBearerAuth('access-token')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Get('me') @ApiOperation({ summary: 'Perfil completo do usuário autenticado' })
  getMe(@CurrentUser('id') id: string) { return this.usersService.findById(id); }
  @Put('me') @ApiOperation({ summary: 'Atualizar perfil' })
  updateMe(@CurrentUser('id') id: string, @Body() dto: UpdateProfileDto) { return this.usersService.updateProfile(id, dto); }
  @Get('me/addresses') @ApiOperation({ summary: 'Listar endereços do usuário' })
  addresses(@CurrentUser('id') id: string) { return this.usersService.findAddresses(id); }
}
