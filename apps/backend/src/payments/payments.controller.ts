import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  UseGuards,
  RawBodyRequest,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

class SavePaymentMethodDto {
  @IsString() @IsNotEmpty() token: string;
}

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('methods')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Salvar método de pagamento' })
  async saveMethod(
    @CurrentUser('id') userId: string,
    @Body() dto: SavePaymentMethodDto,
  ) {
    return this.paymentsService.savePaymentMethod(userId, dto.token);
  }

  @Post('webhook/:gateway')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receber webhook de gateway de pagamento' })
  async webhook(
    @Param('gateway') gateway: string,
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') stripeSignature?: string,
    @Headers('x-signature') mpSignature?: string,
  ) {
    const payload = (req as any).rawBody?.toString() || JSON.stringify(req.body);
    const signature = stripeSignature || mpSignature || '';

    await this.paymentsService.processWebhook(gateway, payload, signature);
    return { received: true };
  }
}
