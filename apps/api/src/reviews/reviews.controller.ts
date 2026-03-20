import { Controller, Post, Patch, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, RespondReviewDto } from './dto/reviews.dto';

@ApiTags('reviews')
@Controller('reviews')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar avaliação de um serviço concluído' })
  create(@Body() dto: CreateReviewDto, @CurrentUser('id') userId: string) {
    return this.reviewsService.create(userId, dto);
  }

  @Patch(':id/response')
  @ApiOperation({ summary: 'Prestador responde uma avaliação' })
  respond(
    @Param('id') id: string,
    @Body() dto: RespondReviewDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.reviewsService.respond(id, userId, dto);
  }

  @Get('provider/:providerId')
  @ApiOperation({ summary: 'Listar avaliações de um prestador' })
  findByProvider(
    @Param('providerId') providerId: string,
    @Query('page') page?: number,
    @Query('perPage') perPage?: number,
  ) {
    return this.reviewsService.findByProvider(providerId, page, perPage);
  }
}
