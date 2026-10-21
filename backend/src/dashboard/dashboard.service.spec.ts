import { DashboardService } from './dashboard.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('DashboardService', () => {
  const prisma = {
    lead: {
      groupBy: vi.fn().mockResolvedValue([]),
      findMany: vi.fn().mockResolvedValue([]),
    },
    order: {
      groupBy: vi.fn().mockResolvedValue([]),
      aggregate: vi.fn().mockResolvedValue({
        _sum: { totalPrice: null, costPrice: null, profit: null },
        _count: { _all: 0 },
      }),
      findMany: vi.fn().mockResolvedValue([]),
    },
    payment: {
      aggregate: vi.fn().mockResolvedValue({
        _sum: { amount: null },
        _count: { _all: 0 },
      }),
    },
  };

  let service: DashboardService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DashboardService(prisma as unknown as PrismaService);
  });

  it('includes the entire selected end date in dashboard statistics', async () => {
    await service.getSummary('2026-10-01', '2026-10-09');

    expect(prisma.lead.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          createdAt: {
            gte: new Date('2026-10-01T00:00:00.000Z'),
            lt: new Date('2026-10-10T00:00:00.000Z'),
          },
        },
      }),
    );
    expect(prisma.order.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          createdAt: {
            gte: new Date('2026-10-01T00:00:00.000Z'),
            lt: new Date('2026-10-10T00:00:00.000Z'),
          },
        },
      }),
    );
  });

  it('does not report partial profit when an order has unknown costs', async () => {
    prisma.order.findMany.mockResolvedValueOnce([
      {
        totalPrice: 1000,
        costPrice: 600,
        profit: 400,
        payments: [{ amount: 100 }],
      },
      {
        totalPrice: 2000,
        costPrice: null,
        profit: null,
        payments: [{ amount: 500 }],
      },
    ]);
    prisma.order.aggregate
      .mockResolvedValueOnce({ _sum: { totalPrice: 3000 }, _count: { _all: 2 } })
      .mockResolvedValueOnce({ _sum: { costPrice: 600, profit: 400 } });

    const result = await service.getSummary('2026-10-01', '2026-10-09');

    expect(result.finance.cost).toBe(600);
    expect(result.finance.profit).toBeNull();
    expect(result.finance.ordersWithUnknownCost).toBe(1);
    expect(result.finance.ordersWithUnknownProfit).toBe(1);
    expect(result.finance.outstanding).toBe(2400);
  });

  it('reports profit when all order costs are known', async () => {
    prisma.order.findMany.mockResolvedValueOnce([
      {
        totalPrice: 1000,
        costPrice: 600,
        profit: 400,
        payments: [],
      },
    ]);
    prisma.order.aggregate
      .mockResolvedValueOnce({ _sum: { totalPrice: 1000 }, _count: { _all: 1 } })
      .mockResolvedValueOnce({ _sum: { costPrice: 600, profit: 400 } });

    const result = await service.getSummary('2026-10-01', '2026-10-09');

    expect(result.finance.profit).toBe(400);
    expect(result.finance.ordersWithUnknownCost).toBe(0);
    expect(result.finance.ordersWithUnknownProfit).toBe(0);
  });

  it('does not report partial profit as total when service costs are unknown', async () => {
    prisma.order.findMany.mockResolvedValueOnce([
      { totalPrice: 2000, costPrice: null, profit: null, payments: [{ amount: 500 }] },
    ]);
    prisma.order.aggregate
      .mockResolvedValueOnce({ _sum: { totalPrice: 2000 }, _count: { _all: 1 } })
      .mockResolvedValueOnce({ _sum: { costPrice: null, profit: null } });

    const result = await service.getSummary('2026-10-01', '2026-10-09');

    expect(result.finance.profit).toBeNull();
    expect(result.finance.ordersWithUnknownCost).toBe(1);
    expect(result.finance.ordersWithUnknownProfit).toBe(1);
    expect(result.finance.outstanding).toBe(1500);
  });

  it('rejects an invalid start date', async () => {
    await expect(service.getSummary('not-a-date', '2026-10-09')).rejects.toThrow(
      'Некорректная дата from',
    );
  });
});
