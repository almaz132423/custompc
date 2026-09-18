import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { OrdersService } from './orders.service.js';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll() { return this.ordersService.findAll(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.ordersService.findOne(id); }

  @Post('from-lead/:leadId')
  createFromLead(@Param('leadId') leadId: string) { return this.ordersService.createFromLead(leadId); }
}
