import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ServiceType } from '@prisma/client';
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

  create(dto: CreateServiceDto) {
    return this.prisma.service.create({ data: this.toData(dto) });
  }

  async update(id: string, dto: UpdateServiceDto) {
    await this.findOne(id);
    return this.prisma.service.update({ where: { id }, data: this.toData(dto) });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.service.delete({ where: { id } });
    return { ok: true };
  }

  private toData(dto: CreateServiceDto | UpdateServiceDto): Prisma.ServiceUncheckedCreateInput | Prisma.ServiceUncheckedUpdateInput {
    return {
      ...(dto.type !== undefined && { type: dto.type }),
      ...(dto.name !== undefined && { name: dto.name.trim() }),
      ...(dto.description !== undefined && { description: dto.description?.trim() || null }),
      ...(dto.priceFrom !== undefined && { priceFrom: dto.priceFrom }),
      ...(dto.priceTo !== undefined && { priceTo: dto.priceTo }),
      ...(dto.durationDays !== undefined && { durationDays: dto.durationDays ? Number(dto.durationDays) : null }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    };
  }
}
