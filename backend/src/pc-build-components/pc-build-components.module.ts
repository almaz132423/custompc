import { Module } from '@nestjs/common';
import { PcBuildComponentsController } from './pc-build-components.controller.js';
import { PcBuildComponentsService } from './pc-build-components.service.js';
import { CompatibilityService } from './compatibility.service.js';

@Module({
  controllers: [PcBuildComponentsController],
  providers: [PcBuildComponentsService, CompatibilityService],
})
export class PcBuildComponentsModule {}
