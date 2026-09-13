import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ComponentsService } from './components.service.js';
import { CreateComponentDto } from './dto/create-component.dto.js';
import { UpdateComponentDto } from './dto/update-component.dto.js';

@Controller('components')
@UseGuards(JwtAuthGuard)
export class ComponentsController {
  constructor(private readonly componentsService: ComponentsService) {}

  @Get('categories')
  findCategories() {
    return this.componentsService.findCategories();
  }

  @Get()
  findAll(@Query('categoryId') categoryId?: string) {
    return this.componentsService.findAll(categoryId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.componentsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateComponentDto) {
    return this.componentsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateComponentDto) {
    return this.componentsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.componentsService.remove(id);
  }
}
