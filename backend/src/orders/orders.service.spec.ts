import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';

describe('OrdersService — lead to order validation', () => {
  const prisma = {
    lead: { findUnique: vi.fn() },
    order: { findUnique: vi.fn() },
  };
  const notifications = {} as NotificationsService;
  let service: OrdersService;

  beforeEach(() => {
    vi.resetAllMocks();
    service = new OrdersService(prisma as unknown as PrismaService, notifications);
  });

  it('rejects a missing lead', async () => {
    prisma.lead.findUnique.mockResolvedValue(null);
    await expect(service.createFromLead('missing')).rejects.toThrow(NotFoundException);
  });

  it('rejects a lead that has not been agreed', async () => {
    prisma.lead.findUnique.mockResolvedValue({ status: 'NEW', order: null });
    await expect(service.createFromLead('lead-1')).rejects.toThrow(
      'Заказ можно создать только из согласованной заявки',
    );
  });

  it('rejects creating a second order for one lead', async () => {
    prisma.lead.findUnique.mockResolvedValue({ status: 'AGREED', order: { id: 'existing' } });
    await expect(service.createFromLead('lead-1')).rejects.toThrow(
      'Для этой заявки заказ уже создан',
    );
  });

  it('rejects an agreed lead without a positive price', async () => {
    prisma.lead.findUnique.mockResolvedValue({
      status: 'AGREED',
      order: null,
      agreedPrice: null,
      pcBuild: null,
      configuration: null,
    });
    await expect(service.createFromLead('lead-1')).rejects.toThrow(
      'Не удалось определить стоимость заказа',
    );
  });

  it('records AGREED → ORDER in lead history inside the order transaction', async () => {
    const order = {
      id: 'order-1',
      number: 'ORD-TEST',
      status: 'NEW',
      paymentStatus: 'UNPAID',
      totalPrice: { toString: () => '50000' },
      customer: { name: 'Customer' },
      lead: { name: 'Customer' },
    };
    const tx = {
      customer: { findUnique: vi.fn().mockResolvedValue({ id: 'customer-1' }) },
      order: { create: vi.fn().mockResolvedValue(order) },
      lead: { update: vi.fn().mockResolvedValue({}) },
      leadStatusHistory: { create: vi.fn().mockResolvedValue({}) },
    };
    prisma.lead.findUnique.mockResolvedValue({
      id: 'lead-1',
      status: 'AGREED',
      order: null,
      customerId: 'customer-1',
      agreedPrice: 50000,
      pcBuild: { id: 'build-1', name: 'PC', price: 50000, components: [] },
      configuration: null,
    });
    (prisma as typeof prisma & { $transaction: ReturnType<typeof vi.fn> }).$transaction =
      vi.fn(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx));
    const notifyOrderCreated = vi.fn().mockResolvedValue(undefined);
    service = new OrdersService(
      prisma as unknown as PrismaService,
      { notifyOrderCreated } as unknown as NotificationsService,
    );

    await service.createFromLead('lead-1');

    expect(tx.lead.update).toHaveBeenCalledWith({
      where: { id: 'lead-1' },
      data: { status: 'ORDER' },
    });
    expect(tx.leadStatusHistory.create).toHaveBeenCalledWith({
      data: {
        leadId: 'lead-1',
        fromStatus: 'AGREED',
        toStatus: 'ORDER',
        comment: 'Создан заказ ORD-TEST',
      },
    });
  });

  it('rejects updating a missing order', async () => {
    prisma.order.findUnique.mockResolvedValue(null);
    await expect(service.update('missing', { status: 'PAID' })).rejects.toThrow(NotFoundException);
  });

  it('rejects skipping order lifecycle stages', async () => {
    prisma.order.findUnique.mockResolvedValue({ status: 'NEW' });
    await expect(service.update('order-1', { status: 'COMPLETED' })).rejects.toThrow(
      'Недопустимый переход статуса заказа: NEW → COMPLETED',
    );
  });

  it('rejects an empty order update', async () => {
    prisma.order.findUnique.mockResolvedValue({ status: 'NEW' });
    await expect(service.update('order-1', {})).rejects.toThrow(BadRequestException);
  });
});
