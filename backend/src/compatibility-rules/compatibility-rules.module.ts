import { Module } from '@nestjs/common';
import { CompatibilityRulesController } from './compatibility-rules.controller.js';
import { CompatibilityRulesService } from './compatibility-rules.service.js';

@Module({
  controllers: [CompatibilityRulesController],
  providers: [CompatibilityRulesService],
})
export class CompatibilityRulesModule {}
