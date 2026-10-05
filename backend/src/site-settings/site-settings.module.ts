import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AdminSiteSettingsController, SiteSettingsController } from './site-settings.controller.js';
import { SiteSettingsService } from './site-settings.service.js';

@Module({
  imports: [AuthModule],
  controllers: [SiteSettingsController, AdminSiteSettingsController],
  providers: [SiteSettingsService],
  exports: [SiteSettingsService],
})
export class SiteSettingsModule {}
