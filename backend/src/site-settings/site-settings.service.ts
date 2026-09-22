import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export const SITE_SETTING_KEYS = [
  'phone',
  'telegram_url',
  'avito_url',
  'email',
  'address',
  'work_hours',
] as const;

export type SiteSettingKey = (typeof SITE_SETTING_KEYS)[number];

@Injectable()
export class SiteSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.siteSettings.findMany({ orderBy: { key: 'asc' } });
  }

  async findPublic() {
    const settings = await this.prisma.siteSettings.findMany({
      where: { key: { in: [...SITE_SETTING_KEYS] } },
      orderBy: { key: 'asc' },
    });

    return Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
  }

  async update(key: string, value: string) {
    if (!SITE_SETTING_KEYS.includes(key as SiteSettingKey)) {
      throw new BadRequestException('Неизвестный ключ настройки сайта');
    }

    const normalized = value.trim();
    if (normalized.length > 2000) {
      throw new BadRequestException('Значение настройки слишком длинное');
    }

    return this.prisma.siteSettings.upsert({
      where: { key },
      update: { value: normalized },
      create: { key, value: normalized },
    });
  }
}
