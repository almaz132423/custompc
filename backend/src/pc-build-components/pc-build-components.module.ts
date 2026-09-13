import { Module } from '@nestjs/common';
import { PcBuildComponentsController } from './pc-build-components.controller.js';
import { PcBuildComponentsService } from './pc-build-components.service.js';

@Module({
  controllers: [PcBuildComponentsController],
  providers: [PcBuildComponentsService],
})
export class PcBuildComponentsModule {}
