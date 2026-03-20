import { IsUUID, IsNumber, IsDateString, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchProvidersQueryDto {
  @ApiProperty({ example: 'uuid-da-categoria' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ example: -23.5654, description: 'Latitude do cliente' })
  @IsNumber()
  @Type(() => Number)
  latitude: number;

  @ApiProperty({ example: -46.6833, description: 'Longitude do cliente' })
  @IsNumber()
  @Type(() => Number)
  longitude: number;

  @ApiProperty({ example: '2025-01-15T09:00:00Z', description: 'Data/hora do agendamento (ISO8601)' })
  @IsDateString()
  scheduledAt: string;

  @ApiPropertyOptional({ example: 10, default: 10, description: 'Raio máximo de busca em km' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  radiusKm?: number;
}
