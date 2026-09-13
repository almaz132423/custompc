import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { SetPcBuildComponentDto } from './dto/set-pc-build-component.dto.js';

const compositionInclude = {
  component: { include: { category: true } },
} as const;

@Injectable()
export class PcBuildComponentsService {
  constructor(private readonly prisma: PrismaService) {}

  findBuilds() {
    return this.prisma.pCBuild.findMany({
      include: {
        category: true,
        components: { include: compositionInclude.component, orderBy: { component: { category: { name: 'asc' } } } },
      },
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(buildId: string) {
    const build = await this.prisma.pCBuild.findUnique({
      where: { id: buildId },
      include: {
        category: true,
        components: {
          include: compositionInclude.component,
          orderBy: { component: { category: { name: 'asc' } } },
        },
      },
    });

    if (!build) throw new NotFoundException(`Сборка "${buildId}" не найдена`);
    return build;
  }

  async setComponent(buildId: string, dto: SetPcBuildComponentDto) {
    await this.ensureBuild(buildId);
    await this.ensureComponent(dto.componentId);

    return this.prisma.pCBuildComponent.upsert({
      where: { pcBuildId_componentId: { pcBuildId: buildId, componentId: dto.componentId } },
      create: { pcBuildId: buildId, componentId: dto.componentId, quantity: dto.quantity },
      update: { quantity: dto.quantity },
      include: compositionInclude,
    });
  }

  async removeComponent(buildId: string, componentId: string) {
    await this.ensureBuild(buildId);

    const link = await this.prisma.pCBuildComponent.findUnique({
      where: { pcBuildId_componentId: { pcBuildId: buildId, componentId } },
    });

    if (!link) throw new NotFoundException('Комплектующее не входит в эту сборку');

    await this.prisma.pCBuildComponent.delete({ where: { id: link.id } });
    return { ok: true };
  }

  private async ensureBuild(id: string) {
    const build = await this.prisma.pCBuild.findUnique({ where: { id }, select: { id: true } });
    if (!build) throw new NotFoundException(`Сборка "${id}" не найдена`);
  }

  private async ensureComponent(id: string) {
    const component = await this.prisma.component.findUnique({ where: { id }, select: { id: true } });
    if (!component) throw new BadRequestException('Комплектующее не найдено');
  }
}
