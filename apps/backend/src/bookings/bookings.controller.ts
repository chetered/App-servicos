import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { PricingService } from './pricing.service';
import { CreateBookingDto, EstimatePriceDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles, UserRole } from '../common/decorators/roles.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BookingsController {
  constructor(
    private bookingsService: BookingsService,
    private pricingService: PricingService,
  ) {}

  @Post('estimate')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Estimar preço antes de contratar' })
  async estimatePrice(
    @CurrentUser('id') clientId: string,
    @Body() dto: EstimatePriceDto,
  ) {
    return this.pricingService.estimate({
      providerId: dto.providerId,
      serviceId: dto.serviceId,
      bookingType: dto.bookingType,
      clientLatitude: dto.address.latitude,
      clientLongitude: dto.address.longitude,
      couponCode: dto.couponCode,
      addInsurance: dto.addInsurance,
      customFields: dto.customFields,
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Criar novo pedido/contratação' })
  async create(
    @CurrentUser('id') clientId: string,
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookingsService.create(clientId, dto);
  }

  @Get('my')
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Meus pedidos (como cliente)' })
  async myBookings(
    @CurrentUser('id') clientId: string,
    @Query() pagination: PaginationDto,
    @Query('status') status?: string,
  ) {
    return this.bookingsService.listByClient(clientId, {
      status,
      cursor: pagination.cursor,
      limit: pagination.limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe do pedido' })
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) bookingId: string,
  ) {
    return this.bookingsService.findOne(bookingId, userId);
  }

  @Patch(':id/accept')
  @Roles(UserRole.PROVIDER)
  @ApiOperation({ summary: 'Prestador aceita pedido' })
  async accept(
    @CurrentUser('id') providerId: string,
    @Param('id', ParseUUIDPipe) bookingId: string,
  ) {
    return this.bookingsService.acceptByProvider(bookingId, providerId);
  }

  @Patch(':id/complete')
  @Roles(UserRole.PROVIDER)
  @ApiOperation({ summary: 'Prestador marca serviço como concluído' })
  async complete(
    @CurrentUser('id') providerId: string,
    @Param('id', ParseUUIDPipe) bookingId: string,
  ) {
    return this.bookingsService.completeByProvider(bookingId, providerId);
  }
}
