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
import { PayoutsService } from './payouts.service';

@ApiTags('Payouts')
@Controller('payouts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PayoutsController {
  constructor(private payoutsService: PayoutsService) {}

  @Get('wallet')
  @UseGuards(RolesGuard)
  @Roles('PROVIDER')
  @ApiOperation({ summary: 'Get provider wallet summary' })
  getWallet(@CurrentUser('providerId') providerId: string) {
    return this.payoutsService.getWalletSummary(providerId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('PROVIDER')
  @ApiOperation({ summary: 'List my payouts' })
  myPayouts(@CurrentUser('providerId') providerId: string) {
    return this.payoutsService.findProviderPayouts(providerId);
  }

  @Post('request')
  @UseGuards(RolesGuard)
  @Roles('PROVIDER')
  @ApiOperation({ summary: 'Request a manual payout withdrawal' })
  requestPayout(
    @CurrentUser('providerId') providerId: string,
    @Body('amount') amount: number,
    @Body('method') method: string,
    @Body('destination') destination: string,
  ) {
    return this.payoutsService.requestPayout(providerId, amount, method, destination);
  }

  // ── Admin ─────────────────────────────────────────────────────

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPPORT')
  @ApiOperation({ summary: '[Admin] List all payouts' })
  allPayouts(
    @Query('status') status?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit = 50,
  ) {
    return this.payoutsService.findAll(status, page, limit);
  }

  @Patch('admin/:id/approve')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[Admin] Approve a payout for processing' })
  approve(@Param('id') payoutId: string, @CurrentUser('id') adminId: string) {
    return this.payoutsService.approvePayout(payoutId, adminId);
  }

  @Patch('admin/:id/fail')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[Admin] Mark a payout as failed (refunds provider balance)' })
  fail(@Param('id') payoutId: string, @Body('reason') reason: string) {
    return this.payoutsService.markFailed(payoutId, reason);
  }
}
