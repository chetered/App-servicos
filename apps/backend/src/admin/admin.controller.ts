import {
  Controller, Get, Post, Patch, Body, Param, Query,
  UseGuards, ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AdminService } from './admin.service';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) {}

  // ── Dashboard ──────────────────────────────────────────────────

  @Get('dashboard')
  @ApiOperation({ summary: 'Platform KPI dashboard' })
  dashboard() {
    return this.adminService.getDashboardMetrics();
  }

  // ── Users ──────────────────────────────────────────────────────

  @Get('users')
  @ApiOperation({ summary: 'List all users with search and filter' })
  listUsers(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit = 50,
  ) {
    return this.adminService.listUsers(search, role, page, limit);
  }

  @Patch('users/:id/ban')
  @ApiOperation({ summary: 'Ban a user' })
  banUser(
    @Param('id') userId: string,
    @Body('reason') reason: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.adminService.banUser(userId, reason, adminId);
  }

  @Patch('users/:id/unban')
  @ApiOperation({ summary: 'Unban a user' })
  unbanUser(@Param('id') userId: string, @CurrentUser('id') adminId: string) {
    return this.adminService.unbanUser(userId, adminId);
  }

  // ── Providers ──────────────────────────────────────────────────

  @Get('providers/pending')
  @ApiOperation({ summary: 'List providers pending review' })
  pendingProviders() {
    return this.adminService.listPendingProviders();
  }

  @Patch('providers/:id/approve')
  @ApiOperation({ summary: 'Approve a provider registration' })
  approveProvider(@Param('id') providerId: string, @CurrentUser('id') adminId: string) {
    return this.adminService.approveProvider(providerId, adminId);
  }

  @Patch('providers/:id/reject')
  @ApiOperation({ summary: 'Reject a provider registration' })
  rejectProvider(
    @Param('id') providerId: string,
    @CurrentUser('id') adminId: string,
    @Body('notes') notes: string,
  ) {
    return this.adminService.rejectProvider(providerId, adminId, notes);
  }

  // ── Orders ─────────────────────────────────────────────────────

  @Get('orders')
  @ApiOperation({ summary: 'List all orders' })
  listOrders(
    @Query('status') status?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit = 50,
  ) {
    return this.adminService.listOrders(status, page, limit);
  }

  // ── Analytics ──────────────────────────────────────────────────

  @Get('analytics/revenue')
  @ApiOperation({ summary: 'Revenue breakdown by source' })
  revenueBySource(@Query('days', new DefaultValuePipe(30), ParseIntPipe) days = 30) {
    return this.adminService.getRevenueBySource(days);
  }

  @Get('analytics/orders')
  @ApiOperation({ summary: 'Orders time series (daily)' })
  ordersSeries(@Query('days', new DefaultValuePipe(30), ParseIntPipe) days = 30) {
    return this.adminService.getOrdersTimeSeries(days);
  }

  // ── Feature Flags ──────────────────────────────────────────────

  @Get('feature-flags')
  @Roles('ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'List all feature flags' })
  listFlags(@Query('country') countryCode?: string) {
    return this.adminService.listFeatureFlags(countryCode);
  }

  @Patch('feature-flags/toggle')
  @ApiOperation({ summary: 'Toggle a feature flag status' })
  toggleFlag(
    @Body('key') key: string,
    @Body('countryId') countryId: string | null,
    @Body('status') status: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.adminService.toggleFeatureFlag(key, countryId, status, adminId);
  }

  // ── Audit ──────────────────────────────────────────────────────

  @Get('audit-log')
  @ApiOperation({ summary: 'Platform audit log' })
  auditLog(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit = 100,
  ) {
    return this.adminService.getAuditLog(page, limit);
  }
}
