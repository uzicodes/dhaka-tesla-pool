import request from 'supertest';
import app from '../index';
import { prisma } from '../lib/prisma';

describe('Dhaka Tesla Pool API - Pool Capacity & Discounts', () => {
  let driverId: string;
  let nusratId: string;
  let rafiqId: string;
  let shirinId: string;

  beforeAll(async () => {
    // Fetch seeded users
    const driver = await prisma.user.findFirst({ where: { name: 'Jashim' } });
    const nusrat = await prisma.user.findFirst({ where: { name: 'Nusrat' } });
    const rafiq = await prisma.user.findFirst({ where: { name: 'Rafiq' } });
    const shirin = await prisma.user.findFirst({ where: { name: 'Shirin' } });

    if (!driver || !nusrat || !rafiq || !shirin) {
      throw new Error('Seed data missing');
    }

    driverId = driver.id;
    nusratId = nusrat.id;
    rafiqId = rafiq.id;
    shirinId = shirin.id;
  });

  beforeEach(async () => {
    // Clean up before each test
    await prisma.rideRequest.deleteMany();
    await prisma.ridePool.deleteMany();
  });

  afterAll(async () => {
    await prisma.rideRequest.deleteMany();
    await prisma.ridePool.deleteMany();
    await prisma.$disconnect();
  });

  it('should enforce capacity limits and apply dynamic pool discounts', async () => {
    // 1. Seed three requests
    const reqNusrat = await request(app).post('/api/requests').send({
      passengerId: nusratId,
      pickupLocation: 'Banani',
      dropoffLocation: 'Mohakhali',
      seatsRequested: 1,
    });
    
    const reqRafiq = await request(app).post('/api/requests').send({
      passengerId: rafiqId,
      pickupLocation: 'Banani',
      dropoffLocation: 'Gulshan 1',
      seatsRequested: 1,
    });
    
    const reqShirin = await request(app).post('/api/requests').send({
      passengerId: shirinId,
      pickupLocation: 'Banani',
      dropoffLocation: 'Dhanmondi',
      seatsRequested: 2,
    });

    expect(reqNusrat.status).toBe(201);
    expect(reqRafiq.status).toBe(201);
    expect(reqShirin.status).toBe(201);

    const nusratReqId = reqNusrat.body.id;
    const rafiqReqId = reqRafiq.body.id;
    const shirinReqId = reqShirin.body.id;

    // 2. Accept Nusrat (1 seat)
    const accept1 = await request(app).post('/api/pools/accept').send({
      driverId,
      requestId: nusratReqId,
    });
    expect(accept1.status).toBe(200);

    // 3. Accept Rafiq (1 seat) - This should trigger the discount for both!
    const accept2 = await request(app).post('/api/pools/accept').send({
      driverId,
      requestId: rafiqReqId,
    });
    expect(accept2.status).toBe(200);

    // 4. Try to accept Shirin (2 seats) - Should fail as 1+1+2 = 4 > 3
    const accept3 = await request(app).post('/api/pools/accept').send({
      driverId,
      requestId: shirinReqId,
    });
    
    // Assert HTTP 400 and Capacity message
    expect(accept3.status).toBe(400);
    expect(accept3.body.error).toMatch(/Capacity exceeded/i);

    // Assert via Prisma that Shirin's request remains 'REQUESTED'
    const shirinRecord = await prisma.rideRequest.findUnique({
      where: { id: shirinReqId },
    });
    expect(shirinRecord?.status).toBe('REQUESTED');
    expect(shirinRecord?.poolId).toBeNull();

    // 5. Dynamic Pool Discount Assertion
    const nusratRecord = await prisma.rideRequest.findUnique({
      where: { id: nusratReqId },
    });
    const rafiqRecord = await prisma.rideRequest.findUnique({
      where: { id: rafiqReqId },
    });

    // Discount should be exactly 4000
    expect(nusratRecord?.poolDiscountPoysha).toBe(4000);
    expect(rafiqRecord?.poolDiscountPoysha).toBe(4000);

    // Ensure final fare is correctly decremented
    // finalFarePoysha should equal baseFarePoysha + distanceChargePoysha - poolDiscountPoysha
    expect(nusratRecord?.finalFarePoysha).toBe(
      nusratRecord!.baseFarePoysha + nusratRecord!.distanceChargePoysha - 4000
    );
    expect(rafiqRecord?.finalFarePoysha).toBe(
      rafiqRecord!.baseFarePoysha + rafiqRecord!.distanceChargePoysha - 4000
    );
  });
});
