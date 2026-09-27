import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { PoolStatus, RequestStatus } from '@prisma/client';

export async function getAvailableRequests(req: Request, res: Response) {
  try {
    const requests = await prisma.rideRequest.findMany({
      where: { status: RequestStatus.REQUESTED },
      include: { passenger: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return res.json(requests);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function acceptRequestIntoPool(req: Request, res: Response) {
  const { driverId, requestId } = req.body;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.findFirst({ where: { driverId } });
      if (!vehicle) throw new Error('No vehicle');
      
      const rideReq = await tx.rideRequest.findUnique({ where: { id: requestId } });
      if (!rideReq || rideReq.status !== RequestStatus.REQUESTED) throw new Error('Unavailable');

      let pool = await tx.ridePool.findFirst({
        where: { driverId, status: PoolStatus.MATCHING },
        include: { requests: { where: { status: { not: RequestStatus.CANCELLED } } } },
      });

      if (!pool) {
        pool = await tx.ridePool.create({
          data: { driverId, vehicleId: vehicle.id, status: PoolStatus.MATCHING },
          include: { requests: true },
        });
      }

      const occupied = pool.requests.reduce((sum, r) => sum + r.seatsRequested, 0);
      if (occupied + rideReq.seatsRequested > vehicle.capacity) throw new Error('Vehicle capacity exceeded');

      const isShared = pool.requests.length > 0;
      const discount = isShared ? 4000 : 0; 

      const updatedReq = await tx.rideRequest.update({
        where: { id: requestId },
        data: { poolId: pool.id, status: RequestStatus.MATCHED, poolDiscountPoysha: discount, finalFarePoysha: { decrement: discount } },
      });

      if (isShared && pool.requests.length === 1) {
         await tx.rideRequest.update({
            where: { id: pool.requests[0].id },
            data: { poolDiscountPoysha: 4000, finalFarePoysha: { decrement: 4000 } }
         });
      }
      return { poolId: pool.id, request: updatedReq };
    });
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}

export async function updatePoolStatus(req: Request, res: Response) {
  const { poolId } = req.params;
  const { status } = req.body as { status: PoolStatus };
  try {
    const updated = await prisma.$transaction(async (tx) => {
      const pool = await tx.ridePool.update({ where: { id: poolId }, data: { status } });
      const statusMap: Record<string, RequestStatus> = {
        DRIVER_ARRIVED: RequestStatus.DRIVER_ARRIVED, STARTED: RequestStatus.STARTED,
        COMPLETED: RequestStatus.COMPLETED, CANCELLED: RequestStatus.CANCELLED,
      };
      if (statusMap[status]) {
        await tx.rideRequest.updateMany({
          where: { poolId, status: { not: RequestStatus.CANCELLED } },
          data: { status: statusMap[status] },
        });
      }
      return pool;
    });
    return res.json(updated);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}

export async function getActivePool(req: Request, res: Response) {
  try {
    const { driverId } = req.params;
    const pool = await prisma.ridePool.findFirst({
      where: {
        driverId,
        status: { in: [PoolStatus.MATCHING, PoolStatus.DRIVER_ARRIVED, PoolStatus.STARTED] }
      },
      include: {
        requests: { 
          include: { passenger: { select: { name: true, email: true } } },
          where: { status: { not: RequestStatus.CANCELLED } }
        },
        vehicle: true
      }
    });
    return res.json(pool || null);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}