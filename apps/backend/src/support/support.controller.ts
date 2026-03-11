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
import { SupportService, CreateTicketDto, AddMessageDto, OpenDisputeDto } from './support.service';

@ApiTags('Support')
@Controller('support')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SupportController {
  constructor(private supportService: SupportService) {}

  // ── Tickets ──────────────────────────────────────────────────

  @Post('tickets')
  @ApiOperation({ summary: 'Open a support ticket' })
  createTicket(@CurrentUser('id') userId: string, @Body() dto: CreateTicketDto) {
    return this.supportService.createTicket(userId, dto);
  }

  @Get('tickets')
  @ApiOperation({ summary: 'List my support tickets' })
  myTickets(@CurrentUser('id') userId: string) {
    return this.supportService.findMyTickets(userId);
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Get ticket details' })
  getTicket(@Param('id') ticketId: string, @CurrentUser('id') userId: string) {
    return this.supportService.findTicket(ticketId, userId);
  }

  @Post('tickets/:id/messages')
  @ApiOperation({ summary: 'Add a message to a ticket' })
  addMessage(
    @Param('id') ticketId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: AddMessageDto,
  ) {
    return this.supportService.addMessage(ticketId, userId, 'CLIENT', dto);
  }

  // ── Disputes ─────────────────────────────────────────────────

  @Post('disputes')
  @ApiOperation({ summary: 'Open a dispute for a completed order' })
  openDispute(@CurrentUser('id') userId: string, @Body() dto: OpenDisputeDto) {
    return this.supportService.openDispute(userId, dto);
  }

  // ── Admin ─────────────────────────────────────────────────────

  @Get('admin/tickets')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPPORT')
  @ApiOperation({ summary: '[Admin] List all tickets' })
  allTickets(
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit = 50,
  ) {
    return this.supportService.findAll(status, priority, page, limit);
  }

  @Patch('admin/tickets/:id/resolve')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPPORT')
  @ApiOperation({ summary: '[Admin] Resolve a support ticket' })
  resolveTicket(
    @Param('id') ticketId: string,
    @CurrentUser('id') adminId: string,
    @Body('resolutionNote') resolutionNote: string,
  ) {
    return this.supportService.resolveTicket(ticketId, adminId, resolutionNote);
  }

  @Post('admin/tickets/:id/messages')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPPORT')
  @ApiOperation({ summary: '[Admin] Send a message in a ticket' })
  adminMessage(
    @Param('id') ticketId: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: AddMessageDto,
  ) {
    return this.supportService.addMessage(ticketId, adminId, 'SUPPORT', dto);
  }

  @Patch('admin/disputes/:id/decide')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[Admin] Decide a dispute in favor of client or provider' })
  decideDispute(
    @Param('id') disputeId: string,
    @CurrentUser('id') adminId: string,
    @Body('decidedFor') decidedFor: 'CLIENT' | 'PROVIDER',
    @Body('decisionNote') decisionNote: string,
  ) {
    return this.supportService.decideDispute(disputeId, adminId, decidedFor, decisionNote);
  }
}
