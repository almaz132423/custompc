import { PrismaClient, LeadStatus, OrderStatusStage, PaymentStatus, Purpose, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'Demo123!';

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // Сотрудники для демонстрации админки и CRM.
  const users = [
    { id: 'demo-user-admin', email: 'admin@custompc.demo', name: 'Алексей Морозов', role: Role.ADMIN },
    { id: 'demo-user-manager', email: 'manager@custompc.demo', name: 'Иван Соколов', role: Role.MANAGER },
    { id: 'demo-user-sales', email: 'sales@custompc.demo', name: 'Мария Орлова', role: Role.MANAGER },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, role: user.role, passwordHash },
      create: { ...user, passwordHash },
    });
  }

  const customers = [
    { id: 'demo-customer-1', name: 'Александр Петров', phone: '+7 900 100-10-01', email: 'alex.petrov@example.com', telegram: '@alex_petrov' },
    { id: 'demo-customer-2', name: 'Дмитрий Волков', phone: '+7 900 100-10-02', email: 'd.volkov@example.com', telegram: '@dvolkov' },
    { id: 'demo-customer-3', name: 'Анна Смирнова', phone: '+7 900 100-10-03', email: 'anna.smirnova@example.com', telegram: '@anna_s' },
    { id: 'demo-customer-4', name: 'Максим Кузнецов', phone: '+7 900 100-10-04', email: 'max.kuznetsov@example.com', telegram: '@max_k' },
    { id: 'demo-customer-5', name: 'Егор Фёдоров', phone: '+7 900 100-10-05', email: 'egor.fedorov@example.com', telegram: '@egor_f' },
    { id: 'demo-customer-6', name: 'Ольга Павлова', phone: '+7 900 100-10-06', email: 'olga.pavlova@example.com', telegram: '@olga_p' },
  ];

  for (const customer of customers) {
    await prisma.customer.upsert({
      where: { id: customer.id },
      update: customer,
      create: customer,
    });
  }

  const builds = await prisma.pCBuild.findMany({
    where: { slug: { in: ['start', 'gaming', 'pro'] } },
    select: { id: true, slug: true, name: true, price: true },
  });
  const buildBySlug = Object.fromEntries(builds.map((build) => [build.slug, build]));

  for (const slug of ['start', 'gaming', 'pro']) {
    if (!buildBySlug[slug]) throw new Error(`Не найдена демо-сборка: ${slug}`);
  }

  const leads = [
    {
      id: 'demo-lead-1', customerId: 'demo-customer-1', name: 'Александр Петров',
      contact: '+7 900 100-10-01', budget: 95000, agreedPrice: null,
      purpose: Purpose.GAMES, category: 'Конфигуратор', pcBuildId: buildBySlug.start.id,
      comment: 'Нужен игровой ПК для 1080p.',
      status: LeadStatus.NEW,
    },
    {
      id: 'demo-lead-2', customerId: 'demo-customer-2', name: 'Дмитрий Волков',
      contact: '@dvolkov', budget: 150000, agreedPrice: 147000,
      purpose: Purpose.GAMES, category: 'Покупка ПК', pcBuildId: buildBySlug.gaming.id,
      comment: 'Согласована цена на готовую игровую сборку.',
      status: LeadStatus.AGREED,
    },
    {
      id: 'demo-lead-3', customerId: 'demo-customer-3', name: 'Анна Смирнова',
      contact: '+7 900 100-10-03', budget: 230000, agreedPrice: 225000,
      purpose: Purpose.THREE_D, category: 'Конфигуратор', pcBuildId: buildBySlug.pro.id,
      comment: 'Рабочая станция для 3D и монтажа.',
      status: LeadStatus.ORDER,
    },
    {
      id: 'demo-lead-4', customerId: 'demo-customer-4', name: 'Максим Кузнецов',
      contact: '@max_k', budget: 70000, agreedPrice: null,
      purpose: Purpose.WORK, category: 'Апгрейд',
      comment: 'Нужно понять, что выгоднее обновить в текущем ПК.',
      status: LeadStatus.IN_PROGRESS,
    },
    {
      id: 'demo-lead-5', customerId: 'demo-customer-5', name: 'Егор Фёдоров',
      contact: '+7 900 100-10-05', budget: 120000, agreedPrice: 115000,
      purpose: Purpose.GAMES, category: 'Покупка ПК',
      comment: 'Клиент ожидает расчёт альтернативных комплектующих.',
      status: LeadStatus.CALCULATED,
    },
    {
      id: 'demo-lead-6', customerId: 'demo-customer-6', name: 'Ольга Павлова',
      contact: '+7 900 100-10-06', budget: 20000, agreedPrice: null,
      purpose: Purpose.WORK, category: 'Ремонт',
      comment: 'Диагностика компьютера, не включается.',
      status: LeadStatus.CONTACTED,
    },
    {
      id: 'demo-lead-7', customerId: 'demo-customer-1', name: 'Александр Петров',
      contact: '+7 900 100-10-01', budget: 90000, agreedPrice: null,
      purpose: Purpose.GAMES, category: 'Общий вопрос',
      comment: 'Отказался от покупки после сравнения вариантов.',
      status: LeadStatus.REJECTED,
    },
    {
      id: 'demo-lead-8', customerId: 'demo-customer-5', name: 'Егор Фёдоров',
      contact: '@egor_f', budget: 180000, agreedPrice: 175000,
      purpose: Purpose.STREAMING, category: 'Конфигуратор', pcBuildId: buildBySlug.gaming.id,
      comment: 'Сборка для игр и стриминга.',
      status: LeadStatus.AGREED,
    },
  ];

  for (const lead of leads) {
    await prisma.lead.upsert({
      where: { id: lead.id },
      update: lead,
      create: lead,
    });
  }

  const leadHistories = [
    ['demo-lead-1', null, LeadStatus.NEW, 'Новая заявка из конфигуратора.'],
    ['demo-lead-2', null, LeadStatus.NEW, 'Заявка получена.'],
    ['demo-lead-2', LeadStatus.NEW, LeadStatus.CONTACTED, 'Связались с клиентом.'],
    ['demo-lead-2', LeadStatus.CONTACTED, LeadStatus.CALCULATED, 'Подготовлен расчёт.'],
    ['demo-lead-2', LeadStatus.CALCULATED, LeadStatus.AGREED, 'Цена согласована.'],
    ['demo-lead-3', null, LeadStatus.NEW, 'Заявка на рабочую станцию.'],
    ['demo-lead-3', LeadStatus.NEW, LeadStatus.CONTACTED, 'Уточнили требования.'],
    ['demo-lead-3', LeadStatus.CONTACTED, LeadStatus.AGREED, 'Согласовали конфигурацию.'],
    ['demo-lead-3', LeadStatus.AGREED, LeadStatus.ORDER, 'Создан заказ.'],
    ['demo-lead-4', null, LeadStatus.NEW, 'Новая заявка на апгрейд.'],
    ['demo-lead-4', LeadStatus.NEW, LeadStatus.IN_PROGRESS, 'Заявка взята в работу.'],
    ['demo-lead-5', null, LeadStatus.NEW, 'Новая заявка.'],
    ['demo-lead-5', LeadStatus.NEW, LeadStatus.CONTACTED, 'Связались с клиентом.'],
    ['demo-lead-5', LeadStatus.CONTACTED, LeadStatus.CALCULATED, 'Подготовлен расчёт.'],
    ['demo-lead-6', null, LeadStatus.NEW, 'Новая заявка на ремонт.'],
    ['demo-lead-6', LeadStatus.NEW, LeadStatus.CONTACTED, 'Клиенту назначена диагностика.'],
    ['demo-lead-7', null, LeadStatus.NEW, 'Новая заявка.'],
    ['demo-lead-7', LeadStatus.NEW, LeadStatus.REJECTED, 'Клиент отказался от заказа.'],
    ['demo-lead-8', null, LeadStatus.NEW, 'Заявка из конфигуратора.'],
    ['demo-lead-8', LeadStatus.NEW, LeadStatus.CONTACTED, 'Уточнены требования к стримингу.'],
    ['demo-lead-8', LeadStatus.CONTACTED, LeadStatus.CALCULATED, 'Подготовлен расчёт.'],
    ['demo-lead-8', LeadStatus.CALCULATED, LeadStatus.AGREED, 'Цена согласована.'],
  ] as const;

  for (let i = 0; i < leadHistories.length; i++) {
    const [leadId, fromStatus, toStatus, comment] = leadHistories[i];
    await prisma.leadStatusHistory.upsert({
      where: { id: `demo-lead-history-${i + 1}` },
      update: { leadId, fromStatus, toStatus, comment },
      create: { id: `demo-lead-history-${i + 1}`, leadId, fromStatus, toStatus, comment },
    });
  }

  const orders = [
    {
      id: 'demo-order-1', number: 'DEMO-2026-0001', leadId: 'demo-lead-3', customerId: 'demo-customer-3',
      totalPrice: 225000, costPrice: 177000, profit: 48000,
      paymentStatus: PaymentStatus.PAID, status: OrderStatusStage.TESTING,
      comment: 'Демо-заказ: рабочая станция.',
      item: { pcBuildId: buildBySlug.pro.id, name: buildBySlug.pro.name, price: 225000, costPrice: 177000 },
    },
    {
      id: 'demo-order-2', number: 'DEMO-2026-0002', leadId: 'demo-lead-2', customerId: 'demo-customer-2',
      totalPrice: 147000, costPrice: 112000, profit: 35000,
      paymentStatus: PaymentStatus.PAID, status: OrderStatusStage.ASSEMBLY,
      comment: 'Демо-заказ: игровой ПК 1440p.',
      item: { pcBuildId: buildBySlug.gaming.id, name: buildBySlug.gaming.name, price: 147000, costPrice: 112000 },
    },
    {
      id: 'demo-order-3', number: 'DEMO-2026-0003', leadId: 'demo-lead-8', customerId: 'demo-customer-5',
      totalPrice: 175000, costPrice: 134000, profit: 41000,
      paymentStatus: PaymentStatus.PARTIALLY_PAID, status: OrderStatusStage.PURCHASING,
      comment: 'Демо-заказ: ПК для игр и стриминга.',
      item: { pcBuildId: buildBySlug.gaming.id, name: buildBySlug.gaming.name, price: 175000, costPrice: 134000 },
    },
    {
      id: 'demo-order-4', number: 'DEMO-2026-0004', leadId: null, customerId: 'demo-customer-4',
      totalPrice: 89990, costPrice: 70000, profit: 19990,
      paymentStatus: PaymentStatus.UNPAID, status: OrderStatusStage.NEW,
      comment: 'Демо-заказ без заявки — для проверки ручного создания заказа.',
      item: { pcBuildId: buildBySlug.start.id, name: buildBySlug.start.name, price: 89990, costPrice: 70000 },
    },
    {
      id: 'demo-order-5', number: 'DEMO-2026-0005', leadId: null, customerId: 'demo-customer-6',
      totalPrice: 2000, costPrice: 500, profit: 1500,
      paymentStatus: PaymentStatus.PAID, status: OrderStatusStage.COMPLETED,
      comment: 'Демо-заказ услуги сборки.',
      item: { pcBuildId: null, name: 'Сборка ПК', price: 2000, costPrice: 500 },
    },
    {
      id: 'demo-order-6', number: 'DEMO-2026-0006', leadId: null, customerId: 'demo-customer-1',
      totalPrice: 150000, costPrice: 114000, profit: 36000,
      paymentStatus: PaymentStatus.PAID, status: OrderStatusStage.READY,
      comment: 'Демо-заказ: готов к выдаче.',
      item: { pcBuildId: buildBySlug.gaming.id, name: buildBySlug.gaming.name, price: 150000, costPrice: 114000 },
    },
  ] as const;

  for (const order of orders) {
    await prisma.order.upsert({
      where: { number: order.number },
      update: {
        leadId: order.leadId,
        customerId: order.customerId,
        totalPrice: order.totalPrice,
        costPrice: order.costPrice,
        profit: order.profit,
        paymentStatus: order.paymentStatus,
        status: order.status,
        comment: order.comment,
      },
      create: {
        id: order.id,
        number: order.number,
        leadId: order.leadId,
        customerId: order.customerId,
        totalPrice: order.totalPrice,
        costPrice: order.costPrice,
        profit: order.profit,
        paymentStatus: order.paymentStatus,
        status: order.status,
        comment: order.comment,
      },
    });

    const dbOrder = await prisma.order.findUniqueOrThrow({ where: { number: order.number } });

    await prisma.orderItem.upsert({
      where: { id: `${order.id}-item-1` },
      update: {
        orderId: dbOrder.id,
        pcBuildId: order.item.pcBuildId,
        name: order.item.name,
        price: order.item.price,
        quantity: 1,
        costPrice: order.item.costPrice,
      },
      create: {
        id: `${order.id}-item-1`,
        orderId: dbOrder.id,
        pcBuildId: order.item.pcBuildId,
        name: order.item.name,
        price: order.item.price,
        quantity: 1,
        costPrice: order.item.costPrice,
      },
    });
  }

  const payments = [
    { id: 'demo-payment-1', orderNumber: 'DEMO-2026-0001', amount: 225000, method: 'CARD', paidAt: '2026-10-01T12:00:00.000Z' },
    { id: 'demo-payment-2', orderNumber: 'DEMO-2026-0002', amount: 147000, method: 'TRANSFER', paidAt: '2026-10-02T14:30:00.000Z' },
    { id: 'demo-payment-3', orderNumber: 'DEMO-2026-0003', amount: 50000, method: 'CARD', paidAt: '2026-10-03T10:15:00.000Z' },
    { id: 'demo-payment-4', orderNumber: 'DEMO-2026-0005', amount: 2000, method: 'CASH', paidAt: '2026-10-04T16:00:00.000Z' },
    { id: 'demo-payment-5', orderNumber: 'DEMO-2026-0006', amount: 150000, method: 'TRANSFER', paidAt: '2026-10-05T11:00:00.000Z' },
  ] as const;

  for (const payment of payments) {
    const order = await prisma.order.findUniqueOrThrow({ where: { number: payment.orderNumber } });
    await prisma.payment.upsert({
      where: { id: payment.id },
      update: { orderId: order.id, amount: payment.amount, method: payment.method, paidAt: new Date(payment.paidAt) },
      create: { id: payment.id, orderId: order.id, amount: payment.amount, method: payment.method, paidAt: new Date(payment.paidAt) },
    });
  }

  const statusSequences: Record<string, { status: OrderStatusStage; comment: string }[]> = {
    'DEMO-2026-0001': [
      { status: OrderStatusStage.NEW, comment: 'Заказ создан.' },
      { status: OrderStatusStage.AWAITING_PAYMENT, comment: 'Ожидалась оплата.' },
      { status: OrderStatusStage.PAID, comment: 'Оплата получена.' },
      { status: OrderStatusStage.PURCHASING, comment: 'Комплектующие заказаны.' },
      { status: OrderStatusStage.COMPONENTS_RECEIVED, comment: 'Комплектующие получены.' },
      { status: OrderStatusStage.ASSEMBLY, comment: 'Сборка завершена.' },
      { status: OrderStatusStage.TESTING, comment: 'Компьютер проходит тестирование.' },
    ],
    'DEMO-2026-0002': [
      { status: OrderStatusStage.NEW, comment: 'Заказ создан.' },
      { status: OrderStatusStage.PAID, comment: 'Оплата получена.' },
      { status: OrderStatusStage.PURCHASING, comment: 'Комплектующие заказаны.' },
      { status: OrderStatusStage.COMPONENTS_RECEIVED, comment: 'Комплектующие получены.' },
      { status: OrderStatusStage.ASSEMBLY, comment: 'ПК находится на сборке.' },
    ],
    'DEMO-2026-0003': [
      { status: OrderStatusStage.NEW, comment: 'Заказ создан.' },
      { status: OrderStatusStage.AWAITING_PAYMENT, comment: 'Ожидалась предоплата.' },
      { status: OrderStatusStage.PARTIALLY_PAID as OrderStatusStage, comment: 'Получена предоплата.' },
      { status: OrderStatusStage.PURCHASING, comment: 'Закупка комплектующих.' },
    ],
    'DEMO-2026-0004': [
      { status: OrderStatusStage.NEW, comment: 'Заказ создан вручную.' },
    ],
    'DEMO-2026-0005': [
      { status: OrderStatusStage.NEW, comment: 'Заказ услуги создан.' },
      { status: OrderStatusStage.PAID, comment: 'Оплата получена.' },
      { status: OrderStatusStage.ASSEMBLY, comment: 'Услуга выполнена.' },
      { status: OrderStatusStage.TESTING, comment: 'Результат проверен.' },
      { status: OrderStatusStage.READY, comment: 'Заказ готов.' },
      { status: OrderStatusStage.ISSUED, comment: 'Заказ выдан клиенту.' },
      { status: OrderStatusStage.COMPLETED, comment: 'Заказ завершён.' },
    ],
    'DEMO-2026-0006': [
      { status: OrderStatusStage.NEW, comment: 'Заказ создан.' },
      { status: OrderStatusStage.PAID, comment: 'Оплата получена.' },
      { status: OrderStatusStage.PURCHASING, comment: 'Комплектующие заказаны.' },
      { status: OrderStatusStage.COMPONENTS_RECEIVED, comment: 'Комплектующие получены.' },
      { status: OrderStatusStage.ASSEMBLY, comment: 'ПК собран.' },
      { status: OrderStatusStage.TESTING, comment: 'Тестирование завершено.' },
      { status: OrderStatusStage.READY, comment: 'Готов к выдаче.' },
    ],
  };

  for (const [orderNumber, sequence] of Object.entries(statusSequences)) {
    const order = await prisma.order.findUniqueOrThrow({ where: { number: orderNumber } });

    for (let i = 0; i < sequence.length; i++) {
      const current = sequence[i];
      const previous = i > 0 ? sequence[i - 1].status : null;

      await prisma.orderStatusHistory.upsert({
        where: { id: `demo-order-history-${orderNumber}-${i + 1}` },
        update: { orderId: order.id, fromStatus: previous, toStatus: current.status, comment: current.comment },
        create: {
          id: `demo-order-history-${orderNumber}-${i + 1}`,
          orderId: order.id,
          fromStatus: previous,
          toStatus: current.status,
          comment: current.comment,
          createdAt: new Date(Date.UTC(2026, 9, 1 + i, 10, 0, 0)),
        },
      });
    }
  }

  console.log('Демо-данные CRM и заказов успешно добавлены/обновлены.');
  console.log(`Демо-пароль сотрудников: ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
