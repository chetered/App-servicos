import {
  IsString,
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  IsBoolean,
  IsObject,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum BookingType {
  IMMEDIATE = 'IMMEDIATE',
  SCHEDULED = 'SCHEDULED',
  RECURRING = 'RECURRING',
}

export enum RecurrenceFrequency {
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
}

class AddressDto {
  @ApiProperty({ example: 'Rua das Flores' })
  @IsString()
  street: string;

  @ApiProperty({ example: '123' })
  @IsString()
  number: string;

  @ApiPropertyOptional({ example: 'Apto 45' })
  @IsOptional()
  @IsString()
  complement?: string;

  @ApiProperty({ example: 'Jardim América' })
  @IsString()
  neighborhood: string;

  @ApiProperty({ example: 'São Paulo' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'SP' })
  @IsString()
  state: string;

  @ApiProperty({ example: '01310-100' })
  @IsString()
  postalCode: string;

  @ApiProperty({ example: -23.5616 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: -46.6563 })
  @IsNumber()
  longitude: number;
}

class RecurrenceDto {
  @ApiProperty({ enum: RecurrenceFrequency })
  @IsEnum(RecurrenceFrequency)
  frequency: RecurrenceFrequency;

  @ApiPropertyOptional({ description: 'ID do prestador preferencial para recorrência' })
  @IsOptional()
  @IsUUID()
  preferredProviderId?: string;

  @ApiPropertyOptional({ description: 'Total de ocorrências (null = indefinido)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  totalOccurrences?: number;
}

export class CreateBookingDto {
  @ApiProperty({ description: 'ID do prestador de serviço' })
  @IsUUID()
  providerId: string;

  @ApiProperty({ description: 'ID do serviço/categoria' })
  @IsUUID()
  serviceId: string;

  @ApiProperty({ enum: BookingType })
  @IsEnum(BookingType)
  bookingType: BookingType;

  @ApiPropertyOptional({ description: 'Data e hora agendada (para SCHEDULED e RECURRING)' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiProperty({ description: 'Endereço do serviço' })
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @ApiPropertyOptional({ description: 'ID de endereço salvo (alternativa ao endereço manual)' })
  @IsOptional()
  @IsUUID()
  savedAddressId?: string;

  @ApiPropertyOptional({ description: 'Método de pagamento' })
  @IsOptional()
  @IsUUID()
  paymentMethodId?: string;

  @ApiPropertyOptional({ description: 'Código de cupom' })
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiPropertyOptional({ description: 'Notas adicionais para o prestador' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Campos customizados por categoria (m², etc)' })
  @IsOptional()
  @IsObject()
  customFields?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Configuração de recorrência' })
  @IsOptional()
  @ValidateNested()
  @Type(() => RecurrenceDto)
  recurrence?: RecurrenceDto;

  @ApiPropertyOptional({ description: 'Adicionar proteção/seguro ao serviço' })
  @IsOptional()
  @IsBoolean()
  addInsurance?: boolean;
}

export class EstimatePriceDto {
  @IsUUID()
  providerId: string;

  @IsUUID()
  serviceId: string;

  @IsEnum(BookingType)
  bookingType: BookingType;

  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsOptional()
  @IsBoolean()
  addInsurance?: boolean;

  @IsOptional()
  @IsObject()
  customFields?: Record<string, any>;
}
