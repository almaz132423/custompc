import { Module } from '@nestjs/common';
import { PcBuildsController } from './pc-builds.controller.js';
import { PcBuildsService } from './pc-builds.service.js';
import { PcBuildsAdminController } from './pc-builds-admin.controller.js';
import { PcBuildsAdminService } from './pc-builds-admin.service.js';

@Module({
  controllers: [PcBuildsController, PcBuildsAdminController],
  providers: [PcBuildsService, PcBuildsAdminService],
})
export class PcBuildsModule {}
