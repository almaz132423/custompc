import { Controller, Get, Query } from '@nestjs/common';
import { ConfiguratorService } from './configurator.service.js';
import { RecommendQueryDto } from './dto/recommend-query.dto.js';

@Controller('configurator')
export class ConfiguratorController {
  constructor(private readonly configuratorService: ConfiguratorService) {}

  // GET /configurator/recommend?purpose=GAMES&budget=150000&resolution=R1440P
  @Get('recommend')
  recommend(@Query() query: RecommendQueryDto) {
    return this.configuratorService.recommend(query);
  }
}
