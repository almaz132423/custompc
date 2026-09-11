import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const gaming = await prisma.category.upsert({
    where: { slug: 'gaming' },
    update: {},
    create: { name: 'Игровые', slug: 'gaming' },
  });

  const universal = await prisma.category.upsert({
    where: { slug: 'universal' },
    update: {},
    create: { name: 'Универсальные', slug: 'universal' },
  });

  const start = await prisma.pCBuild.upsert({
    where: { slug: 'start' },
    update: {},
    create: {
      slug: 'start',
      name: 'ПК START',
      description: 'Стартовый игровой ПК для 1080p',
      price: 89990,
      purpose: 'GAMES',
      resolution: 'R1080P',
      warrantyMonths: 12,
      buildTimeDays: 3,
      categoryId: gaming.id,
      images: {
        create: [{ url: 'https://placehold.co/600x400?text=PC+START', sortOrder: 0 }],
      },
    },
  });

  const gamingBuild = await prisma.pCBuild.upsert({
    where: { slug: 'gaming' },
    update: {},
    create: {
      slug: 'gaming',
      name: 'ПК GAMING',
      description: 'Игровой ПК для 1440p',
      price: 149990,
      purpose: 'GAMES',
      resolution: 'R1440P',
      warrantyMonths: 12,
      buildTimeDays: 4,
      categoryId: gaming.id,
      images: {
        create: [{ url: 'https://placehold.co/600x400?text=PC+GAMING', sortOrder: 0 }],
      },
    },
  });

  const pro = await prisma.pCBuild.upsert({
    where: { slug: 'pro' },
    update: {},
    create: {
      slug: 'pro',
      name: 'ПК PRO',
      description: 'Мощный ПК для 4K и требовательных задач',
      price: 229990,
      purpose: 'UNIVERSAL',
      resolution: 'R4K',
      warrantyMonths: 24,
      buildTimeDays: 5,
      categoryId: universal.id,
      images: {
        create: [{ url: 'https://placehold.co/600x400?text=PC+PRO', sortOrder: 0 }],
      },
    },
  });

  const categories = await Promise.all([
    ['CPU', 'Процессор'],
    ['GPU', 'Видеокарта'],
    ['MOTHERBOARD', 'Материнская плата'],
    ['RAM', 'Оперативная память'],
    ['SSD', 'SSD'],
    ['PSU', 'Блок питания'],
    ['CASE', 'Корпус'],
    ['COOLING', 'Охлаждение'],
  ].map(async ([code, name]) =>
    prisma.componentCategory.upsert({
      where: { code: code as any },
      update: { name },
      create: { code: code as any, name },
    }),
  ));

  const categoryByCode = Object.fromEntries(
    categories.map((category) => [category.code, category]),
  );

  async function component(
    categoryCode: keyof typeof categoryByCode,
    manufacturer: string,
    model: string,
    price: number,
    specs: Record<string, string | number>,
    compatibility: Record<string, string | number>,
  ) {
    const category = categoryByCode[categoryCode];
    const existing = await prisma.component.findFirst({
      where: { categoryId: category.id, manufacturer, model },
    });

    if (existing) {
      return existing;
    }

    return prisma.component.create({
      data: {
        categoryId: category.id,
        manufacturer,
        model,
        price,
        specs,
        compatibility,
      },
    });
  }

  const [startCpu, startGpu, startBoard, startRam, startSsd, startPsu, startCase, startCooling] = await Promise.all([
    component('CPU', 'AMD', 'Ryzen 5 5600', 11500, { cores: 6, threads: 12 }, { socket: 'AM4' }),
    component('GPU', 'NVIDIA', 'GeForce RTX 4060', 33000, { memoryGb: 8 }, { lengthMm: 250 }),
    component('MOTHERBOARD', 'MSI', 'B550M PRO-VDH', 9000, { memoryType: 'DDR4' }, { socket: 'AM4', ramType: 'DDR4', formFactor: 'mATX' }),
    component('RAM', 'Kingston', 'FURY Beast 16GB (2x8GB)', 4500, { capacityGb: 16, memoryType: 'DDR4' }, { ramType: 'DDR4', modules: 2 }),
    component('SSD', 'Kingston', 'NV2 1TB', 6500, { capacityGb: 1000, interface: 'NVMe' }, {}),
    component('PSU', 'DeepCool', 'PK600D', 5500, { powerW: 600 }, { powerW: 600 }),
    component('CASE', 'DeepCool', 'MATREXX 40 3FS', 5000, { formFactor: 'mATX' }, { formFactor: 'mATX' }),
    component('COOLING', 'DeepCool', 'AG400', 3000, { type: 'air' }, { socket: 'AM4' }),
  ]);

  const [gamingCpu, gamingGpu, gamingBoard, gamingRam, gamingSsd, gamingPsu, gamingCase, gamingCooling] = await Promise.all([
    component('CPU', 'AMD', 'Ryzen 5 7600', 18000, { cores: 6, threads: 12 }, { socket: 'AM5' }),
    component('GPU', 'NVIDIA', 'GeForce RTX 4070', 70000, { memoryGb: 12 }, { lengthMm: 300 }),
    component('MOTHERBOARD', 'MSI', 'B650M GAMING PLUS WIFI', 18000, { memoryType: 'DDR5' }, { socket: 'AM5', ramType: 'DDR5', formFactor: 'mATX' }),
    component('RAM', 'Kingston', 'FURY Beast 32GB (2x16GB)', 8500, { capacityGb: 32, memoryType: 'DDR5' }, { ramType: 'DDR5', modules: 2 }),
    component('SSD', 'Kingston', 'KC3000 1TB', 9000, { capacityGb: 1000, interface: 'NVMe' }, {}),
    component('PSU', 'be quiet!', 'System Power 10 750W', 8000, { powerW: 750 }, { powerW: 750 }),
    component('CASE', 'DeepCool', 'CH370', 7500, { formFactor: 'mATX' }, { formFactor: 'mATX' }),
    component('COOLING', 'DeepCool', 'AK400', 4000, { type: 'air' }, { socket: 'AM5' }),
  ]);

  const [proCpu, proGpu, proBoard, proRam, proSsd, proPsu, proCase, proCooling] = await Promise.all([
    component('CPU', 'AMD', 'Ryzen 9 7900X', 40000, { cores: 12, threads: 24 }, { socket: 'AM5' }),
    component('GPU', 'NVIDIA', 'GeForce RTX 4080 SUPER', 115000, { memoryGb: 16 }, { lengthMm: 310 }),
    component('MOTHERBOARD', 'ASUS', 'TUF GAMING B650-PLUS WIFI', 22000, { memoryType: 'DDR5' }, { socket: 'AM5', ramType: 'DDR5', formFactor: 'ATX' }),
    component('RAM', 'Kingston', 'FURY Beast 64GB (2x32GB)', 17000, { capacityGb: 64, memoryType: 'DDR5' }, { ramType: 'DDR5', modules: 2 }),
    component('SSD', 'Samsung', '990 PRO 2TB', 17000, { capacityGb: 2000, interface: 'NVMe' }, {}),
    component('PSU', 'be quiet!', 'Pure Power 12 M 850W', 13000, { powerW: 850 }, { powerW: 850 }),
    component('CASE', 'Fractal Design', 'Pop Air', 9000, { formFactor: 'ATX' }, { formFactor: 'ATX' }),
    component('COOLING', 'DeepCool', 'AK620', 7500, { type: 'air' }, { socket: 'AM5' }),
  ]);

  const buildComponents = [
    [start, [startCpu, startGpu, startBoard, startRam, startSsd, startPsu, startCase, startCooling]],
    [gamingBuild, [gamingCpu, gamingGpu, gamingBoard, gamingRam, gamingSsd, gamingPsu, gamingCase, gamingCooling]],
    [pro, [proCpu, proGpu, proBoard, proRam, proSsd, proPsu, proCase, proCooling]],
  ] as const;

  for (const [build, components] of buildComponents) {
    for (const item of components) {
      await prisma.pCBuildComponent.upsert({
        where: {
          pcBuildId_componentId: {
            pcBuildId: build.id,
            componentId: item.id,
          },
        },
        update: { quantity: 1 },
        create: {
          pcBuildId: build.id,
          componentId: item.id,
          quantity: 1,
        },
      });
    }
  }

  console.log('Тестовые данные и комплектующие добавлены');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
