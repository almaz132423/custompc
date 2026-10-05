import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CompatibilityService } from '../pc-build-components/compatibility.service.js';
import { CreateLeadDto } from './dto/create-lead.dto.js';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto.js';
import { UpdateLeadDto } from './dto/update-lead.dto.js';
import { NotificationsService } from '../notifications/notifications.service.js';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);
  constructor(
    private prisma: PrismaService,
    private compatibilityService: CompatibilityService,
    private notificationsService: NotificationsService,
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

    const lead = await this.prisma.$transaction(async (tx) => {
      const normalizedContact = dto.contact.trim();
      const isEmail = normalizedContact.includes('@');
      const customer = await tx.customer.findFirst({
        where: isEmail ? { email: normalizedContact } : { phone: normalizedContact },
      });

      const savedCustomer = customer
        ? await tx.customer.update({
            where: { id: customer.id },
            data: {
              name: dto.name.trim(),
              ...(isEmail ? { email: normalizedContact } : { phone: normalizedContact }),
            },
          })
        : await tx.customer.create({
            data: {
              name: dto.name.trim(),
              phone: isEmail ? undefined : normalizedContact,
              email: isEmail ? normalizedContact : undefined,
            },
          });

      return tx.lead.create({
        data: {
          customerId: savedCustomer.id,
          name: dto.name.trim(),
          contact: normalizedContact,
          budget: dto.budget || undefined,
          purpose: dto.purpose,
          comment: dto.comment,
          category: dto.category,
          pcBuildId,
          configuration: configuration as Prisma.InputJsonValue | undefined,
        },
      });
    });

    void this.notificationsService.notifyNewLead({
      id: lead.id,
      name: lead.name,
      contact: lead.contact,
      status: lead.status,
      budget: lead.budget?.toString(),
      purpose: lead.purpose,
      comment: lead.comment,
    }).catch((error) =>
      this.logger.error(`New lead notification failed: ${error instanceof Error ? error.message : String(error)}`),
    );

    return lead;
  }

  // Пригодится для раздела 37 ТЗ (управление заявками в админке)
  async update(id: string, dto: UpdateLeadDto) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: { customer: true },
    });
    if (!lead) throw new NotFoundException('Заявка не найдена');

    if (dto.agreedPrice === undefined && dto.name === undefined && dto.contact === undefined) {
      throw new BadRequestException('Нет изменений для сохранения');
    }

    const normalizedContact = dto.contact?.trim();
    const isEmail = normalizedContact ? normalizedContact.includes('@') : lead.contact.includes('@');

    const updated = await this.prisma.$transaction(async (tx) => {
      let customerId = lead.customerId;
      if (normalizedContact || dto.name) {
        const customer = customerId
          ? await tx.customer.findUnique({ where: { id: customerId } })
          : null;

        if (customer) {
          await tx.customer.update({
            where: { id: customer.id },
            data: {
              ...(dto.name !== undefined && { name: dto.name.trim() }),
              ...(normalizedContact && (isEmail ? { email: normalizedContact } : { phone: normalizedContact })),
            },
          });
        } else {
          const existing = normalizedContact
            ? await tx.customer.findFirst({
                where: isEmail ? { email: normalizedContact } : { phone: normalizedContact },
              })
            : null;
          const saved = existing ?? await tx.customer.create({
            data: {
              name: dto.name?.trim() ?? lead.name,
              phone: isEmail ? undefined : normalizedContact,
              email: isEmail ? normalizedContact : undefined,
            },
          });
          customerId = saved.id;
        }
      }

      return tx.lead.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name.trim() }),
          ...(normalizedContact && { contact: normalizedContact }),
          ...(dto.agreedPrice !== undefined && {
            agreedPrice: new Prisma.Decimal(dto.agreedPrice),
          }),
          ...(customerId && { customerId }),
        },
        include: {
          customer: true,
          pcBuild: { select: { id: true, name: true, slug: true, price: true } },
          order: { select: { id: true, number: true } },
          statusHistory: { orderBy: { createdAt: 'desc' } },
        },
      });
    });

    return updated;
  }

  async updateStatus(id: string, dto: UpdateLeadStatusDto) {
    const lead = await this.prisma.lead.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!lead) throw new NotFoundException('Заявка не найдена');
    if (lead.status === dto.status && !dto.comment?.trim()) return this.findOne(id);

    this.validateStatusTransition(lead.status, dto.status);

    await this.prisma.$transaction(async (tx) => {
      if (lead.status !== dto.status) {
        await tx.lead.update({ where: { id }, data: { status: dto.status } });
        await tx.leadStatusHistory.create({ data: { leadId: id, fromStatus: lead.status, toStatus: dto.status, comment: dto.comment?.trim() || undefined } });
      } else if (dto.comment?.trim()) {
        await tx.leadStatusHistory.create({ data: { leadId: id, fromStatus: lead.status, toStatus: lead.status, comment: dto.comment.trim() } });
      }
    });
    const updatedLead = await this.findOne(id);
    if (!updatedLead) throw new NotFoundException('Заявка не найдена');
    if (lead.status !== dto.status) {
      void this.notificationsService.notifyLeadStatusChanged({
        lead: {
          id: updatedLead.id,
          name: updatedLead.name,
          contact: updatedLead.contact,
          status: updatedLead.status,
          budget: updatedLead.budget?.toString(),
          purpose: updatedLead.purpose,
          comment: updatedLead.comment,
        },
        fromStatus: lead.status,
        toStatus: dto.status,
        comment: dto.comment,
      }).catch((error) =>
        this.logger.error(`Lead status notification failed: ${error instanceof Error ? error.message : String(error)}`),
      );
    }
    return updatedLead;
  }


  private validateStatusTransition(from: string, to: string) {
    const allowed: Record<string, string[]> = {
      NEW: ['IN_PROGRESS', 'REJECTED'],
      IN_PROGRESS: ['CONTACTED', 'CALCULATED', 'REJECTED'],
      CONTACTED: ['CALCULATED', 'IN_PROGRESS', 'REJECTED'],
      CALCULATED: ['AGREED', 'IN_PROGRESS', 'REJECTED'],
      AGREED: ['ORDER', 'CALCULATED', 'REJECTED'],
      ORDER: [],
      REJECTED: ['IN_PROGRESS', 'NEW'],
    };
    if (from !== to && !allowed[from]?.includes(to)) {
      throw new BadRequestException(`Недопустимый переход статуса: ${from} → ${to}`);
    }
  }

  findOne(id: string) {
    return this.prisma.lead.findUnique({
      where: { id },
      include: { customer: true, pcBuild: { select: { id: true, name: true, slug: true, price: true } }, order: { select: { id: true, number: true } }, statusHistory: { orderBy: { createdAt: 'desc' } } },
    });
  }

  findAll() {
    return this.prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
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
