import { BadRequestException } from '@nestjs/common';
import { CompatibilityService } from './compatibility.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

const part = (id: string, code: string, compatibility: Record<string, unknown>) => ({
  id, manufacturer: 'Test', model: id, category: { code, name: code }, compatibility,
});

describe('CompatibilityService', () => {
  const prisma = { compatibilityRule: { findMany: vi.fn().mockResolvedValue([]) }, pCBuild: { findUnique: vi.fn() }, component: { findUnique: vi.fn() } };
  const service = new CompatibilityService(prisma as unknown as PrismaService);

  beforeEach(() => vi.clearAllMocks());

  it('accepts a micro-ATX board in an ATX case', async () => {
    const issues = await service.validateComponents([
      part('board', 'MOTHERBOARD', { formFactor: 'mATX' }),
      part('case', 'CASE', { formFactor: 'ATX' }),
    ], []);
    expect(issues).toEqual([]);
  });

  it('rejects an ATX board in a micro-ATX case', async () => {
    const issues = await service.validateComponents([
      part('board', 'MOTHERBOARD', { formFactor: 'ATX' }),
      part('case', 'CASE', { supportedFormFactors: ['mATX', 'Mini-ITX'] }),
    ], []);
    expect(issues.some((issue) => issue.message.includes('Форм-фактор'))).toBe(true);
  });

  it('enforces an active rule requiring a missing component category', async () => {
    const issues = await service.validateComponents([
      part('cpu', 'CPU', { socket: 'AM5' }),
    ], [{
      id: 'rule-1', name: 'CPU requires cooling', description: null, isActive: true,
      rule: { if: { category: 'CPU' }, requires: { category: 'COOLING' } },
    }]);
    expect(issues).toEqual([expect.objectContaining({ type: 'RULE', componentIds: ['cpu'] })]);
  });

  it('rejects two components in the same build category', async () => {
    prisma.pCBuild.findUnique.mockResolvedValue({
      components: [{ componentId: 'cpu-1', component: part('cpu-1', 'CPU', { socket: 'AM5' }) }],
    });
    prisma.component.findUnique.mockResolvedValue({ ...part('cpu-2', 'CPU', { socket: 'AM5' }), inStock: true });
    await expect(service.assertComponentCanBeAdded('build', 'cpu-2')).rejects.toThrow(
      'В сборке нельзя выбрать два комплектующих одной категории',
    );
  });

  it('rejects adding an out-of-stock component to a build', async () => {
    prisma.pCBuild.findUnique.mockResolvedValue({ components: [] });
    prisma.component.findUnique.mockResolvedValue({ ...part('gpu', 'GPU', {}), inStock: false });
    await expect(service.assertComponentCanBeAdded('build', 'gpu')).rejects.toThrow(BadRequestException);
  });
});
