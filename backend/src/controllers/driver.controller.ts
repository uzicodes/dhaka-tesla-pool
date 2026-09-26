import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getPendingRequests = async (req: Request, res: Response): Promise<any> => {
  try {
    const requests = await prisma.rideRequest.findMany({
      where: { status: 'REQUESTED' },
      include: { passenger: true }, // So Jashim can see who requested it
      orderBy: { createdAt: 'asc' }
    });
    return res.json(requests);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch requests' });
  }
};

export const acceptCommuter = async (req: Request, res: Response): Promise<any> => {
  const { driverId, requestId } = req.body;

  try {
    // 1. The Concurrency Trap: Use an Interactive Transaction
    const result = await prisma.$transaction(async (tx) => {
      // Fetch the driver's vehicle inside the transaction to ensure capacity is accurate
      const vehicle = await tx.vehicle.findFirst({ where: { driverId } });
      if (!vehicle) throw new Error('Vehicle not found');

      // Find the request and ensure it's still available
      const pendingRequest = await tx.rideRequest.findUnique({ where: { id: requestId } });
      if (!pendingRequest || pendingRequest.status !== 'REQUESTED') {
        throw new Error('Request is no longer available');
      }

      // Find an active pool for this driver, or create a new one
      let pool = await tx.ridePool.findFirst({
        where: { driverId, status: { in: ['MATCHING', 'DRIVER_ARRIVED', 'STARTED'] } }
      });

      if (!pool) {
        pool = await tx.ridePool.create({
          data: { driverId, vehicleId: vehicle.id, status: 'MATCHING' }
        });
      }

      // Calculate currently occupied seats in this pool
      const currentRequests = await tx.rideRequest.findMany({
        where: { poolId: pool.id, status: { notIn: ['CANCELLED'] } }
      });
      
      const currentClaimedSeats = currentRequests.reduce((sum, req) => sum + req.seatsRequested, 0);

      // Validate Capacity (Hard Limit)
      if (currentClaimedSeats + pendingRequest.seatsRequested > vehicle.capacity) {
        throw new Error('Vehicle capacity exceeded');
      }

      // Update State: Change request to MATCHED and assign to pool
      const updatedRequest = await tx.rideRequest.update({
        where: { id: requestId },
        data: { status: 'MATCHED', poolId: pool.id }
      });

      return { pool, updatedRequest };
    });

    return res.json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const getActivePool = async (req: Request, res: Response): Promise<any> => {
  const { driverId } = req.params;
  try {
    const pool = await prisma.ridePool.findFirst({
      where: {
        driverId,
        status: { in: ['MATCHING', 'DRIVER_ARRIVED', 'STARTED'] }
      },
      include: {
        requests: { include: { passenger: true } }
      }
    });
    return res.json(pool || null);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch active pool' });
  }
};

export const updatePoolStatus = async (req: Request, res: Response): Promise<any> => {
  const { poolId } = req.params;
  const { status } = req.body;

  const validStatuses = ['DRIVER_ARRIVED', 'STARTED', 'COMPLETED', 'CANCELLED'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status transition' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update the Pool
      const updatedPool = await tx.ridePool.update({
        where: { id: poolId },
        data: { status }
      });

      // 2. Cascade the status to all active passenger requests in this pool
      await tx.rideRequest.updateMany({
        where: { poolId, status: { not: 'CANCELLED' } },
        data: { status }
      });

      return updatedPool;
    });

    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update pool status' });
  }
};