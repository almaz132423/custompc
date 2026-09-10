import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { LeadsService } from './leads.service.js';
import { CreateLeadDto } from './dto/create-lead.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  // POST /leads — форма заявки с сайта, открыта всем (раздел 22 ТЗ)
  @Post()
  create(@Body() dto: CreateLeadDto) {
    return this.leadsService.create(dto);
  }

  // GET /leads — только для авторизованных сотрудников (раздел 37 ТЗ)
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.leadsService.findAll();
  }
}
