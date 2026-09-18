import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UpdateOrderDto } from './dto/update-order.dto.js';
import { AddPaymentDto } from './dto/add-payment.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { OrdersService } from './orders.service.js';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll() { return this.ordersService.findAll(); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto) { return this.ordersService.update(id, dto); }

  @Post(':id/payments')
  addPayment(@Param('id') id: string, @Body() dto: AddPaymentDto) { return this.ordersService.addPayment(id, dto); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.ordersService.findOne(id); }

  @Post('from-lead/:leadId')
  createFromLead(@Param('leadId') leadId: string) { return this.ordersService.createFromLead(leadId); }
}
