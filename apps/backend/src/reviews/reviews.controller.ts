import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReviewsService, CreateReviewDto } from './reviews.service';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a review after completing an order' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(userId, dto);
  }

  @Get('provider/:providerId')
  @ApiOperation({ summary: 'Get all published reviews for a provider' })
  findByProvider(
    @Param('providerId') providerId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.reviewsService.findByProvider(providerId, page, limit);
  }

  @Patch(':id/reply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVIDER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Provider replies to a review' })
  reply(
    @Param('id') reviewId: string,
    @CurrentUser('providerId') providerId: string,
    @Body('reply') reply: string,
  ) {
    return this.reviewsService.replyToReview(reviewId, providerId, reply);
  }

  @Patch(':id/flag')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Flag a review as inappropriate' })
  flag(
    @Param('id') reviewId: string,
    @CurrentUser('id') userId: string,
    @Body('reason') reason: string,
  ) {
    return this.reviewsService.flagReview(reviewId, reason, userId);
  }

  @Patch(':id/moderate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Approve or remove a flagged review' })
  moderate(
    @Param('id') reviewId: string,
    @CurrentUser('id') moderatorId: string,
    @Body('approve') approve: boolean,
  ) {
    return this.reviewsService.moderateFlagged(reviewId, approve, moderatorId);
  }
}
