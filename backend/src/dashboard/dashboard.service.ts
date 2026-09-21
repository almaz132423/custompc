import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(from?: string, to?: string) {
    const { start, end } = this.parsePeriod(from, to);

    const [leadCounts, orderCounts, sales, payments, costAndProfit, receivables, recentLeads, recentOrders] =
      await Promise.all([
        this.prisma.lead.groupBy({
          by: ['status'],
          where: { createdAt: { gte: start, lt: end } },
          _count: { _all: true },
        }),
        this.prisma.order.groupBy({
          by: ['status'],
          where: { createdAt: { gte: start, lt: end } },
          _count: { _all: true },
        }),
        this.prisma.order.aggregate({
          where: { createdAt: { gte: start, lt: end } },
          _sum: { totalPrice: true },
          _count: { _all: true },
        }),
        this.prisma.payment.aggregate({
          where: { paidAt: { gte: start, lt: end } },
          _sum: { amount: true },
          _count: { _all: true },
        }),
        this.prisma.order.aggregate({
          where: { createdAt: { gte: start, lt: end } },
          _sum: { costPrice: true, profit: true },
        }),
        this.prisma.order.findMany({
          where: { createdAt: { gte: start, lt: end } },
          select: { totalPrice: true, payments: { select: { amount: true } } },
        }),
        this.prisma.lead.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, name: true, contact: true, status: true, createdAt: true },
        }),
        this.prisma.order.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, number: true, status: true, totalPrice: true, createdAt: true },
        }),
      ]);

    const leadMap = Object.fromEntries(leadCounts.map((item) => [item.status, item._count._all]));
    const orderMap = Object.fromEntries(orderCounts.map((item) => [item.status, item._count._all]));

    const outstanding = receivables.reduce(
      (sum, order) =>
        sum +
        Number(order.totalPrice) -
        order.payments.reduce((paid, payment) => paid + Number(payment.amount), 0),
      0,
    );

    return {
      period: { from: start.toISOString(), to: end.toISOString() },
      leads: {
        total: leadCounts.reduce((sum, item) => sum + item._count._all, 0),
        new: leadMap.NEW ?? 0,
        inProgress: leadMap.IN_PROGRESS ?? 0,
        contacted: leadMap.CONTACTED ?? 0,
        calculated: leadMap.CALCULATED ?? 0,
        agreed: leadMap.AGREED ?? 0,
        orders: leadMap.ORDER ?? 0,
        rejected: leadMap.REJECTED ?? 0,
      },
      orders: {
        total: orderCounts.reduce((sum, item) => sum + item._count._all, 0),
        new: orderMap.NEW ?? 0,
        awaitingPayment: orderMap.AWAITING_PAYMENT ?? 0,
        paid: orderMap.PAID ?? 0,
        purchasing: orderMap.PURCHASING ?? 0,
        componentsReceived: orderMap.COMPONENTS_RECEIVED ?? 0,
        assembly: orderMap.ASSEMBLY ?? 0,
        testing: orderMap.TESTING ?? 0,
        ready: orderMap.READY ?? 0,
        issued: orderMap.ISSUED ?? 0,
        completed: orderMap.COMPLETED ?? 0,
      },
      finance: {
        sales: this.decimalToNumber(sales._sum.totalPrice),
        paid: this.decimalToNumber(payments._sum.amount),
        cost: this.decimalToNumber(costAndProfit._sum.costPrice),
        profit: this.decimalToNumber(costAndProfit._sum.profit),
        outstanding: Math.max(0, outstanding),
        ordersCount: sales._count._all,
        paymentsCount: payments._count._all,
      },
      recent: {
        leads: recentLeads,
        orders: recentOrders,
      },
    };
  }

  private parsePeriod(from?: string, to?: string) {
    const now = new Date();
    const end = to ? this.parseDate(to, 'to') : new Date(now.getTime() + DAY_MS);
    const start = from ? this.parseDate(from, 'from') : new Date(now.getTime() - 30 * DAY_MS);

    if (start >= end) {
      throw new BadRequestException('Дата начала периода должна быть раньше даты окончания');
    }

    return { start, end };
  }

  private parseDate(value: string, field: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Некорректная дата ' + field);
    }
    return date;
  }

  private decimalToNumber(value: Prisma.Decimal | null | undefined) {
    return value == null ? null : Number(value);
  }
}
