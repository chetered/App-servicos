import { Controller, Get, Patch, Post, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Perfil do usuário autenticado' })
  async getMe(@CurrentUser('id') userId: string) {
    return this.usersService.findById(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Atualizar perfil' })
  async updateMe(@CurrentUser('id') userId: string, @Body() body: any) {
    return this.usersService.updateProfile(userId, body);
  }

  @Get('me/addresses')
  @ApiOperation({ summary: 'Listar endereços salvos' })
  async getAddresses(@CurrentUser('id') userId: string) {
    return this.usersService.getAddresses(userId);
  }

  @Post('me/addresses')
  @ApiOperation({ summary: 'Adicionar endereço' })
  async addAddress(@CurrentUser('id') userId: string, @Body() body: any) {
    return this.usersService.addAddress(userId, body);
  }

  @Post('me/favorites/:providerId/toggle')
  @ApiOperation({ summary: 'Favoritar/desfavoritar prestador' })
  async toggleFavorite(
    @CurrentUser('id') userId: string,
    @Param('providerId', ParseUUIDPipe) providerId: string,
  ) {
    return this.usersService.toggleFavorite(userId, providerId);
  }
}
