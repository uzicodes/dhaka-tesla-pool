import request from 'supertest';
import app from '../index';
import { prisma } from '../lib/prisma';

describe('Dhaka Tesla Pool API', () => {
  let driverId: string;
  let passengerId1: string;
  let passengerId2: string;
  let passengerId3: string;

  beforeAll(async () => {
    // Fetch the seeded data
    const driver = await prisma.user.findFirst({ where: { name: 'Jashim' } });
    const p1 = await prisma.user.findFirst({ where: { name: 'Nusrat' } });
    const p2 = await prisma.user.findFirst({ where: { name: 'Rafiq' } });
    const p3 = await prisma.user.findFirst({ where: { name: 'Shirin' } });

    driverId = driver!.id;
    passengerId1 = p1!.id;
    passengerId2 = p2!.id;
    passengerId3 = p3!.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create a ride request with non-pooled fare', async () => {
    const res = await request(app).post('/api/requests').send({
      passengerId: passengerId1,
      pickupLocation: 'Banani',
      dropoffLocation: 'Mohakhali',
      seatsRequested: 1,
    });

    expect(res.status).toBe(201);
    expect(res.body.finalFarePoysha).toBe(18000); // 6000 + 12000 - 0
  });

  it('should enforce vehicle capacity limits (The Concurrency Trap)', async () => {
    // 1. Nusrat requests 2 seats
    const req1 = await request(app).post('/api/requests').send({
      passengerId: passengerId1,
      pickupLocation: 'Banani',
      dropoffLocation: 'Mohakhali',
      seatsRequested: 2,
    });

    // 2. Shirin requests 2 seats (Bullet only has 3 total)
    const req2 = await request(app).post('/api/requests').send({
      passengerId: passengerId3,
      pickupLocation: 'Banani',
      dropoffLocation: 'Gulshan',
      seatsRequested: 2,
    });

    // 3. Jashim accepts Nusrat (Takes 2/3 seats)
    const accept1 = await request(app).post('/api/pools/accept').send({
      driverId,
      requestId: req1.body.id,
    });
    expect(accept1.status).toBe(200);

    // 4. Jashim tries to accept Shirin (Needs 2 seats, but only 1 is left)
    const accept2 = await request(app).post('/api/pools/accept').send({
      driverId,
      requestId: req2.body.id,
    });
    
    expect(accept2.status).toBe(400);
    expect(accept2.body.error).toBe('Vehicle capacity exceeded');
  });
});