import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { calculateFare } from '../services/fare.service';

export const acceptRide = async (req: Request, res: Response): Promise<void> => {
  try {
    const { driverId, requestId } = req.body;

    // Run as a database transaction to prevent concurrency overbooking
    const result = await prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.findFirst({ where: { driverId } });
      if (!vehicle) throw new Error('Vehicle not found');

      const rideReq = await tx.rideRequest.findUnique({ where: { id: requestId } });
      if (!rideReq) throw new Error('Request not found');

      // Find an active pool or create a new one
      let pool = await tx.ridePool.findFirst({
        where: { driverId, status: { in: ['MATCHING', 'DRIVER_ARRIVED'] } },
        include: { requests: { where: { status: { not: 'CANCELLED' } } } }
      });

      if (!pool) {
        pool = await tx.ridePool.create({
          data: { driverId, vehicleId: vehicle.id, status: 'MATCHING' },
          // Adding this makes the return type match the findFirst query above
          include: { requests: true } 
        });
      }

      // TypeScript now knows pool is definitely not null and has a requests array
      const currentSeats = pool.requests.reduce((sum, r) => sum + r.seatsRequested, 0);

      if (currentSeats + rideReq.seatsRequested > vehicle.capacity) {
        throw new Error('Vehicle capacity exceeded');
      }

      // Recalculate fare as pooled
      const newFare = calculateFare(rideReq.pickupLocation, rideReq.dropoffLocation, true);

      // Update the request to MATCHED and attach it to the pool
      await tx.rideRequest.update({
        where: { id: requestId },
        data: {
          poolId: pool!.id,
          status: 'MATCHED',
          ...newFare
        }
      });

      return pool;
    });

    res.status(200).json({ poolId: result!.id });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updatePoolStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const pool = await prisma.ridePool.update({
      where: { id },
      data: { status }
    });

    // Cascade the status down to all associated passenger requests
    let requestStatus: any = status;
    if (status === 'MATCHING') requestStatus = 'MATCHED';
    
    await prisma.rideRequest.updateMany({
      where: { poolId: id },
      data: { status: requestStatus }
    });

    res.status(200).json(pool);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update pool status' });
  }
};