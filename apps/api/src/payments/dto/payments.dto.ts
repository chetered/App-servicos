import { IsUUID, IsString, IsIn, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InitiatePaymentDto {
  @ApiProperty() @IsUUID()
  bookingId: string;

  @ApiProperty({ enum: ['PIX', 'CREDIT_CARD', 'DEBIT_CARD'] })
  @IsIn(['PIX', 'CREDIT_CARD', 'DEBIT_CARD'])
  method: string;

  @ApiPropertyOptional({ description: 'Token do cartão (Asaas)' })
  @IsOptional() @IsString()
  cardToken?: string;
}

export class WebhookDto {
  @ApiProperty() @IsString() event: string;
  @ApiProperty() payment: Record<string, unknown>;
}
