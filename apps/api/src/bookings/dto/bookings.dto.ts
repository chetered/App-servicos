import { IsUUID, IsDateString, IsOptional, IsString, IsIn, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty() @IsUUID()       providerId: string;
  @ApiProperty() @IsUUID()       addressId: string;
  @ApiProperty() @IsDateString() scheduledAt: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID()    serviceId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString()  clientNotes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString()  couponCode?: string;
}

export class UpdateBookingStatusDto {
  @ApiProperty({ enum: ['CONFIRMED','PROVIDER_EN_ROUTE','IN_PROGRESS','COMPLETED','CANCELLED_CLIENT','CANCELLED_PROVIDER','DISPUTED'] })
  @IsIn(['CONFIRMED','PROVIDER_EN_ROUTE','IN_PROGRESS','COMPLETED','CANCELLED_CLIENT','CANCELLED_PROVIDER','DISPUTED'])
  status: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  cancelReason?: string;
}

export class PaginationQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @IsNumber() @Min(1) @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional() @IsNumber() @Min(1) @Type(() => Number)
  perPage?: number;
}
