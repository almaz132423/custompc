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

  await prisma.pCBuild.upsert({
    where: { slug: 'pk-start' },
    update: {},
    create: {
      slug: 'pk-start',
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

  await prisma.pCBuild.upsert({
    where: { slug: 'pk-gaming' },
    update: {},
    create: {
      slug: 'pk-gaming',
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

  await prisma.pCBuild.upsert({
    where: { slug: 'pk-pro' },
    update: {},
    create: {
      slug: 'pk-pro',
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

  console.log('Тестовые данные добавлены');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
