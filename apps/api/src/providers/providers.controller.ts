import { Controller, Get, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ProvidersService } from './providers.service';
@ApiTags('providers') @Controller('providers') @UseGuards(JwtAuthGuard) @ApiBearerAuth('access-token')
export class ProvidersController {
  constructor(private readonly svc: ProvidersService) {}
  @Get() @ApiOperation({ summary: 'Listar todos os prestadores (paginado)' })
  findAll(@Query('page') page?: string, @Query('perPage') perPage?: string) {
    return this.svc.findAll({ page: page ? Number(page) : undefined, perPage: perPage ? Number(perPage) : undefined });
  }
  @Get('me/profile') @ApiOperation({ summary: 'Perfil do prestador autenticado' })
  getMyProfile(@CurrentUser('id') id: string) { return this.svc.findByUserId(id); }
  @Put('me/availability') @ApiOperation({ summary: 'Atualizar disponibilidade do prestador' })
  updateAvailability(@CurrentUser('id') id: string, @Body() dto: { slots: Array<{dayOfWeek:number;startTime:string;endTime:string}> }) {
    return this.svc.updateAvailability(id, dto.slots);
  }
  @Get(':id') @ApiOperation({ summary: 'Perfil público de um prestador' })
  findOne(@Param('id') id: string) { return this.svc.findById(id); }
}
