import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BookingsService } from './bookings.service';
import { CreateBookingDto, UpdateBookingStatusDto, PaginationQueryDto } from './dto/bookings.dto';

@ApiTags('bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo agendamento' })
  create(@Body() dto: CreateBookingDto, @CurrentUser('id') clientId: string) {
    return this.bookingsService.create(clientId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar agendamentos do usuário autenticado' })
  findAll(@CurrentUser('id') userId: string, @Query() query: PaginationQueryDto) {
    return this.bookingsService.findAll(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes de um agendamento' })
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.bookingsService.findOne(id, userId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Atualizar status do agendamento (aceitar, iniciar, concluir, cancelar)' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.bookingsService.updateStatus(id, userId, dto);
  }
}
