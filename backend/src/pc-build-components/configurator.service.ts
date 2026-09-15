import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CompatibilityService } from './compatibility.service.js';

export type CompatibleComponentResult = {
  components: Awaited<ReturnType<ConfiguratorService['getComponents']>>;
  excluded: { id: string; manufacturer: string; model: string; reasons: string[] }[];
};

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

  async getCompatibleComponents(categoryId: string, selectedIds: string[]): Promise<CompatibleComponentResult> {
    if (!categoryId) throw new BadRequestException('Категория не указана');

    const candidates = await this.getComponents(categoryId);
    const uniqueSelectedIds = [...new Set(selectedIds)];
    const selected = uniqueSelectedIds.length
      ? await this.prisma.component.findMany({
          where: { id: { in: uniqueSelectedIds }, inStock: true },
          include: { category: true },
        })
      : [];

    const excluded: CompatibleComponentResult['excluded'] = [];
    const compatible = [] as Awaited<ReturnType<ConfiguratorService['getComponents']>>;

    for (const candidate of candidates) {
      const selectedWithoutSameCategory = selected.filter((item) => item.categoryId !== candidate.categoryId);
      const issues = await this.compatibility.validateComponents([...selectedWithoutSameCategory, candidate]);
      if (issues.length === 0) {
        compatible.push(candidate);
      } else {
        excluded.push({
          id: candidate.id,
          manufacturer: candidate.manufacturer,
          model: candidate.model,
          reasons: [...new Set(issues.map((issue) => issue.message))],
        });
      }
    }

    return { components: compatible, excluded };
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

    const issues = await this.compatibility.validateComponents(components);

    return { compatible: issues.length === 0, componentIds: uniqueIds, issues };
  }
}
