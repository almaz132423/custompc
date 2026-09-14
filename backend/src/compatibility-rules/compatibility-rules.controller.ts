import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CompatibilityRulesService } from './compatibility-rules.service.js';
import { CreateCompatibilityRuleDto } from './dto/create-compatibility-rule.dto.js';
import { UpdateCompatibilityRuleDto } from './dto/update-compatibility-rule.dto.js';

@Controller('admin/compatibility-rules')
@UseGuards(JwtAuthGuard)
export class CompatibilityRulesController {
  constructor(private readonly service: CompatibilityRulesService) {}
  @Get() findAll() { return this.service.findAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Post() create(@Body() dto: CreateCompatibilityRuleDto) { return this.service.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateCompatibilityRuleDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
