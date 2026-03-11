import { Controller, Get, Patch, Body, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProvidersService } from './providers.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles, UserRole } from '../common/decorators/roles.decorator';

@ApiTags('providers')
@Controller('providers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProvidersController {
  constructor(private providersService: ProvidersService) {}

  @Get('me')
  @Roles(UserRole.PROVIDER)
  @ApiOperation({ summary: 'Meu perfil de prestador' })
  async getMe(@CurrentUser('id') userId: string) {
    return this.providersService.getMyProvider(userId);
  }

  @Patch('me')
  @Roles(UserRole.PROVIDER)
  @ApiOperation({ summary: 'Atualizar perfil de prestador' })
  async updateMe(@CurrentUser('id') userId: string, @Body() body: any) {
    return this.providersService.updateProfile(userId, body);
  }

  @Get('me/earnings')
  @Roles(UserRole.PROVIDER)
  @ApiOperation({ summary: 'Meus ganhos e repasses' })
  async getEarnings(
    @CurrentUser('id') userId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.providersService.getEarnings(
      userId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Perfil público do prestador' })
  async getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.providersService.findById(id);
  }
}
