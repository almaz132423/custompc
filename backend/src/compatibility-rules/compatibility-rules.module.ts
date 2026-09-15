import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CompatibilityRulesController } from './compatibility-rules.controller.js';
import { CompatibilityRulesService } from './compatibility-rules.service.js';

@Module({
  imports: [AuthModule],
  controllers: [CompatibilityRulesController],
  providers: [CompatibilityRulesService],
})
export class CompatibilityRulesModule {}
