import { Controller, Get, Param, Query } from '@nestjs/common';
import { PcBuildsService, PcBuildCatalogQuery } from './pc-builds.service.js';

@Controller('pc-builds')
export class PcBuildsController {
  constructor(private readonly pcBuildsService: PcBuildsService) {}

  @Get()
  findAll(@Query() query: PcBuildCatalogQuery) {
    const parsed: PcBuildCatalogQuery = {
      minPrice: query.minPrice ? Number(query.minPrice) : undefined,
      maxPrice: query.maxPrice ? Number(query.maxPrice) : undefined,
      minRam: query.minRam ? Number(query.minRam) : undefined,
      minStorage: query.minStorage ? Number(query.minStorage) : undefined,
      purpose: query.purpose,
      gpu: query.gpu,
      cpu: query.cpu,
      resolution: query.resolution,
      sort: query.sort,
    };

    return this.pcBuildsService.findAll(parsed);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.pcBuildsService.findBySlug(slug);
  }
}
