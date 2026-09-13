import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePcBuildDto } from './dto/create-pc-build.dto.js';
import { UpdatePcBuildDto } from './dto/update-pc-build.dto.js';
import { CreatePcBuildImageDto } from './dto/create-pc-build-image.dto.js';

const buildInclude = {
  images: { orderBy: { sortOrder: 'asc' as const } },
  category: true,
  components: {
    include: { component: { include: { category: true } } },
    orderBy: { component: { category: { name: 'asc' as const } } },
  },
} as const;

@Injectable()
export class PcBuildsAdminService {
  constructor(private readonly prisma: PrismaService) {}

  findCategories() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  findAll() {
    return this.prisma.pCBuild.findMany({
      include: buildInclude,
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const build = await this.prisma.pCBuild.findUnique({ where: { id }, include: buildInclude });
    if (!build) throw new NotFoundException(`Сборка "${id}" не найдена`);
    return build;
  }

  async create(dto: CreatePcBuildDto) {
    await this.ensureSlugAvailable(dto.slug);
    if (dto.categoryId) await this.ensureCategory(dto.categoryId);

    return this.prisma.pCBuild.create({
      data: this.toData(dto),
      include: buildInclude,
    });
  }

  async update(id: string, dto: UpdatePcBuildDto) {
    await this.findOne(id);
    if (dto.slug) await this.ensureSlugAvailable(dto.slug, id);
    if (dto.categoryId) await this.ensureCategory(dto.categoryId);

    return this.prisma.pCBuild.update({
      where: { id },
      data: this.toData(dto),
      include: buildInclude,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    const leadCount = await this.prisma.lead.count({ where: { pcBuildId: id } });
    const orderItemCount = await this.prisma.orderItem.count({ where: { pcBuildId: id } });

    if (leadCount || orderItemCount) {
      throw new BadRequestException(
        'Нельзя удалить сборку, пока на неё ссылаются заявки или заказы. Смените статус на HIDDEN.',
      );
    }

    await this.prisma.pCBuild.delete({ where: { id } });
    return { ok: true };
  }

  async addImage(id: string, dto: CreatePcBuildImageDto) {
    await this.findOne(id);
    return this.prisma.pCBuildImage.create({
      data: { pcBuildId: id, url: dto.url, sortOrder: dto.sortOrder ?? 0 },
    });
  }

  async removeImage(id: string, imageId: string) {
    await this.findOne(id);
    const image = await this.prisma.pCBuildImage.findFirst({ where: { id: imageId, pcBuildId: id } });
    if (!image) throw new NotFoundException('Изображение не найдено в этой сборке');
    await this.prisma.pCBuildImage.delete({ where: { id: imageId } });
    return { ok: true };
  }

  private toData(dto: CreatePcBuildDto | UpdatePcBuildDto): Prisma.PCBuildUncheckedCreateInput | Prisma.PCBuildUncheckedUpdateInput {
    return {
      ...(dto.slug !== undefined && { slug: dto.slug }),
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.price !== undefined && { price: dto.price }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.purpose !== undefined && { purpose: dto.purpose }),
      ...(dto.resolution !== undefined && { resolution: dto.resolution }),
      ...(dto.warrantyMonths !== undefined && { warrantyMonths: dto.warrantyMonths }),
      ...(dto.buildTimeDays !== undefined && { buildTimeDays: dto.buildTimeDays }),
      ...(dto.avitoUrl !== undefined && { avitoUrl: dto.avitoUrl }),
      ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
    };
  }

  private async ensureCategory(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new BadRequestException('Категория сборки не найдена');
  }

  private async ensureSlugAvailable(slug: string, exceptId?: string) {
    const existing = await this.prisma.pCBuild.findUnique({ where: { slug }, select: { id: true } });
    if (existing && existing.id !== exceptId) throw new BadRequestException('Такой slug уже используется');
  }
}
