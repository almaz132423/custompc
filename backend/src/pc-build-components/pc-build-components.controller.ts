import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PcBuildComponentsService } from './pc-build-components.service.js';
import { SetPcBuildComponentDto } from './dto/set-pc-build-component.dto.js';

@UseGuards(JwtAuthGuard)
@Controller('pc-build-components')
export class PcBuildComponentsController {
  constructor(private readonly service: PcBuildComponentsService) {}

  @Get('builds')
  findBuilds() {
    return this.service.findBuilds();
  }

  @Get('builds/:buildId')
  findOne(@Param('buildId') buildId: string) {
    return this.service.findOne(buildId);
  }

  @Post('builds/:buildId/components')
  setComponent(@Param('buildId') buildId: string, @Body() dto: SetPcBuildComponentDto) {
    return this.service.setComponent(buildId, dto);
  }

  @Delete('builds/:buildId/components/:componentId')
  removeComponent(@Param('buildId') buildId: string, @Param('componentId') componentId: string) {
    return this.service.removeComponent(buildId, componentId);
  }
}
