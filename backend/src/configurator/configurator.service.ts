import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RecommendQueryDto } from './dto/recommend-query.dto.js';

// ВАЖНО — упрощение для MVP:
// Раздел 20 ТЗ описывает подбор из отдельных компонентов с проверкой
// совместимости (раздел 21). Для этого нужна база реальных комплектующих
// с ценами, которой пока нет. Поэтому на этом этапе конфигуратор подбирает
// ближайшую по параметрам ГОТОВУЮ сборку из каталога (PCBuild), а не
// собирает конфигурацию из отдельных деталей. Полноценный движок на
// CompatibilityRule/ConfiguratorRule — задача Этапа 2 (раздел 56 ТЗ),
// когда будет наполнен каталог компонентов.
@Injectable()
export class ConfiguratorService {
  constructor(private prisma: PrismaService) {}

  async recommend(query: RecommendQueryDto) {
    const budget = query.budget ? Number(query.budget) : undefined;

    const candidates = await this.prisma.pCBuild.findMany({
      where: {
        status: 'AVAILABLE',
        ...(query.purpose ? { purpose: query.purpose } : {}),
      },
      include: { images: true, category: true },
    });

    if (candidates.length === 0) {
      return null;
    }

    const scored = candidates.map((build) => {
      let score = 0;

      if (budget) {
        const price = Number(build.price);
        score += Math.abs(price - budget);
        if (price > budget * 1.15) {
          // сильный штраф за превышение бюджета больше чем на 15%
          score += 1_000_000;
        }
      }

      if (query.resolution && build.resolution !== query.resolution) {
        score += 50_000;
      }

      return { build, score };
    });

    scored.sort((a, b) => a.score - b.score);

    return scored[0].build;
  }
}
