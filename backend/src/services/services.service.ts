import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateServiceDto } from './dto/create-service.dto.js';
import { UpdateServiceDto } from './dto/update-service.dto.js';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  findPublic() {
    return this.prisma.service.findMany({
      where: { isActive: true },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
  }

  findAll() {
    return this.prisma.service.findMany({
      orderBy: [{ isActive: 'desc' }, { type: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) throw new NotFoundException(`Услуга "${id}" не найдена`);
    return service;
  }

  async findTypes(): Promise<string[]> {
    const services = await this.prisma.service.findMany({
      select: { type: true },
      distinct: ['type'],
      orderBy: { type: 'asc' },
    });

    return services
      .map((service) => service.type?.trim())
      .filter((type): type is string => Boolean(type));
  }

  create(dto: CreateServiceDto) {
    this.validatePriceRange(dto.priceFrom, dto.priceTo);
    return this.prisma.service.create({ data: this.toCreateData(dto) });
  }

  async update(id: string, dto: UpdateServiceDto) {
    const current = await this.findOne(id);
    this.validatePriceRange(
      dto.priceFrom ?? current.priceFrom?.toString(),
      dto.priceTo ?? current.priceTo?.toString(),
    );
    return this.prisma.service.update({ where: { id }, data: this.toUpdateData(dto) });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.service.delete({ where: { id } });
    return { ok: true };
  }

  private validatePriceRange(priceFrom?: string, priceTo?: string) {
    if (priceFrom === undefined || priceFrom === '' || priceTo === undefined || priceTo === '') return;
    if (new Prisma.Decimal(priceFrom).greaterThan(new Prisma.Decimal(priceTo))) {
      throw new BadRequestException('Цена «от» не может быть больше цены «до»');
    }
  }

  private toCreateData(dto: CreateServiceDto): Prisma.ServiceUncheckedCreateInput {
    return {
      type: dto.type.trim(),
      name: dto.name.trim(),
      ...(dto.description !== undefined && { description: dto.description.trim() || null }),
      ...(dto.priceFrom !== undefined && { priceFrom: dto.priceFrom }),
      ...(dto.priceTo !== undefined && { priceTo: dto.priceTo }),
      ...(dto.durationDays !== undefined && { durationDays: dto.durationDays ? Number(dto.durationDays) : null }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    };
  }

  private toUpdateData(dto: UpdateServiceDto): Prisma.ServiceUncheckedUpdateInput {
    return {
      ...(dto.type !== undefined && { type: dto.type.trim() }),
      ...(dto.name !== undefined && { name: dto.name.trim() }),
      ...(dto.description !== undefined && { description: dto.description.trim() || null }),
      ...(dto.priceFrom !== undefined && { priceFrom: dto.priceFrom }),
      ...(dto.priceTo !== undefined && { priceTo: dto.priceTo }),
      ...(dto.durationDays !== undefined && { durationDays: dto.durationDays ? Number(dto.durationDays) : null }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    };
  }
}
