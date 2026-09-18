import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ConfiguratorService, type ConfiguratorComponentsQuery } from './configurator.service.js';
import { ValidateComponentsDto } from './dto/validate-components.dto.js';

@Controller('configurator')
export class ConfiguratorController {
  constructor(private readonly service: ConfiguratorService) {}

  @Get('categories')
  getCategories() { return this.service.getCategories(); }

  @Get('components')
  getComponents(
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getComponents(categoryId, {
      search,
      offset: offset !== undefined ? Number(offset) : undefined,
      limit: limit !== undefined ? Number(limit) : undefined,
    });
  }

  @Get('compatible-components')
  getCompatibleComponents(
    @Query('categoryId') categoryId: string,
    @Query('selectedIds') selectedIds = '',
    @Query('search') search?: string,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getCompatibleComponents(categoryId, selectedIds.split(',').filter(Boolean), {
      search,
      offset: offset !== undefined ? Number(offset) : undefined,
      limit: limit !== undefined ? Number(limit) : undefined,
    });
  }

  @Post('validate')
  validate(@Body() dto: ValidateComponentsDto) { return this.service.validate(dto.componentIds); }
}