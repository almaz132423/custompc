import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CompatibilityService } from '../pc-build-components/compatibility.service.js';
import { CreateLeadDto } from './dto/create-lead.dto.js';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto.js';

@Injectable()
export class LeadsService {
  constructor(
    private prisma: PrismaService,
    private compatibilityService: CompatibilityService,
  ) {}

  async create(dto: CreateLeadDto) {
    let pcBuildId: string | undefined;
    let configuration = dto.configuration;

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

    if (configuration?.type === 'CUSTOM_CONFIG') {
      if (!this.isCustomConfiguration(configuration)) {
        throw new BadRequestException('Некорректная конфигурация конфигуратора');
      }

      const validatedConfiguration = await this.compatibilityService.validateCustomConfiguration(configuration.componentIds);
      configuration = {
        ...configuration,
        ...validatedConfiguration,
      };
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
        configuration: configuration as Prisma.InputJsonValue | undefined,
      },
    });
  }

  // Пригодится для раздела 37 ТЗ (управление заявками в админке)
  async updateStatus(id: string, dto: UpdateLeadStatusDto) {
    const lead = await this.prisma.lead.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!lead) throw new NotFoundException('Заявка не найдена');
    if (lead.status === dto.status && !dto.comment?.trim()) return this.findOne(id);

    await this.prisma.$transaction(async (tx) => {
      if (lead.status !== dto.status) {
        await tx.lead.update({ where: { id }, data: { status: dto.status } });
        await tx.leadStatusHistory.create({ data: { leadId: id, fromStatus: lead.status, toStatus: dto.status, comment: dto.comment?.trim() || undefined } });
      } else if (dto.comment?.trim()) {
        await tx.leadStatusHistory.create({ data: { leadId: id, fromStatus: lead.status, toStatus: lead.status, comment: dto.comment.trim() } });
      }
    });
    return this.findOne(id);
  }

  findOne(id: string) {
    return this.prisma.lead.findUnique({
      where: { id },
      include: { pcBuild: { select: { id: true, name: true, slug: true, price: true } }, order: { select: { id: true, number: true } }, statusHistory: { orderBy: { createdAt: 'desc' } } },
    });
  }

  findAll() {
    return this.prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        order: { select: { id: true, number: true } },
        pcBuild: {
          select: { id: true, name: true, slug: true, price: true },
        },
      },
    });
  }

  private isCustomConfiguration(value: Record<string, unknown>): value is Record<string, unknown> & { type: 'CUSTOM_CONFIG'; componentIds: string[] } {
    return Array.isArray(value.componentIds) && value.componentIds.length > 0 && value.componentIds.every((id) => typeof id === 'string');
  }
}
