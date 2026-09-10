import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Можно переопределить email/пароль через переменные окружения:
  // $env:ADMIN_EMAIL="you@example.com"; $env:ADMIN_PASSWORD="your_password"; npx tsx prisma/create-admin.ts
  const email = process.env.ADMIN_EMAIL ?? 'admin@customps.local';
  const password = process.env.ADMIN_PASSWORD ?? 'change_me_123';

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: {
      email,
      passwordHash,
      name: 'Администратор',
      role: 'ADMIN',
    },
  });

  console.log(`Пользователь создан/обновлён: ${user.email} (роль: ${user.role})`);
  console.log(`Пароль: ${password}`);
  console.log('Обязательно поменяй пароль на боевой, когда сайт пойдёт в продакшен.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
