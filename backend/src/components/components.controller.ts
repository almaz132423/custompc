import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ComponentsService, type ComponentListQuery } from './components.service.js';
import { CreateComponentDto } from './dto/create-component.dto.js';
import { UpdateComponentDto } from './dto/update-component.dto.js';

@Controller('components')
@UseGuards(JwtAuthGuard)
export class ComponentsController {
  constructor(private readonly componentsService: ComponentsService) {}

  @Get('categories')
  findCategories() { return this.componentsService.findCategories(); }

  @Get()
  findAll(
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
    @Query('stock') stock?: 'all' | 'in' | 'out',
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('sort') sort?: ComponentListQuery['sort'],
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
  ) {
    return this.componentsService.findAll({
      categoryId,
      search,
      stock,
      minPrice: minPrice !== undefined && minPrice !== '' ? Number(minPrice) : undefined,
      maxPrice: maxPrice !== undefined && maxPrice !== '' ? Number(maxPrice) : undefined,
      sort,
      offset: offset !== undefined ? Number(offset) : undefined,
      limit: limit !== undefined ? Number(limit) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.componentsService.findOne(id); }

  @Post()
  create(@Body() dto: CreateComponentDto) { return this.componentsService.create(dto); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateComponentDto) { return this.componentsService.update(id, dto); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.componentsService.remove(id); }
}