import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PcBuildComponentsController } from './pc-build-components.controller.js';
import { PcBuildComponentsService } from './pc-build-components.service.js';
import { CompatibilityService } from './compatibility.service.js';
import { ConfiguratorController } from './configurator.controller.js';
import { ConfiguratorService } from './configurator.service.js';

@Module({
  imports: [AuthModule],
  controllers: [PcBuildComponentsController, ConfiguratorController],
  providers: [PcBuildComponentsService, CompatibilityService, ConfiguratorService],
  exports: [CompatibilityService],
})
export class PcBuildComponentsModule {}
