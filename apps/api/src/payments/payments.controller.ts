import { Controller, Post, Get, Param, Body, UseGuards, Headers, RawBodyRequest, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import { InitiatePaymentDto } from './dto/payments.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Iniciar pagamento de um agendamento' })
  initiate(@Body() dto: InitiatePaymentDto, @CurrentUser('id') userId: string) {
    return this.paymentsService.initiate(userId, dto);
  }

  @Get('booking/:bookingId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Consultar pagamento de um agendamento' })
  findByBooking(@Param('bookingId') bookingId: string, @CurrentUser('id') userId: string) {
    return this.paymentsService.findByBooking(bookingId, userId);
  }

  @Post('webhook/asaas')
  @ApiOperation({ summary: 'Webhook Asaas (interno)' })
  handleWebhook(@Body() payload: Record<string, unknown>) {
    return this.paymentsService.handleWebhook(payload);
  }
}
