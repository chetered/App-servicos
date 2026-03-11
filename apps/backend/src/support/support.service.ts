import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface CreateTicketDto {
  orderId?: string;
  category: string; // CANCELLATION | QUALITY | PAYMENT | OTHER
  subject: string;
  description: string;
  attachments?: string[];
}

export interface AddMessageDto {
  message: string;
  attachments?: string[];
}

export interface OpenDisputeDto {
  orderId: string;
  reason: string;
  description?: string;
  evidence?: Record<string, any>;
}

@Injectable()
export class SupportService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  // ── Tickets ──────────────────────────────────────────────────

  async createTicket(reporterId: string, dto: CreateTicketDto) {
    if (dto.orderId) {
      const order = await this.prisma.serviceOrder.findUnique({ where: { id: dto.orderId } });
      if (!order) throw new NotFoundException('Order not found');

      const existing = await this.prisma.supportTicket.findUnique({ where: { orderId: dto.orderId } });
      if (existing) throw new BadRequestException('A ticket already exists for this order');
    }

    const ticket = await this.prisma.supportTicket.create({
      data: {
        reporterId,
        orderId: dto.orderId,
        category: dto.category,
        subject: dto.subject,
        description: dto.description,
        attachments: dto.attachments ?? [],
        status: 'OPEN',
      },
    });

    this.eventEmitter.emit('support.ticket_created', { ticketId: ticket.id, reporterId });
    return ticket;
  }

  async findMyTickets(reporterId: string) {
    return this.prisma.supportTicket.findMany({
      where: { reporterId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findTicket(ticketId: string, userId: string, isAdmin = false) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { messages: { orderBy: { createdAt: 'asc' } }, dispute: true },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (!isAdmin && ticket.reporterId !== userId) throw new ForbiddenException('Not your ticket');
    return ticket;
  }

  async addMessage(ticketId: string, authorId: string, authorType: string, dto: AddMessageDto) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.status === 'CLOSED') throw new BadRequestException('Ticket is closed');

    const message = await this.prisma.ticketMessage.create({
      data: {
        ticketId,
        authorId,
        authorType,
        message: dto.message,
        attachments: dto.attachments ?? [],
      },
    });

    // Update ticket status when client/provider replies
    let newStatus = ticket.status;
    if (authorType === 'CLIENT' && ticket.status === 'AWAITING_CLIENT') newStatus = 'IN_PROGRESS';
    if (authorType === 'PROVIDER' && ticket.status === 'AWAITING_PROVIDER') newStatus = 'IN_PROGRESS';
    if (authorType === 'SUPPORT') {
      newStatus = 'AWAITING_CLIENT';
    }

    if (newStatus !== ticket.status) {
      await this.prisma.supportTicket.update({ where: { id: ticketId }, data: { status: newStatus as any } });
    }

    return message;
  }

  async resolveTicket(ticketId: string, adminId: string, resolutionNote: string) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: 'RESOLVED', resolvedAt: new Date(), assignedTo: adminId, resolutionNote },
    });
  }

  // Admin: list all tickets with filters
  async findAll(status?: string, priority?: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const [items, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        include: { reporter: { select: { fullName: true, email: true } }, messages: false },
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  // ── Disputes ─────────────────────────────────────────────────

  async openDispute(clientId: string, dto: OpenDisputeDto) {
    const order = await this.prisma.serviceOrder.findUnique({ where: { id: dto.orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.clientId !== clientId) throw new ForbiddenException('Not your order');
    if (!['COMPLETED', 'CANCELLED_BY_PROVIDER', 'IN_DISPUTE'].includes(order.status)) {
      throw new BadRequestException('Order cannot be disputed at this stage');
    }

    const existing = await this.prisma.dispute.findUnique({ where: { orderId: dto.orderId } });
    if (existing) throw new BadRequestException('Dispute already exists for this order');

    const [dispute] = await this.prisma.$transaction([
      this.prisma.dispute.create({
        data: {
          orderId: dto.orderId,
          reason: dto.reason,
          description: dto.description,
          evidence: dto.evidence,
          status: 'OPEN',
        },
      }),
      this.prisma.serviceOrder.update({
        where: { id: dto.orderId },
        data: { status: 'IN_DISPUTE' },
      }),
    ]);

    this.eventEmitter.emit('dispute.opened', { disputeId: dispute.id, orderId: dto.orderId, clientId });
    return dispute;
  }

  async decideDispute(
    disputeId: string,
    adminId: string,
    decidedFor: 'CLIENT' | 'PROVIDER',
    decisionNote: string,
  ) {
    const dispute = await this.prisma.dispute.findUnique({ where: { id: disputeId } });
    if (!dispute) throw new NotFoundException('Dispute not found');
    if (dispute.status === 'CLOSED') throw new BadRequestException('Dispute is already closed');

    return this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: 'CLOSED',
        decidedFor,
        decisionNote,
        decidedAt: new Date(),
        decidedBy: adminId,
      },
    });
  }
}
