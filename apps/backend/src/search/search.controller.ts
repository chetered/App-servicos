import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { SearchService } from './search.service';

class SearchProvidersQuery {
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() serviceId?: string;
  @Type(() => Number) @IsNumber() latitude: number;
  @Type(() => Number) @IsNumber() longitude: number;
  @IsOptional() @Type(() => Number) @IsNumber() radiusKm?: number;
  @IsOptional() @Type(() => Number) @IsNumber() minRating?: number;
  @IsOptional() @Type(() => Number) @IsNumber() maxPrice?: number;
  @IsOptional() @Transform(({ value }) => value === 'true') @IsBoolean() isAvailableNow?: boolean;
  @IsOptional() @IsString() sortBy?: 'relevance' | 'price' | 'rating' | 'distance';
  @IsOptional() @IsString() cursor?: string;
  @IsOptional() @Type(() => Number) @IsNumber() limit?: number;
  @IsOptional() @IsString() countryCode?: string;
}

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get('providers')
  @ApiOperation({ summary: 'Buscar prestadores por localização e categoria' })
  async searchProviders(@Query() query: SearchProvidersQuery) {
    return this.searchService.searchProviders(query);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Listar categorias disponíveis' })
  async getCategories(@Query('countryCode') countryCode?: string) {
    return this.searchService.getCategories(countryCode || 'BR');
  }
}
