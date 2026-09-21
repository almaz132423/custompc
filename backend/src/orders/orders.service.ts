import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OrderStatusStage, PaymentStatus, Prisma } from '@prisma/client';
import { UpdateOrderDto } from './dto/update-order.dto.js';
import { AddPaymentDto } from './dto/add-payment.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async createFromLead(leadId: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        pcBuild: { include: { components: { include: { component: true } } } },
        order: true,
      },
    });
    if (!lead) throw new NotFoundException('Заявка не найдена');
    if (lead.status !== 'AGREED') throw new BadRequestException('Заказ можно создать только из согласованной заявки');
    if (lead.order) throw new BadRequestException('Для этой заявки заказ уже создан');

    const configuration = this.readConfiguration(lead.configuration);
    const totalPrice = lead.pcBuild ? Number(lead.pcBuild.price) : Number(configuration?.total ?? 0);
    if (!Number.isFinite(totalPrice) || totalPrice <= 0) {
      throw new BadRequestException('Не удалось определить стоимость заказа');
    }

    let items: Array<{ name: string; price: number; quantity: number; costPrice: number | null; pcBuildId?: string }>;

    if (lead.pcBuild) {
      items = [{
        name: lead.pcBuild.name,
        price: Number(lead.pcBuild.price),
        quantity: 1,
        pcBuildId: lead.pcBuild.id,
        costPrice: this.calculateBuildCost(lead.pcBuild.components),
      }];
    } else {
      const componentIds = configuration?.components.map((component) => component.id).filter((id): id is string => Boolean(id)) ?? [];
      const dbComponents = componentIds.length
        ? await this.prisma.component.findMany({ where: { id: { in: componentIds } } })
        : [];
      const byId = new Map(dbComponents.map((component) => [component.id, component]));

      items = (configuration?.components ?? []).map((component) => {
        const dbComponent = component.id ? byId.get(component.id) : undefined;
        return {
          name: `${component.manufacturer} ${component.model}`,
          price: component.price,
          quantity: 1,
          costPrice: dbComponent?.costPrice == null ? null : Number(dbComponent.costPrice),
        };
      });
    }

    if (!items.length || items.some((item) => !Number.isFinite(item.price) || item.price < 0)) {
      throw new BadRequestException('В заявке отсутствует корректный состав заказа');
    }

    const costPrice = items.every((item) => item.costPrice !== null)
      ? items.reduce((sum, item) => sum + (item.costPrice ?? 0) * item.quantity, 0)
      : null;
    const profit = costPrice === null ? null : totalPrice - costPrice;

    const number = `ORD-${Date.now().toString(36).toUpperCase()}`;
    const order = await this.prisma.$transaction(async (tx) => {
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
          costPrice: costPrice === null ? undefined : new Prisma.Decimal(costPrice),
          profit: profit === null ? undefined : new Prisma.Decimal(profit),
          comment: lead.comment ?? undefined,
          items: {
            create: items.map((item) => ({
              name: item.name,
              price: new Prisma.Decimal(item.price),
              costPrice: item.costPrice === null ? undefined : new Prisma.Decimal(item.costPrice),
              quantity: item.quantity,
              pcBuildId: item.pcBuildId,
            })),
          },
        },
        include: { customer: true, lead: true, items: true },
      });

      await tx.lead.update({ where: { id: lead.id }, data: { status: 'ORDER' } });
      return order;
    });

    void this.notificationsService.notifyOrderCreated({
      id: order.id,
      number: order.number,
      status: order.status,
      paymentStatus: order.paymentStatus,
      totalPrice: order.totalPrice.toString(),
      customerName: order.customer?.name,
      leadName: order.lead?.name,
    }).catch((error) =>
      this.logger.error(`Order creation notification failed: ${error instanceof Error ? error.message : String(error)}`),
    );

    return order;
  }

  async update(id: string, dto: UpdateOrderDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Заказ не найден');
    if (!dto.status && !dto.paymentStatus && !dto.comment?.trim()) {
      throw new BadRequestException('Нет изменений для сохранения');
    }

    if (dto.status && dto.status !== order.status && !this.isAllowedStatusTransition(order.status, dto.status)) {
      throw new BadRequestException(
        `Недопустимый переход статуса заказа: ${order.status} → ${dto.status}`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const data: Prisma.OrderUpdateInput = {};
      if (dto.status) data.status = dto.status;
      if (dto.paymentStatus) data.paymentStatus = dto.paymentStatus;
      if (dto.comment?.trim()) data.comment = dto.comment.trim();

      const updated = await tx.order.update({
        where: { id },
        data,
        include: {
          customer: true,
          lead: true,
          items: true,
          statusHistory: { orderBy: { createdAt: 'desc' } },
          payments: { orderBy: { paidAt: 'desc' } },
        },
      });

      if (dto.status && dto.status !== order.status) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: id,
            fromStatus: order.status,
            toStatus: dto.status,
            comment: dto.comment?.trim() || undefined,
          },
        });
      }
      return updated;
    });

    if (dto.status && dto.status !== order.status) {
      void this.notificationsService.notifyOrderStatusChanged({
        order: {
          id: updated.id,
          number: updated.number,
          status: updated.status,
          paymentStatus: updated.paymentStatus,
          totalPrice: updated.totalPrice.toString(),
          customerName: updated.customer?.name,
          leadName: updated.lead?.name,
        },
        fromStatus: order.status,
        toStatus: dto.status,
        comment: dto.comment,
      }).catch((error) =>
        this.logger.error(`Order status notification failed: ${error instanceof Error ? error.message : String(error)}`),
      );
    }

    return updated;
  }

  async addPayment(id: string, dto: AddPaymentDto) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: { payments: true } });
    if (!order) throw new NotFoundException('Заказ не найден');

    const paidBefore = order.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const remaining = Number(order.totalPrice) - paidBefore;
    if (dto.amount > remaining + 0.005) {
      throw new BadRequestException('Сумма платежа превышает остаток по заказу');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          orderId: id,
          amount: new Prisma.Decimal(dto.amount),
          method: dto.method?.trim() || undefined,
        },
      });

      const paid = paidBefore + dto.amount;
      const paymentStatus: PaymentStatus =
        paid >= Number(order.totalPrice) - 0.005 ? 'PAID' : 'PARTIALLY_PAID';
      const status: OrderStatusStage =
        order.status === 'NEW' && paymentStatus === 'PAID' ? 'PAID' : order.status;

      if (status !== order.status) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: id,
            fromStatus: order.status,
            toStatus: status,
            comment: 'Статус изменён автоматически после полной оплаты',
          },
        });
      }

      return tx.order.update({
        where: { id },
        data: { paymentStatus, status },
        include: {
          customer: true,
          lead: true,
          items: true,
          payments: { orderBy: { paidAt: 'desc' } },
          statusHistory: { orderBy: { createdAt: 'desc' } },
        },
      });
    });

    void this.notificationsService.notifyPaymentAdded({
      id: updated.id,
      number: updated.number,
      status: updated.status,
      paymentStatus: updated.paymentStatus,
      totalPrice: updated.totalPrice.toString(),
      customerName: updated.customer?.name,
      leadName: updated.lead?.name,
    }, dto.amount).catch((error) =>
      this.logger.error(`Payment notification failed: ${error instanceof Error ? error.message : String(error)}`),
    );

    return updated;
  }

  findAll() {
    return this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        lead: { select: { id: true, name: true, contact: true, status: true } },
        items: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
        payments: { orderBy: { paidAt: 'desc' } },
      },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        lead: true,
        items: true,
        payments: { orderBy: { paidAt: 'desc' } },
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!order) throw new NotFoundException('Заказ не найден');
    return order;
  }

  private isAllowedStatusTransition(from: OrderStatusStage, to: OrderStatusStage) {
    const transitions: Record<OrderStatusStage, OrderStatusStage[]> = {
      NEW: ['AWAITING_PAYMENT', 'PAID'],
      AWAITING_PAYMENT: ['PAID'],
      PAID: ['PURCHASING'],
      PURCHASING: ['COMPONENTS_RECEIVED'],
      COMPONENTS_RECEIVED: ['ASSEMBLY'],
      ASSEMBLY: ['TESTING'],
      TESTING: ['ASSEMBLY', 'READY'],
      READY: ['ISSUED'],
      ISSUED: ['COMPLETED'],
      COMPLETED: [],
    };
    return transitions[from].includes(to);
  }

  private calculateBuildCost(
    components: Array<{ quantity: number; component: { costPrice: Prisma.Decimal | null } }>,
  ) {
    if (components.some((item) => item.component.costPrice === null)) return null;
    return components.reduce(
      (sum, item) => sum + Number(item.component.costPrice) * item.quantity,
      0,
    );
  }

  private readConfiguration(value: Prisma.JsonValue | null) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

    const record = value as Record<string, unknown>;
    const components = Array.isArray(record.components) ? record.components : [];
    const normalized = components.flatMap((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
      const c = item as Record<string, unknown>;
      if (
        typeof c.manufacturer !== 'string' ||
        typeof c.model !== 'string' ||
        typeof c.price !== 'string' && typeof c.price !== 'number'
      ) {
        return [];
      }

      const price = Number(c.price);
      if (!Number.isFinite(price)) return [];

      return [{
        id: typeof c.id === 'string' ? c.id : undefined,
        manufacturer: c.manufacturer,
        model: c.model,
        price,
      }];
    });

    const total = typeof record.total === 'string' || typeof record.total === 'number'
      ? Number(record.total)
      : Number.NaN;

    return { total, components: normalized };
  }
}
