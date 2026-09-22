import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { SiteSettingsService } from './site-settings.service.js';

@Controller('site-settings')
export class SiteSettingsController {
  constructor(private readonly service: SiteSettingsService) {}

  @Get()
  findPublic() {
    return this.service.findPublic();
  }
}

@Controller('admin/site-settings')
@UseGuards(JwtAuthGuard)
export class AdminSiteSettingsController {
  constructor(private readonly service: SiteSettingsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Patch(':key')
  update(@Param('key') key: string, @Body() body: { value?: string }) {
    return this.service.update(key, body.value ?? '');
  }
}
