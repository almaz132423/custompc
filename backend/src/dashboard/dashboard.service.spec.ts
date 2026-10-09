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

  it('rejects an invalid start date', async () => {
    await expect(service.getSummary('not-a-date', '2026-10-09')).rejects.toThrow(
      'Некорректная дата from',
    );
  });
});
