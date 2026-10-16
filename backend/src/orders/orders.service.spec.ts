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
