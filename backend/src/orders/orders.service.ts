import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async createFromLead(leadId: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: { pcBuild: true, order: true },
    });
    if (!lead) throw new NotFoundException('Заявка не найдена');
    if (lead.status !== 'AGREED') throw new BadRequestException('Заказ можно создать только из согласованной заявки');
    if (lead.order) throw new BadRequestException('Для этой заявки заказ уже создан');

    const configuration = this.readConfiguration(lead.configuration);
    const totalPrice = lead.pcBuild ? Number(lead.pcBuild.price) : Number(configuration?.total ?? 0);
    if (!Number.isFinite(totalPrice) || totalPrice <= 0) throw new BadRequestException('Не удалось определить стоимость заказа');

    const items = lead.pcBuild
      ? [{ name: lead.pcBuild.name, price: Number(lead.pcBuild.price), quantity: 1, pcBuildId: lead.pcBuild.id }]
      : (configuration?.components ?? []).map((component) => ({
          name: `${component.manufacturer} ${component.model}`,
          price: Number(component.price),
          quantity: 1,
        }));

    if (!items.length || items.some((item) => !Number.isFinite(item.price) || item.price < 0)) {
      throw new BadRequestException('В заявке отсутствует корректный состав заказа');
    }

    const number = `ORD-${Date.now().toString(36).toUpperCase()}`;
    return this.prisma.$transaction(async (tx) => {
      const customer = lead.customerId
        ? await tx.customer.findUnique({ where: { id: lead.customerId } })
        : await tx.customer.create({ data: { name: lead.name, phone: lead.contact } });

      if (!customer) throw new BadRequestException('Клиент заявки не найден');

      const order = await tx.order.create({
        data: {
          number,
          leadId: lead.id,
          customerId: customer.id,
          totalPrice: new Prisma.Decimal(totalPrice),
          comment: lead.comment ?? undefined,
          items: { create: items.map((item) => ({ name: item.name, price: new Prisma.Decimal(item.price), quantity: item.quantity, pcBuildId: item.pcBuildId })) },
        },
        include: { customer: true, lead: true, items: true },
      });
      await tx.lead.update({ where: { id: lead.id }, data: { status: 'ORDER' } });
      return order;
    });
  }

  findAll() {
    return this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: { customer: true, lead: { select: { id: true, name: true, contact: true, status: true } }, items: true },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { customer: true, lead: true, items: true, payments: { orderBy: { paidAt: 'desc' } } },
    });
    if (!order) throw new NotFoundException('Заказ не найден');
    return order;
  }

  private readConfiguration(value: Prisma.JsonValue | null) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const record = value as Record<string, unknown>;
    const components = Array.isArray(record.components) ? record.components : [];
    const normalized = components.flatMap((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
      const c = item as Record<string, unknown>;
      if (typeof c.manufacturer !== 'string' || typeof c.model !== 'string' || typeof c.price !== 'string') return [];
      const price = Number(c.price);
      return Number.isFinite(price) ? [{ manufacturer: c.manufacturer, model: c.model, price }] : [];
    });
    const total = typeof record.total === 'string' ? Number(record.total) : Number(record.total);
    return { total, components: normalized };
  }
}
