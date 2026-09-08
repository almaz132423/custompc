import { Controller, Get, Param } from '@nestjs/common';
import { PcBuildsService } from './pc-builds.service.js';

@Controller('pc-builds')
export class PcBuildsController {
  constructor(private readonly pcBuildsService: PcBuildsService) {}

  // GET /pc-builds — список готовых сборок
  @Get()
  findAll() {
    return this.pcBuildsService.findAll();
  }

  // GET /pc-builds/:slug — карточка одной сборки
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.pcBuildsService.findBySlug(slug);
  }
}
