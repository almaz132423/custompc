import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateComponentDto } from './dto/create-component.dto.js';
import { UpdateComponentDto } from './dto/update-component.dto.js';

@Injectable()
export class ComponentsService {
  constructor(private readonly prisma: PrismaService) {}

  findCategories() {
    return this.prisma.componentCategory.findMany({
      orderBy: { name: 'asc' },
    });
  }

  findAll(categoryId?: string) {
    return this.prisma.component.findMany({
      where: categoryId ? { categoryId } : undefined,
      include: { category: true },
      orderBy: [{ category: { name: 'asc' } }, { manufacturer: 'asc' }, { model: 'asc' }],
    });
  }

  async findOne(id: string) {
    const component = await this.prisma.component.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!component) {
      throw new NotFoundException(`Комплектующее "${id}" не найдено`);
    }

    return component;
  }

  async create(dto: CreateComponentDto) {
    await this.ensureCategory(dto.categoryId);

    return this.prisma.component.create({
      data: this.toCreateData(dto),
      include: { category: true },
    });
  }

  async update(id: string, dto: UpdateComponentDto) {
    await this.findOne(id);

    if (dto.categoryId) {
      await this.ensureCategory(dto.categoryId);
    }

    return this.prisma.component.update({
      where: { id },
      data: this.toUpdateData(dto),
      include: { category: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    const links = await this.prisma.pCBuildComponent.count({
      where: { componentId: id },
    });

    if (links > 0) {
      throw new BadRequestException(
        'Нельзя удалить комплектующее, пока оно используется в готовых сборках',
      );
    }

    await this.prisma.component.delete({ where: { id } });
    return { ok: true };
  }

  private async ensureCategory(categoryId: string) {
    const category = await this.prisma.componentCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new BadRequestException('Категория комплектующего не найдена');
    }
  }

  private toCreateData(dto: CreateComponentDto): Prisma.ComponentUncheckedCreateInput {
    return {
      categoryId: dto.categoryId,
      manufacturer: dto.manufacturer,
      model: dto.model,
      price: dto.price,
      ...(dto.specs !== undefined && { specs: dto.specs as Prisma.InputJsonValue }),
      ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
      ...(dto.inStock !== undefined && { inStock: dto.inStock }),
      ...(dto.compatibility !== undefined && {
        compatibility: dto.compatibility as Prisma.InputJsonValue,
      }),
    };
  }

  private toUpdateData(dto: UpdateComponentDto): Prisma.ComponentUncheckedUpdateInput {
    return {
      ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
      ...(dto.manufacturer !== undefined && { manufacturer: dto.manufacturer }),
      ...(dto.model !== undefined && { model: dto.model }),
      ...(dto.price !== undefined && { price: dto.price }),
      ...(dto.specs !== undefined && { specs: dto.specs as Prisma.InputJsonValue }),
      ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
      ...(dto.inStock !== undefined && { inStock: dto.inStock }),
      ...(dto.compatibility !== undefined && {
        compatibility: dto.compatibility as Prisma.InputJsonValue,
      }),
    };
  }
}
