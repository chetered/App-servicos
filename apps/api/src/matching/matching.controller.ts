import { Controller, Get, Query, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MatchingService } from './matching.service';
import { SearchProvidersQueryDto } from './dto/search-providers.dto';

@ApiTags('matching')
@Controller('matching')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get('search')
  @HttpCode(200)
  @ApiOperation({ summary: 'Busca prestadores rankeados por score de matching (BLOCO D)' })
  async search(
    @Query() dto: SearchProvidersQueryDto,
    @CurrentUser('id') clientId: string,
  ): Promise<{ providers: unknown[]; meta: { total: number; searchId: string | null; latencyMs: number } }> {
    const startMs = Date.now();
    const providers = await this.matchingService.search({
      clientId,
      categoryId: dto.categoryId,
      latitude: dto.latitude,
      longitude: dto.longitude,
      scheduledAt: new Date(dto.scheduledAt),
      radiusKm: dto.radiusKm ?? 10,
    });

    return {
      providers,
      meta: {
        total: providers.length,
        searchId: providers[0]?.searchId ?? null,
        latencyMs: Date.now() - startMs,
      },
    };
  }
}
