import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatusStage, PaymentStatus, Prisma } from '@prisma/client';
import { UpdateOrderDto } from './dto/update-order.dto.js';
import { AddPaymentDto } from './dto/add-payment.dto.js';
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

  async update(id: string, dto: UpdateOrderDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Заказ не найден');
    if (!dto.status && !dto.paymentStatus && !dto.comment?.trim()) throw new BadRequestException('Нет изменений для сохранения');

    return this.prisma.$transaction(async (tx) => {
      const data: Prisma.OrderUpdateInput = {};
      if (dto.status) data.status = dto.status;
      if (dto.paymentStatus) data.paymentStatus = dto.paymentStatus;
      if (dto.comment?.trim()) data.comment = dto.comment.trim();
      const updated = await tx.order.update({ where: { id }, data, include: { customer: true, lead: true, items: true, statusHistory: { orderBy: { createdAt: 'desc' } }, payments: { orderBy: { paidAt: 'desc' } }, statusHistory: { orderBy: { createdAt: 'desc' } } } });
      if (dto.status && dto.status !== order.status) await tx.orderStatusHistory.create({ data: { orderId: id, fromStatus: order.status, toStatus: dto.status, comment: dto.comment?.trim() || undefined } });
      return updated;
    });
  }

  async addPayment(id: string, dto: AddPaymentDto) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: { payments: true } });
    if (!order) throw new NotFoundException('Заказ не найден');
    const paidBefore = order.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const remaining = Number(order.totalPrice) - paidBefore;
    if (dto.amount > remaining + 0.005) throw new BadRequestException('Сумма платежа превышает остаток по заказу');
    const result = await this.prisma.$transaction(async (tx) => {
      await tx.payment.create({ data: { orderId: id, amount: new Prisma.Decimal(dto.amount), method: dto.method?.trim() || undefined } });
      const paid = paidBefore + dto.amount;
      const paymentStatus: PaymentStatus = paid >= Number(order.totalPrice) - 0.005 ? 'PAID' : 'PARTIALLY_PAID';
      const status = order.status === 'NEW' && paymentStatus === 'PAID' ? 'PAID' : order.status;
      return tx.order.update({ where: { id }, data: { paymentStatus, status }, include: { customer: true, lead: true, items: true, payments: { orderBy: { paidAt: 'desc' } }, statusHistory: { orderBy: { createdAt: 'desc' } } } });
    });
    return result;
  }

  findAll() {
    return this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: { customer: true, lead: { select: { id: true, name: true, contact: true, status: true } }, items: true, statusHistory: { orderBy: { createdAt: 'desc' } } },
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
