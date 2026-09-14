import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CompatibilityService } from './compatibility.service.js';

@Injectable()
export class ConfiguratorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly compatibility: CompatibilityService,
  ) {}

  async getCategories() {
    return this.prisma.componentCategory.findMany({ orderBy: { name: 'asc' } });
  }

  async getComponents(categoryId?: string) {
    return this.prisma.component.findMany({
      where: { inStock: true, ...(categoryId ? { categoryId } : {}) },
      include: { category: true },
      orderBy: [{ category: { name: 'asc' } }, { price: 'asc' }],
    });
  }

  async validate(componentIds: string[]) {
    const uniqueIds = [...new Set(componentIds)];
    const components = await this.prisma.component.findMany({
      where: { id: { in: uniqueIds }, inStock: true },
      include: { category: true },
    });

    if (components.length !== uniqueIds.length) {
      throw new BadRequestException('Одно или несколько выбранных комплектующих недоступны');
    }

    const issues = await this.compatibility.validateComponents(
      components.map((component) => ({ id: component.id, ...component })),
    );

    return { compatible: issues.length === 0, componentIds: uniqueIds, issues };
  }
}
