import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ConfiguratorService } from './configurator.service.js';
import { ValidateComponentsDto } from './dto/validate-components.dto.js';

@Controller('configurator')
export class ConfiguratorController {
  constructor(private readonly service: ConfiguratorService) {}

  @Get('categories')
  getCategories() {
    return this.service.getCategories();
  }

  @Get('components')
  getComponents(@Query('categoryId') categoryId?: string) {
    return this.service.getComponents(categoryId);
  }

  @Get('compatible-components')
  getCompatibleComponents(
    @Query('categoryId') categoryId: string,
    @Query('selectedIds') selectedIds = '',
  ) {
    return this.service.getCompatibleComponents(categoryId, selectedIds.split(',').filter(Boolean));
  }

  @Post('validate')
  validate(@Body() dto: ValidateComponentsDto) {
    return this.service.validate(dto.componentIds);
  }
}
