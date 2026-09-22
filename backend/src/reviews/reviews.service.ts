import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { UpdateReviewDto } from './dto/update-review.dto.js';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  findPublic() {
    return this.prisma.review.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findAll() {
    return this.prisma.review.findMany({
      orderBy: [{ isPublished: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException(`Отзыв "${id}" не найден`);
    return review;
  }

  create(dto: CreateReviewDto) {
    return this.prisma.review.create({ data: this.toData(dto) });
  }

  async update(id: string, dto: UpdateReviewDto) {
    await this.findOne(id);
    return this.prisma.review.update({ where: { id }, data: this.toData(dto) });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.review.delete({ where: { id } });
    return { ok: true };
  }

  private toData(dto: CreateReviewDto | UpdateReviewDto): Prisma.ReviewUncheckedCreateInput | Prisma.ReviewUncheckedUpdateInput {
    return {
      ...(dto.customerName !== undefined && { customerName: dto.customerName.trim() }),
      ...(dto.text !== undefined && { text: dto.text.trim() }),
      ...(dto.rating !== undefined && { rating: dto.rating }),
      ...(dto.photoUrl !== undefined && { photoUrl: dto.photoUrl.trim() || null }),
      ...(dto.purchasedBuild !== undefined && { purchasedBuild: dto.purchasedBuild.trim() || null }),
      ...(dto.isPublished !== undefined && { isPublished: dto.isPublished }),
    };
  }
}