import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CompatibilityService } from './compatibility.service.js';

export type ConfiguratorComponentsQuery = {
  search?: string;
  offset?: number;
  limit?: number;
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

  async getComponents(categoryId?: string, query: ConfiguratorComponentsQuery = {}) {
    const limit = Math.min(Math.max(query.limit ?? 40, 1), 80);
    const offset = Math.max(query.offset ?? 0, 0);
    const search = query.search?.trim();
    const where = {
      inStock: true,
      ...(categoryId ? { categoryId } : {}),
      ...(search ? {
        OR: [
          { manufacturer: { contains: search, mode: 'insensitive' as const } },
          { model: { contains: search, mode: 'insensitive' as const } },
        ],
      } : {}),
    };

    const [components, total] = await Promise.all([
      this.prisma.component.findMany({
        where,
        include: { category: true },
        orderBy: [{ manufacturer: 'asc' }, { model: 'asc' }, { id: 'asc' }],
        skip: offset,
        take: limit,
      }),
      this.prisma.component.count({ where }),
    ]);

    return { components, total, offset, limit, hasMore: offset + components.length < total, nextOffset: offset + components.length < total ? offset + components.length : null };
  }

  async getCompatibleComponents(categoryId: string, selectedIds: string[], query: ConfiguratorComponentsQuery = {}) {
    if (!categoryId) throw new BadRequestException('Категория не указана');

    const limit = Math.min(Math.max(query.limit ?? 40, 1), 80);
    const offset = Math.max(query.offset ?? 0, 0);
    const search = query.search?.trim();
    const where = {
      inStock: true,
      categoryId,
      ...(search ? {
        OR: [
          { manufacturer: { contains: search, mode: 'insensitive' as const } },
          { model: { contains: search, mode: 'insensitive' as const } },
        ],
      } : {}),
    };

    const total = await this.prisma.component.count({ where });
    const uniqueSelectedIds = [...new Set(selectedIds)];
    const selected = uniqueSelectedIds.length
      ? await this.prisma.component.findMany({ where: { id: { in: uniqueSelectedIds }, inStock: true }, include: { category: true } })
      : [];
    const activeRules = await this.compatibility.getActiveRules();

    const compatible: typeof selected = [];
    const excluded: { id: string; manufacturer: string; model: string; reasons: string[] }[] = [];
    let scannedOffset = offset;
    let exhausted = false;
    let excludedCount = 0;

    while (compatible.length < limit && !exhausted) {
      const candidates = await this.prisma.component.findMany({
        where,
        include: { category: true },
        orderBy: [{ manufacturer: 'asc' }, { model: 'asc' }, { id: 'asc' }],
        skip: scannedOffset,
        take: Math.max(limit * 2, 40),
      });

      if (candidates.length === 0) {
        exhausted = true;
        break;
      }

      for (const candidate of candidates) {
        const selectedWithoutSameCategory = selected.filter((item) => item.categoryId !== candidate.categoryId);
        const issues = await this.compatibility.validateComponents([...selectedWithoutSameCategory, candidate], activeRules);
        if (issues.length === 0) {
          compatible.push(candidate);
          if (compatible.length >= limit) {
            scannedOffset += candidates.indexOf(candidate) + 1;
            break;
          }
        } else {
          excludedCount += 1;
          if (excluded.length < 50) {
            excluded.push({
              id: candidate.id,
              manufacturer: candidate.manufacturer,
              model: candidate.model,
              reasons: [...new Set(issues.map((issue) => issue.message))],
            });
          }
        }
        scannedOffset += 1;
      }

      if (candidates.length < Math.max(limit * 2, 40) || scannedOffset >= offset + total) {
        exhausted = true;
      }
    }

    const hasMore = !exhausted;
    return {
      components: compatible,
      excluded,
      excludedCount,
      total,
      offset,
      limit,
      hasMore,
      nextOffset: hasMore ? scannedOffset : null,
    };
  }

  async validate(componentIds: string[]) {
    const uniqueIds = [...new Set(componentIds)];
    const components = await this.prisma.component.findMany({ where: { id: { in: uniqueIds }, inStock: true }, include: { category: true } });
    if (components.length !== uniqueIds.length) throw new BadRequestException('Одно или несколько выбранных комплектующих недоступны');
    const issues = await this.compatibility.validateComponents(components);
    return { compatible: issues.length === 0, componentIds: uniqueIds, issues };
  }
}