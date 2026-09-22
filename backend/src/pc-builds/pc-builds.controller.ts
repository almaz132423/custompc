import { Controller, Get, Param, Query } from '@nestjs/common';
import { PcBuildsService, PcBuildCatalogQuery } from './pc-builds.service.js';

@Controller('pc-builds')
export class PcBuildsController {
  constructor(private readonly pcBuildsService: PcBuildsService) {}

  @Get()
  findAll(@Query() query: Record<string, string | undefined>) {
    const numberParam = (value: string | undefined) => {
      if (!value) return undefined;
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
    };

    const sort = query.sort === 'price-asc' || query.sort === 'price-desc' || query.sort === 'newest'
      ? query.sort
      : undefined;

    const parsed: PcBuildCatalogQuery = {
      minPrice: numberParam(query.minPrice),
      maxPrice: numberParam(query.maxPrice),
      minRam: numberParam(query.minRam),
      minStorage: numberParam(query.minStorage),
      purpose: query.purpose,
      gpu: query.gpu,
      cpu: query.cpu,
      resolution: query.resolution,
      sort,
    };

    return this.pcBuildsService.findAll(parsed);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.pcBuildsService.findBySlug(slug);
  }
}
