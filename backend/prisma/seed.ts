import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Dhaka Tesla Pool database...');

  // Clear existing records so the seed is idempotent
  await prisma.rideRequest.deleteMany();
  await prisma.ridePool.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  // Create Driver (Jashim) with his vehicle (Bullet, capacity: 3)
  const jashim = await prisma.user.create({
    data: {
      name: 'Jashim',
      email: 'jashim@tesla.dhaka',
      role: Role.DRIVER,
      isOnline: true,
      vehicles: {
        create: {
          name: 'Bullet',
          capacity: 3,
        },
      },
    },
    include: {
      vehicles: true,
    },
  });

  // Create Passengers (Nusrat, Rafiq, Shirin)
  const nusrat = await prisma.user.create({
    data: {
      name: 'Nusrat',
      email: 'nusrat@banani.dhaka',
      role: Role.PASSENGER,
    },
  });

  const rafiq = await prisma.user.create({
    data: {
      name: 'Rafiq',
      email: 'rafiq@banani.dhaka',
      role: Role.PASSENGER,
    },
  });

  const shirin = await prisma.user.create({
    data: {
      name: 'Shirin',
      email: 'shirin@banani.dhaka',
      role: Role.PASSENGER,
    },
  });

  const vehicleName = jashim.vehicles[0]?.name ?? 'Bullet';
  const vehicleCapacity = jashim.vehicles[0]?.capacity ?? 3;

  console.log('Seed completed successfully:');
  console.log(`- Driver: ${jashim.name} with vehicle "${vehicleName}" (Capacity: ${vehicleCapacity})`);
  console.log(`- Passengers: ${nusrat.name}, ${rafiq.name}, ${shirin.name}`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });