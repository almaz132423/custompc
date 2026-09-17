import { Module } from '@nestjs/common';
import { LeadsController } from './leads.controller.js';
import { LeadsService } from './leads.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { PcBuildComponentsModule } from '../pc-build-components/pc-build-components.module.js';

@Module({
  imports: [AuthModule, PcBuildComponentsModule],
  controllers: [LeadsController],
  providers: [LeadsService],
})
export class LeadsModule {}
