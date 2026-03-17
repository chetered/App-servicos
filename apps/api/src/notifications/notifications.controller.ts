import { Controller, Get, Patch, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsArray, IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

class MarkReadDto {
  @ApiPropertyOptional({ description: 'Se vazio, marca todas como lidas' })
  @IsOptional() @IsArray() @IsUUID('4', { each: true })
  ids?: string[];
}

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar notificações do usuário autenticado' })
  findAll(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('perPage') perPage?: number,
  ) {
    return this.notificationsService.findAll(userId, page, perPage);
  }

  @Patch('read')
  @ApiOperation({ summary: 'Marcar notificações como lidas (todas ou por IDs)' })
  markRead(@CurrentUser('id') userId: string, @Body() dto: MarkReadDto) {
    return this.notificationsService.markRead(userId, dto.ids);
  }
}
