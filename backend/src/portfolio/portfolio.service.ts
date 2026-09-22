import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePortfolioDto } from './dto/create-portfolio.dto.js';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto.js';

@Injectable()
export class PortfolioService {
  constructor(private readonly prisma: PrismaService) {}

  findPublic() {
    return this.prisma.portfolio.findMany({
      where: { isPublished: true },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  findAll() {
    return this.prisma.portfolio.findMany({
      include: { images: { orderBy: { sortOrder: 'asc' } } },
      orderBy: [{ isPublished: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.portfolio.findUnique({
      where: { id },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!item) throw new NotFoundException(`Портфолио "${id}" не найдено`);
    return item;
  }

  async findPublicOne(slug: string) {
    const item = await this.prisma.portfolio.findFirst({
      where: { slug, isPublished: true },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!item) throw new NotFoundException('Работа не найдена');
    return item;
  }

  async create(dto: CreatePortfolioDto) {
    return this.prisma.portfolio.create({
      data: this.toData(dto),
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async update(id: string, dto: UpdatePortfolioDto) {
    await this.findOne(id);
    return this.prisma.portfolio.update({
      where: { id },
      data: this.toData(dto),
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.portfolio.delete({ where: { id } });
    return { ok: true };
  }

  private toData(dto: CreatePortfolioDto | UpdatePortfolioDto): Prisma.PortfolioCreateInput | Prisma.PortfolioUpdateInput {
    const imageUrls = dto.imageUrls;
    return {
      ...(dto.slug !== undefined && { slug: dto.slug.trim() }),
      ...(dto.title !== undefined && { title: dto.title.trim() }),
      ...(dto.clientTask !== undefined && { clientTask: dto.clientTask.trim() || null }),
      ...(dto.budget !== undefined && { budget: dto.budget ? new Prisma.Decimal(dto.budget) : null }),
      ...(dto.components !== undefined && { components: this.parseJson(dto.components) }),
      ...(dto.description !== undefined && { description: dto.description.trim() || null }),
      ...(dto.result !== undefined && { result: dto.result.trim() || null }),
      ...(dto.testing !== undefined && { testing: dto.testing.trim() || null }),
      ...(dto.isPublished !== undefined && { isPublished: dto.isPublished }),
      ...(imageUrls !== undefined && {
        images: {
          deleteMany: {},
          create: imageUrls.filter(Boolean).map((url, index) => ({ url: url.trim(), sortOrder: index })),
        },
      }),
    };
  }

  private parseJson(value: string): Prisma.InputJsonValue | Prisma.JsonNull {
    if (!value.trim()) return Prisma.JsonNull;
    try {
      return JSON.parse(value) as Prisma.InputJsonValue;
    } catch {
      return value;
    }
  }
}