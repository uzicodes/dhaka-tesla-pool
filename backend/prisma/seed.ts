import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Clear existing data to avoid conflicts during multiple runs
  await prisma.rideRequest.deleteMany();
  await prisma.ridePool.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  const jashim = await prisma.user.create({
    data: { name: 'Jashim', email: 'jashim@tesla.com', role: 'DRIVER' }
  });

  await prisma.vehicle.create({
    data: { name: 'Bullet', capacity: 3, driverId: jashim.id }
  });

  await prisma.user.create({ data: { name: 'Nusrat', email: 'nusrat@test.com', role: 'PASSENGER' } });
  await prisma.user.create({ data: { name: 'Rafiq', email: 'rafiq@test.com', role: 'PASSENGER' } });
  await prisma.user.create({ data: { name: 'Shirin', email: 'shirin@test.com', role: 'PASSENGER' } });

  console.log('Database seeded with the RoBenDevs cast!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });