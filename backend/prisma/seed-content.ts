import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findComponent(manufacturer: string, model: string) {
  const component = await prisma.component.findFirst({
    where: { manufacturer, model },
    select: { id: true },
  });

  if (!component) {
    throw new Error(`Не найдено комплектующее для демо-правила: ${manufacturer} ${model}`);
  }

  return component.id;
}

async function main() {
  // Этот seed НЕ удаляет и не пересоздаёт каталог, клиентов, заявки или заказы.
  // Его можно безопасно запускать повторно поверх существующей БД.

  const games = [
    ['Counter-Strike 2', 1],
    ['Cyberpunk 2077', 2],
    ['Dota 2', 3],
    ['Minecraft', 4],
    ['Red Dead Redemption 2', 5],
    ["Baldur's Gate 3", 6],
    ['Call of Duty: Warzone', 7],
    ['Forza Horizon 5', 8],
  ] as const;

  for (const [name, sortOrder] of games) {
    await prisma.game.upsert({
      where: { name },
      update: { isActive: true, sortOrder },
      create: { name, isActive: true, sortOrder },
    });
  }

  const services = [
    {
      id: 'seed-service-build',
      type: 'BUILD' as const,
      name: 'Сборка ПК',
      description: 'Сборка компьютера из выбранных комплектующих, подключение, аккуратная укладка кабелей и проверка первого запуска.',
      priceFrom: 2000,
      durationDays: 1,
    },
    {
      id: 'seed-service-upgrade',
      type: 'UPGRADE' as const,
      name: 'Апгрейд ПК',
      description: 'Подбор и установка новых комплектующих с проверкой совместимости с текущей системой.',
      priceFrom: 1500,
      durationDays: 1,
    },
    {
      id: 'seed-service-repair',
      type: 'REPAIR' as const,
      name: 'Ремонт ПК',
      description: 'Диагностика неисправностей, поиск причины проблемы и ремонт компьютера.',
      priceFrom: 1000,
      durationDays: 3,
    },
    {
      id: 'seed-service-maintenance',
      type: 'MAINTENANCE' as const,
      name: 'Обслуживание ПК',
      description: 'Чистка от пыли, обслуживание охлаждения, проверка температур и состояния системы.',
      priceFrom: 1500,
      durationDays: 1,
    },
  ];

  for (const service of services) {
    await prisma.service.upsert({
      where: { id: service.id },
      update: { ...service, isActive: true },
      create: { ...service, isActive: true },
    });
  }

  const portfolioItems = [
    {
      id: 'seed-portfolio-gaming-1440p',
      slug: 'gaming-1440p',
      title: 'Игровой ПК для 1440p',
      clientTask: 'Собрать производительный игровой ПК для современных игр в 1440p.',
      budget: 150000,
      description: 'Сбалансированная игровая сборка с упором на производительность в 1440p.',
      result: 'Готовая система с проверенной совместимостью комплектующих.',
      testing: 'Проверка запуска, температур и стабильности под нагрузкой.',
      imageUrl: 'https://placehold.co/1200x800?text=Gaming+1440p',
    },
    {
      id: 'seed-portfolio-workstation',
      slug: 'workstation-creator',
      title: 'Рабочая станция для тяжёлых задач',
      clientTask: 'Собрать мощный ПК для монтажа, 3D и ресурсоёмких рабочих задач.',
      budget: 230000,
      description: 'Производительная рабочая станция с запасом по памяти и вычислительной мощности.',
      result: 'Система подготовлена к длительным нагрузкам и дальнейшему апгрейду.',
      testing: 'Проверка памяти, накопителя, охлаждения и стабильности.',
      imageUrl: 'https://placehold.co/1200x800?text=Workstation',
    },
    {
      id: 'seed-portfolio-clean-build',
      slug: 'clean-build',
      title: 'Аккуратная сборка с кабель-менеджментом',
      clientTask: 'Получить аккуратно собранный компьютер без лишних кабелей внутри корпуса.',
      budget: 90000,
      description: 'Компактная сборка с аккуратной укладкой кабелей и проверкой всех соединений.',
      result: 'Готовый к работе ПК с чистым внешним видом внутри корпуса.',
      testing: 'Первый запуск и базовая проверка компонентов.',
      imageUrl: 'https://placehold.co/1200x800?text=Clean+Build',
    },
  ];

  for (const item of portfolioItems) {
    const portfolio = await prisma.portfolio.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        clientTask: item.clientTask,
        budget: item.budget,
        description: item.description,
        result: item.result,
        testing: item.testing,
        isPublished: true,
      },
      create: {
        id: item.id,
        slug: item.slug,
        title: item.title,
        clientTask: item.clientTask,
        budget: item.budget,
        description: item.description,
        result: item.result,
        testing: item.testing,
        isPublished: true,
      },
    });

    await prisma.portfolioImage.upsert({
      where: { id: item.id + '-image' },
      update: { url: item.imageUrl, sortOrder: 0 },
      create: {
        id: item.id + '-image',
        portfolioId: portfolio.id,
        url: item.imageUrl,
        sortOrder: 0,
      },
    });
  }

  const reviews = [
    {
      id: 'seed-review-1',
      customerName: 'Алексей',
      text: 'Помогли подобрать комплектующие и собрать ПК без лишних переплат. Всё запустилось с первого раза.',
      rating: 5,
      purchasedBuild: 'Игровой ПК для 1440p',
    },
    {
      id: 'seed-review-2',
      customerName: 'Дмитрий',
      text: 'Хорошо объяснили, какие комплектующие действительно нужны. Сборка аккуратная, температуры в норме.',
      rating: 5,
      purchasedBuild: 'Игровой ПК',
    },
    {
      id: 'seed-review-3',
      customerName: 'Иван',
      text: 'Обратился за апгрейдом старого компьютера. Получил понятный список вариантов и готовый результат.',
      rating: 5,
      purchasedBuild: 'Апгрейд ПК',
    },
  ];

  for (const review of reviews) {
    await prisma.review.upsert({
      where: { id: review.id },
      update: { ...review, isPublished: true },
      create: { ...review, isPublished: true },
    });
  }

  const articles = [
    {
      id: 'seed-article-configurator',
      slug: 'how-to-choose-pc',
      title: 'Как подобрать комплектующие для игрового ПК',
      content: 'Начните с задач и бюджета, затем подберите процессор и видеокарту. После этого проверьте совместимость материнской платы, памяти, корпуса, блока питания и охлаждения.',
    },
    {
      id: 'seed-article-compatibility',
      slug: 'pc-component-compatibility',
      title: 'На что смотреть при проверке совместимости',
      content: 'Ключевые параметры — сокет процессора и платы, тип памяти, форм-фактор корпуса, длина видеокарты, высота охлаждения и мощность блока питания.',
    },
    {
      id: 'seed-article-upgrade',
      slug: 'pc-upgrade-guide',
      title: 'Как понять, что пора обновлять ПК',
      content: 'Апгрейд имеет смысл начинать с компонента, который ограничивает производительность именно в ваших задачах. Перед покупкой важно проверить совместимость новой детали с остальной системой.',
    },
  ];

  for (const article of articles) {
    await prisma.article.upsert({
      where: { slug: article.slug },
      update: {
        title: article.title,
        content: article.content,
        isPublished: true,
        publishedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      create: {
        ...article,
        isPublished: true,
        publishedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    });
  }

  const seo = [
    {
      path: '/',
      title: 'CustomPC — сборка и подбор ПК',
      description: 'Подбор комплектующих, конфигуратор ПК, готовые сборки и услуги по сборке и апгрейду компьютеров.',
      h1: 'Собери ПК под свои задачи',
    },
    {
      path: '/pc',
      title: 'Готовые ПК — CustomPC',
      description: 'Готовые компьютерные сборки для игр, работы и требовательных задач.',
      h1: 'Готовые ПК',
    },
    {
      path: '/configurator',
      title: 'Конфигуратор ПК — CustomPC',
      description: 'Подбери совместимые комплектующие для своего компьютера.',
      h1: 'Конфигуратор ПК',
    },
    {
      path: '/services',
      title: 'Услуги — CustomPC',
      description: 'Сборка, апгрейд, ремонт и обслуживание компьютеров.',
      h1: 'Услуги',
    },
  ];

  for (const item of seo) {
    await prisma.seoMetadata.upsert({
      where: { path: item.path },
      update: item,
      create: item,
    });
  }

  const settings = [
    ['brand_name', 'CustomPC'],
    ['phone', '+7 (900) 000-00-00'],
    ['telegram_url', 'https://t.me/custompc'],
    ['avito_url', 'https://www.avito.ru/'],
    ['email', 'hello@custompc.local'],
    ['city', 'Ваш город'],
  ] as const;

  for (const [key, value] of settings) {
    await prisma.siteSettings.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  // Правила рекомендаций используют реальные componentId из текущей БД.
  const [startCpu, startGpu, startBoard, startRam, startSsd, startPsu, startCase, startCooling] =
    await Promise.all([
      findComponent('AMD', 'Ryzen 5 5600'),
      findComponent('NVIDIA', 'GeForce RTX 4060'),
      findComponent('MSI', 'B550M PRO-VDH'),
      findComponent('Kingston', 'FURY Beast 16GB (2x8GB)'),
      findComponent('Kingston', 'NV2 1TB'),
      findComponent('DeepCool', 'PK600D'),
      findComponent('DeepCool', 'MATREXX 40 3FS'),
      findComponent('DeepCool', 'AG400'),
    ]);

  const [gamingCpu, gamingGpu, gamingBoard, gamingRam, gamingSsd, gamingPsu, gamingCase, gamingCooling] =
    await Promise.all([
      findComponent('AMD', 'Ryzen 5 7600'),
      findComponent('NVIDIA', 'GeForce RTX 4070'),
      findComponent('MSI', 'B650M GAMING PLUS WIFI'),
      findComponent('Kingston', 'FURY Beast 32GB (2x16GB)'),
      findComponent('Kingston', 'KC3000 1TB'),
      findComponent('be quiet!', 'System Power 10 750W'),
      findComponent('DeepCool', 'CH370'),
      findComponent('DeepCool', 'AK400'),
    ]);

  const [proCpu, proGpu, proBoard, proRam, proSsd, proPsu, proCase, proCooling] =
    await Promise.all([
      findComponent('AMD', 'Ryzen 9 7900X'),
      findComponent('NVIDIA', 'GeForce RTX 4080 SUPER'),
      findComponent('ASUS', 'TUF GAMING B650-PLUS WIFI'),
      findComponent('Kingston', 'FURY Beast 64GB (2x32GB)'),
      findComponent('Samsung', '990 PRO 2TB'),
      findComponent('be quiet!', 'Pure Power 12 M 850W'),
      findComponent('Fractal Design', 'Pop Air'),
      findComponent('DeepCool', 'AK620'),
    ]);

  const configuratorRules = [
    {
      id: 'seed-configurator-games-1080p',
      purpose: 'GAMES' as const,
      minBudget: 70000,
      maxBudget: 110000,
      resolution: 'R1080P' as const,
      priority: 'PRICE_PERFORMANCE' as const,
      recommendedComponents: {
        CPU: [startCpu],
        GPU: [startGpu],
        MOTHERBOARD: [startBoard],
        RAM: [startRam],
        SSD: [startSsd],
        PSU: [startPsu],
        CASE: [startCase],
        COOLING: [startCooling],
      },
    },
    {
      id: 'seed-configurator-games-1440p',
      purpose: 'GAMES' as const,
      minBudget: 110000,
      maxBudget: 180000,
      resolution: 'R1440P' as const,
      priority: 'MAX_FPS' as const,
      recommendedComponents: {
        CPU: [gamingCpu],
        GPU: [gamingGpu],
        MOTHERBOARD: [gamingBoard],
        RAM: [gamingRam],
        SSD: [gamingSsd],
        PSU: [gamingPsu],
        CASE: [gamingCase],
        COOLING: [gamingCooling],
      },
    },
    {
      id: 'seed-configurator-universal-4k',
      purpose: 'UNIVERSAL' as const,
      minBudget: 180000,
      maxBudget: 300000,
      resolution: 'R4K' as const,
      priority: 'UPGRADABILITY' as const,
      recommendedComponents: {
        CPU: [proCpu],
        GPU: [proGpu],
        MOTHERBOARD: [proBoard],
        RAM: [proRam],
        SSD: [proSsd],
        PSU: [proPsu],
        CASE: [proCase],
        COOLING: [proCooling],
      },
    },
  ];

  for (const rule of configuratorRules) {
    await prisma.configuratorRule.upsert({
      where: { id: rule.id },
      update: { ...rule, isActive: true },
      create: { ...rule, isActive: true },
    });
  }

  console.log('Демо-контент БД успешно добавлен/обновлён.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
