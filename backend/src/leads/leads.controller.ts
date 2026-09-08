import { Body, Controller, Get, Post } from '@nestjs/common';
import { LeadsService } from './leads.service.js';
import { CreateLeadDto } from './dto/create-lead.dto.js';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  // POST /leads — форма заявки с сайта (раздел 22 ТЗ)
  @Post()
  create(@Body() dto: CreateLeadDto) {
    return this.leadsService.create(dto);
  }

  // GET /leads — список для будущей админки (раздел 37 ТЗ)
  @Get()
  findAll() {
    return this.leadsService.findAll();
  }
}
