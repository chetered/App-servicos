import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  ParseFloatPipe,
  Optional,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MarketplaceService, SearchProvidersDto } from './marketplace.service';

@ApiTags('Marketplace')
@Controller('marketplace')
export class MarketplaceController {
  constructor(private marketplaceService: MarketplaceService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search and filter providers' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'service', required: false })
  @ApiQuery({ name: 'lat', required: false })
  @ApiQuery({ name: 'lng', required: false })
  @ApiQuery({ name: 'radius', required: false })
  @ApiQuery({ name: 'type', required: false, enum: ['IMMEDIATE', 'SCHEDULED'] })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  search(
    @Query('category') categorySlug?: string,
    @Query('service') serviceSlug?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radius') radius?: string,
    @Query('type') bookingType?: 'IMMEDIATE' | 'SCHEDULED',
    @Query('country') countryCode?: string,
    @Query('q') query?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    const dto: SearchProvidersDto = {
      categorySlug,
      serviceSlug,
      latitude: lat ? parseFloat(lat) : undefined,
      longitude: lng ? parseFloat(lng) : undefined,
      radiusKm: radius ? parseFloat(radius) : undefined,
      bookingType,
      countryCode,
      query,
      page,
      limit,
    };
    return this.marketplaceService.searchProviders(dto);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured and premium providers' })
  getFeatured(@Query('country') countryCode?: string, @Query('category') categorySlug?: string) {
    return this.marketplaceService.getFeaturedProviders(countryCode, categorySlug);
  }

  @Get('providers/:id')
  @ApiOperation({ summary: 'Get full provider profile with reviews' })
  getProvider(@Param('id') providerId: string) {
    return this.marketplaceService.getProviderProfile(providerId);
  }

  @Patch('providers/location')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVIDER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update provider current GPS location' })
  updateLocation(
    @CurrentUser('providerId') providerId: string,
    @Body('latitude') latitude: number,
    @Body('longitude') longitude: number,
  ) {
    return this.marketplaceService.updateProviderLocation(providerId, latitude, longitude);
  }

  @Patch('providers/availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVIDER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle provider availability status' })
  toggleAvailability(
    @CurrentUser('providerId') providerId: string,
    @Body('isAvailable') isAvailable: boolean,
  ) {
    return this.marketplaceService.toggleAvailability(providerId, isAvailable);
  }
}
