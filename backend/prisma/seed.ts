import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@digitaltickets.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@digitaltickets.com',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
    },
  });

  // Categorías iniciales
  await prisma.category.upsert({
    where: { name: 'Operativo' },
    update: {},
    create: { name: 'Operativo', breakfastCost: 500, lunchCost: 600 },
  });

  await prisma.category.upsert({
    where: { name: 'Profesional' },
    update: {},
    create: { name: 'Profesional', breakfastCost: 1000, lunchCost: 1500 },
  });

  await prisma.category.upsert({
    where: { name: 'Gerencial' },
    update: {},
    create: { name: 'Gerencial', breakfastCost: 1500, lunchCost: 2000 },
  });

  // Horarios iniciales
  await prisma.schedule.upsert({
    where: { mealType: 'DESAYUNO' },
    update: {},
    create: { mealType: 'DESAYUNO', startTime: '07:00', endTime: '10:00' },
  });

  await prisma.schedule.upsert({
    where: { mealType: 'ALMUERZO' },
    update: {},
    create: { mealType: 'ALMUERZO', startTime: '11:30', endTime: '14:00' },
  });

  console.log('Seed ejecutado correctamente');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());