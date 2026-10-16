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

  it('creates an order item from an agreed service-only lead without inventing costs', async () => {
    const lead = {
      id: 'lead-service',
      status: 'AGREED',
      order: null,
      category: 'Сборка ПК',
      agreedPrice: 2000,
      pcBuild: null,
      configuration: null,
      customerId: 'customer-1',
      comment: null,
    };
    prisma.lead.findUnique.mockResolvedValue(lead);
    const createdOrder = {
      id: 'order-1',
      number: 'ORD-1',
      status: 'NEW',
      paymentStatus: 'UNPAID',
      totalPrice: { toString: () => '2000' },
      customer: { name: 'Customer' },
      lead: { name: 'Customer' },
    };
    const tx = {
      customer: { findUnique: vi.fn().mockResolvedValue({ id: 'customer-1' }) },
      order: { create: vi.fn().mockResolvedValue(createdOrder) },
      lead: { update: vi.fn().mockResolvedValue({}) },
    };
    const transaction = vi.fn(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx));
    const prismaWithTransaction = { ...prisma, $transaction: transaction };
    const notifyOrderCreated = vi.fn().mockResolvedValue(undefined);
    service = new OrdersService(
      prismaWithTransaction as unknown as PrismaService,
      { notifyOrderCreated } as unknown as NotificationsService,
    );

    await expect(service.createFromLead('lead-service')).resolves.toBe(createdOrder);
    expect(tx.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          totalPrice: expect.objectContaining({ toString: expect.any(Function) }),
          costPrice: undefined,
          profit: undefined,
          items: {
            create: [{
              name: 'Сборка ПК',
              price: expect.objectContaining({ toString: expect.any(Function) }),
              costPrice: undefined,
              quantity: 1,
              pcBuildId: undefined,
            }],
          },
        }),
      }),
    );
    expect(tx.lead.update).toHaveBeenCalledWith({
      where: { id: 'lead-service' },
      data: { status: 'ORDER' },
    });
  });

  it('rejects a lead without a service name or configured items', async () => {
    prisma.lead.findUnique.mockResolvedValue({
      id: 'lead-empty',
      status: 'AGREED',
      order: null,
      agreedPrice: 2000,
      category: null,
      pcBuild: null,
      configuration: null,
    });
    await expect(service.createFromLead('lead-empty')).rejects.toThrow(
      'В заявке отсутствует корректный состав заказа',
    );
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
