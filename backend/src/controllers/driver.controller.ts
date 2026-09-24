import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { PoolStatus, RequestStatus } from '@prisma/client';

function getSingleParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] || null;
  }
  return typeof value === 'string' && value.trim() ? value : null;
}

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

export async function getDriverActivePool(req: Request, res: Response) {
  try {
    const driverId = getSingleParam(req.params.driverId);
    if (!driverId) {
      return res.status(400).json({ error: 'Valid driverId parameter is required' });
    }

    const activePool = await prisma.ridePool.findFirst({
      where: {
        driverId,
        status: { in: [PoolStatus.MATCHING, PoolStatus.DRIVER_ARRIVED, PoolStatus.STARTED] },
      },
      include: {
        vehicle: true,
        requests: {
          where: { status: { not: RequestStatus.CANCELLED } },
          include: { passenger: { select: { name: true } } },
        },
      },
    });
    return res.json(activePool);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Concurrency-Safe: Assigns a passenger to the driver's pool
export async function acceptRequestIntoPool(req: Request, res: Response) {
  const { driverId, requestId } = req.body;

  if (!driverId || typeof driverId !== 'string' || !requestId || typeof requestId !== 'string') {
    return res.status(400).json({ error: 'driverId and requestId must be valid strings' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch vehicle capacity
      const vehicle = await tx.vehicle.findUnique({ where: { driverId } });
      if (!vehicle) throw new Error('Driver has no vehicle registered');

      // 2. Fetch the target request
      const rideReq = await tx.rideRequest.findUnique({ where: { id: requestId } });
      if (!rideReq || rideReq.status !== RequestStatus.REQUESTED) {
        throw new Error('Ride request is no longer available');
      }

      // 3. Find or create an active MATCHING pool for this driver
      let pool = await tx.ridePool.findFirst({
        where: { driverId, status: PoolStatus.MATCHING },
        include: {
          requests: { where: { status: { not: RequestStatus.CANCELLED } } },
        },
      });

      if (!pool) {
        pool = await tx.ridePool.create({
          data: {
            driverId,
            vehicleId: vehicle.id,
            status: PoolStatus.MATCHING,
          },
          include: { requests: true },
        });
      }

      // 4. Capacity Check (Atomic Lock Context)
      const currentOccupiedSeats = pool.requests.reduce(
        (sum, r) => sum + r.seatsRequested,
        0
      );

      if (currentOccupiedSeats + rideReq.seatsRequested > vehicle.capacity) {
        throw new Error(
          `Vehicle capacity exceeded! Only ${vehicle.capacity - currentOccupiedSeats} seats left.`
        );
      }

      // 5. Update request status to MATCHED and link to pool
      const updatedRequest = await tx.rideRequest.update({
        where: { id: requestId },
        data: {
          poolId: pool.id,
          status: RequestStatus.MATCHED,
        },
      });

      return { poolId: pool.id, request: updatedRequest };
    });

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}

export async function updatePoolStatus(req: Request, res: Response) {
  const poolId = getSingleParam(req.params.poolId);
  if (!poolId) {
    return res.status(400).json({ error: 'Valid poolId parameter is required' });
  }

  const { status } = req.body as { status: PoolStatus };

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const pool = await tx.ridePool.update({
        where: { id: poolId },
        data: { status },
      });

      // Synchronize all assigned passenger requests to the matching lifecycle stage
      const mappedRequestStatus: Record<string, RequestStatus> = {
        DRIVER_ARRIVED: RequestStatus.DRIVER_ARRIVED,
        STARTED: RequestStatus.STARTED,
        COMPLETED: RequestStatus.COMPLETED,
        CANCELLED: RequestStatus.CANCELLED,
      };

      if (mappedRequestStatus[status]) {
        await tx.rideRequest.updateMany({
          where: { poolId, status: { not: RequestStatus.CANCELLED } },
          data: { status: mappedRequestStatus[status] },
        });
      }

      return pool;
    });

    return res.json(updated);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}