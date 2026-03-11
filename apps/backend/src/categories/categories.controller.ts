import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List all active categories (optionally filtered by country)' })
  @ApiQuery({ name: 'country', required: false, example: 'BR' })
  findAll(@Query('country') country?: string) {
    return this.categoriesService.findAll(country);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get category by slug with subcategories and services' })
  findOne(@Param('slug') slug: string) {
    return this.categoriesService.findOne(slug);
  }

  @Get(':slug/services')
  @ApiOperation({ summary: 'List all services in a category' })
  findServices(@Param('slug') slug: string) {
    return this.categoriesService.findServices(slug);
  }

  @Get('services/:serviceSlug')
  @ApiOperation({ summary: 'Get a single service by slug' })
  findService(@Param('serviceSlug') serviceSlug: string) {
    return this.categoriesService.findService(serviceSlug);
  }
}
