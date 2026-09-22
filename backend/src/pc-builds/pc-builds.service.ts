import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export type PcBuildCatalogQuery = {
  minPrice?: number;
  maxPrice?: number;
  purpose?: string;
  gpu?: string;
  cpu?: string;
  minRam?: number;
  minStorage?: number;
  resolution?: string;
  sort?: 'price-asc' | 'price-desc' | 'newest';
};

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {};
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(',', '.').replace(/[^0-9.]+/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function componentSpecNumber(specs: unknown, keys: string[]): number | null {
  const record = asRecord(specs);
  for (const key of keys) {
    const value = asNumber(record[key]);
    if (value !== null) return value;
  }
  return null;
}

function getRamGb(component: { specs: unknown; quantity: number }) {
  const size = componentSpecNumber(component.specs, ['size', 'capacity', 'memory']);
  if (size === null) return null;

  const modules = componentSpecNumber(component.specs, ['modules']);
  // pc-part-dataset memory.size is per module; multiply by module count when available.
  return size * (modules && modules > 0 ? modules : 1) * component.quantity;
}

function getStorageGb(component: { specs: unknown; quantity: number }) {
  const capacity = componentSpecNumber(component.specs, ['capacity', 'size']);
  if (capacity === null) return null;
  // Dataset storage capacity is normally in GB. If it is expressed in TB, convert it.
  const unit = String(asRecord(component.specs).capacity_unit ?? asRecord(component.specs).unit ?? '').toLowerCase();
  const gb = unit === 'tb' ? capacity * 1024 : capacity;
  return gb * component.quantity;
}

@Injectable()
export class PcBuildsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PcBuildCatalogQuery = {}) {
    const builds = await this.prisma.pCBuild.findMany({
      where: {
        status: 'AVAILABLE',
        ...(query.minPrice !== undefined || query.maxPrice !== undefined ? {
          price: {
            ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
            ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
          },
        } : {}),
        ...(query.purpose ? { purpose: query.purpose as never } : {}),
        ...(query.resolution ? { resolution: query.resolution as never } : {}),
      },
      include: {
        images: true,
        category: true,
        components: {
          include: {
            component: {
              include: { category: true },
            },
          },
        },
      },
      orderBy:
        query.sort === 'price-asc' ? [{ price: 'asc' }, { createdAt: 'desc' }] :
        query.sort === 'price-desc' ? [{ price: 'desc' }, { createdAt: 'desc' }] :
        [{ createdAt: 'desc' }],
    });

    const cpuQuery = query.cpu?.trim().toLowerCase();
    const gpuQuery = query.gpu?.trim().toLowerCase();

    return builds
      .filter((build) => {
        const cpuComponents = build.components.filter(({ component }) => component.category.code === 'CPU');
        const gpuComponents = build.components.filter(({ component }) => component.category.code === 'GPU');
        const ramComponents = build.components.filter(({ component }) => component.category.code === 'RAM');
        const storageComponents = build.components.filter(({ component }) =>
          component.category.code === 'SSD' || component.category.code === 'HDD',
        );

        if (cpuQuery && !cpuComponents.some(({ component }) =>
          `${component.manufacturer} ${component.model}`.toLowerCase().includes(cpuQuery),
        )) return false;

        if (gpuQuery && !gpuComponents.some(({ component }) =>
          `${component.manufacturer} ${component.model}`.toLowerCase().includes(gpuQuery),
        )) return false;

        if (query.minRam !== undefined) {
          const ramGb = ramComponents.reduce((total, item) => total + (getRamGb(item) ?? 0), 0);
          if (ramGb < query.minRam) return false;
        }

        if (query.minStorage !== undefined) {
          const storageGb = storageComponents.reduce((total, item) => total + (getStorageGb(item) ?? 0), 0);
          if (storageGb < query.minStorage) return false;
        }

        return true;
      })
      .map(({ components: _components, ...build }) => build);
  }

  async findBySlug(slug: string) {
    const build = await this.prisma.pCBuild.findUnique({
      where: { slug },
      include: {
        images: true,
        category: true,
        components: {
          include: {
            component: {
              include: { category: true },
            },
          },
        },
      },
    });

    if (!build) {
      throw new NotFoundException(`Сборка "${slug}" не найдена`);
    }

    return build;
  }
}
