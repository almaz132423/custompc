import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class PcBuildsService {
  constructor(private prisma: PrismaService) {}

  // Список готовых сборок для каталога /pc (раздел 16 ТЗ)
  findAll() {
    return this.prisma.pCBuild.findMany({
      where: { status: 'AVAILABLE' },
      include: { images: true, category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Карточка одной сборки по slug (раздел 17 ТЗ)
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
