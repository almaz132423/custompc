import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCompatibilityRuleDto } from './dto/create-compatibility-rule.dto.js';
import { UpdateCompatibilityRuleDto } from './dto/update-compatibility-rule.dto.js';

type RuleRecord = Record<string, unknown>;

@Injectable()
export class CompatibilityRulesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.compatibilityRule.findMany({ orderBy: [{ isActive: 'desc' }, { name: 'asc' }] });
  }

  async findOne(id: string) {
    const rule = await this.prisma.compatibilityRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Правило совместимости не найдено');
    return rule;
  }

  async create(dto: CreateCompatibilityRuleDto) {
    const rule = this.normalizeRule(dto.rule);
    return this.prisma.compatibilityRule.create({
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        rule: rule as Prisma.InputJsonValue,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateCompatibilityRuleDto) {
    await this.findOne(id);
    const data: Prisma.CompatibilityRuleUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.description !== undefined) data.description = dto.description?.trim() || null;
    if (dto.rule !== undefined) data.rule = this.normalizeRule(dto.rule) as Prisma.InputJsonValue;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    return this.prisma.compatibilityRule.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.compatibilityRule.delete({ where: { id } });
    return { ok: true };
  }

  private normalizeRule(value: RuleRecord) {
    const condition = this.asRecord(value.if);
    const requires = this.asRecord(value.requires);
    if (!condition || !requires) {
      throw new BadRequestException('Правило должно содержать объекты if и requires');
    }
    if (typeof condition.category !== 'string' || typeof requires.category !== 'string') {
      throw new BadRequestException('В if и requires необходимо указать category');
    }
    return { if: condition, requires };
  }

  private asRecord(value: unknown): RuleRecord | null {
    return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as RuleRecord : null;
  }
}
