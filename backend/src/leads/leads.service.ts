import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateLeadDto } from './dto/create-lead.dto.js';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateLeadDto) {
    return this.prisma.lead.create({
      data: {
        name: dto.name,
        contact: dto.contact,
        budget: dto.budget || undefined,
        purpose: dto.purpose,
        comment: dto.comment,
      },
    });
  }

  // Пригодится для раздела 37 ТЗ (управление заявками в админке)
  findAll() {
    return this.prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}
