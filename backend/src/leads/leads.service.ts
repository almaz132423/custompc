import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateLeadDto } from './dto/create-lead.dto.js';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateLeadDto) {
    let pcBuildId: string | undefined;

    if (dto.pcBuildId) {
      const build = await this.prisma.pCBuild.findUnique({
        where: { id: dto.pcBuildId },
        select: { id: true, status: true },
      });

      if (!build || build.status !== 'AVAILABLE') {
        throw new BadRequestException('Выбранная сборка ПК недоступна');
      }

      pcBuildId = build.id;
    }

    return this.prisma.lead.create({
      data: {
        name: dto.name,
        contact: dto.contact,
        budget: dto.budget || undefined,
        purpose: dto.purpose,
        comment: dto.comment,
        category: dto.category,
        pcBuildId,
        configuration: dto.configuration as Prisma.InputJsonValue | undefined,
      },
    });
  }

  // Пригодится для раздела 37 ТЗ (управление заявками в админке)
  findAll() {
    return this.prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        pcBuild: {
          select: { id: true, name: true, slug: true, price: true },
        },
      },
    });
  }
}