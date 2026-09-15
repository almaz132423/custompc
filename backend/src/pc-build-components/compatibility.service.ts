import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

type JsonRecord = Record<string, unknown>;
type ComponentForCompatibility = {
  id: string;
  manufacturer: string;
  model: string;
  compatibility: unknown;
  category: { code: string; name: string };
};

export type CompatibilityIssue = {
  type: 'PAIR' | 'POWER' | 'RULE';
  message: string;
  componentIds?: string[];
};

@Injectable()
export class CompatibilityService {
  constructor(private readonly prisma: PrismaService) {}

  async validateBuild(buildId: string) {
    const build = await this.prisma.pCBuild.findUnique({
      where: { id: buildId },
      include: { components: { include: { component: { include: { category: true } } } } },
    });
    if (!build) throw new BadRequestException('Сборка не найдена');

    const components = build.components.map((link) => link.component);
    const issues = await this.validateComponents(components);
    return { compatible: issues.length === 0, buildId, issues };
  }

  async validateComponents(components: ComponentForCompatibility[]) {
    return this.checkComponents(components);
  }

  async assertComponentCanBeAdded(buildId: string, componentId: string) {
    const build = await this.prisma.pCBuild.findUnique({
      where: { id: buildId },
      include: { components: { include: { component: { include: { category: true } } } } },
    });
    if (!build) throw new BadRequestException('Сборка не найдена');

    const component = await this.prisma.component.findUnique({
      where: { id: componentId },
      include: { category: true },
    });
    if (!component) throw new BadRequestException('Комплектующее не найдено');

    const components = [
      ...build.components
        .filter((link) => link.componentId !== componentId)
        .map((link) => link.component),
      component,
    ];
    const issues = await this.checkComponents(components);
    if (issues.length) throw new BadRequestException(issues.map((issue) => issue.message));
  }

  private async checkComponents(components: ComponentForCompatibility[]): Promise<CompatibilityIssue[]> {
    const issues: CompatibilityIssue[] = [];
    const byCategory = (code: string) => components.filter((item) => item.category.code === code);
    const cpu = byCategory('CPU')[0];
    const motherboard = byCategory('MOTHERBOARD')[0];
    const ram = byCategory('RAM')[0];
    const cooling = byCategory('COOLING')[0];
    const gpu = byCategory('GPU')[0];
    const psu = byCategory('PSU')[0];
    const pcCase = byCategory('CASE')[0];

    this.matchField(issues, cpu, motherboard, 'socket', 'Процессор и материнская плата используют разные сокеты');
    this.matchField(issues, motherboard, ram, 'ramType', 'Материнская плата и оперативная память используют разные типы памяти');
    this.matchField(issues, motherboard, pcCase, 'formFactor', 'Форм-фактор материнской платы не поддерживается корпусом');
    this.matchField(issues, cpu, cooling, 'socket', 'Охлаждение не поддерживает сокет процессора');

    const gpuLength = this.numberValue(gpu?.compatibility, 'lengthMm');
    const maxGpuLength = this.numberValue(pcCase?.compatibility, 'maxGpuLengthMm');
    if (gpu && pcCase && gpuLength !== undefined && maxGpuLength !== undefined && gpuLength > maxGpuLength) {
      issues.push({ type: 'PAIR', message: `Видеокарта ${gpu.manufacturer} ${gpu.model} длиннее допустимой длины корпуса`, componentIds: [gpu.id, pcCase.id] });
    }

    const gpuRequiredPower = this.numberValue(gpu?.compatibility, 'requiredPowerW');
    const psuPower = this.numberValue(psu?.compatibility, 'powerW');
    if (gpu && psu && gpuRequiredPower !== undefined && psuPower !== undefined && psuPower < gpuRequiredPower) {
      issues.push({ type: 'POWER', message: `Блок питания ${psu.manufacturer} ${psu.model} слабее рекомендуемой мощности для видеокарты`, componentIds: [gpu.id, psu.id] });
    }

    const activeRules = await this.prisma.compatibilityRule.findMany({ where: { isActive: true } });
    for (const rule of activeRules) {
      const issue = this.evaluateRule(rule.rule, components, rule.description ?? rule.name);
      if (issue) issues.push(issue);
    }
    return issues;
  }

  private matchField(issues: CompatibilityIssue[], left: ComponentForCompatibility | undefined, right: ComponentForCompatibility | undefined, field: string, message: string) {
    if (!left || !right) return;
    const leftValue = this.stringValue(left.compatibility, field);
    const rightValue = this.stringValue(right.compatibility, field);
    if (leftValue !== undefined && rightValue !== undefined && leftValue !== rightValue) {
      issues.push({ type: 'PAIR', message, componentIds: [left.id, right.id] });
    }
  }

  private evaluateRule(ruleValue: unknown, components: ComponentForCompatibility[], description: string): CompatibilityIssue | null {
    if (!this.isRecord(ruleValue)) return null;
    const condition = this.isRecord(ruleValue.if) ? ruleValue.if : null;
    const requires = this.isRecord(ruleValue.requires) ? ruleValue.requires : null;
    if (!condition || !requires) return null;
    const source = components.find((component) => this.matches(component, condition));
    if (!source) return null;
    const target = components.find((component) => this.matches(component, requires));
    if (target) return null;
    const requiredCategory = typeof requires.category === 'string' ? requires.category : 'требуемое комплектующее';
    return { type: 'RULE', message: description || `Для ${source.manufacturer} ${source.model} требуется ${requiredCategory}`, componentIds: [source.id] };
  }

  private matches(component: ComponentForCompatibility, condition: JsonRecord) {
    if (typeof condition.category === 'string' && component.category.code !== condition.category) return false;
    for (const [key, value] of Object.entries(condition)) {
      if (key !== 'category' && this.value(component.compatibility, key) !== value) return false;
    }
    return true;
  }

  private value(data: unknown, key: string) { return this.isRecord(data) ? data[key] : undefined; }
  private stringValue(data: unknown, key: string) { const value = this.value(data, key); return typeof value === 'string' ? value : undefined; }
  private numberValue(data: unknown, key: string) { const value = this.value(data, key); return typeof value === 'number' ? value : undefined; }
  private isRecord(value: unknown): value is JsonRecord { return typeof value === 'object' && value !== null && !Array.isArray(value); }
}
