import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { calculateFare } from '../services/fare.service';

const RideRequestSchema = z.object({
  passengerId: z.string().uuid(),
  pickupLocation: z.string().min(2),
  dropoffLocation: z.string().min(2),
  seatsRequested: z.number().int().min(1).max(3).default(1),
});

function getSingleParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] || null;
  }
  return typeof value === 'string' && value.trim() ? value : null;
}

export async function createRideRequest(req: Request, res: Response) {
  try {
    const validated = RideRequestSchema.parse(req.body);
    const fare = calculateFare(validated.pickupLocation, validated.dropoffLocation, true);

    const rideRequest = await prisma.rideRequest.create({
      data: {
        passengerId: validated.passengerId,
        pickupLocation: validated.pickupLocation,
        dropoffLocation: validated.dropoffLocation,
        seatsRequested: validated.seatsRequested,
        baseFarePoysha: fare.baseFarePoysha,
        distanceChargePoysha: fare.distanceChargePoysha,
        poolDiscountPoysha: fare.poolDiscountPoysha,
        finalFarePoysha: fare.finalFarePoysha,
      },
    });

    return res.status(201).json(rideRequest);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export async function getPassengerRequests(req: Request, res: Response) {
  try {
    const passengerId = getSingleParam(req.params.passengerId);
    if (!passengerId) {
      return res.status(400).json({ error: 'Valid passengerId parameter is required' });
    }

    const requests = await prisma.rideRequest.findMany({
      where: { passengerId },
      include: {
        pool: {
          include: {
            driver: { select: { name: true } },
            vehicle: { select: { name: true, capacity: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(requests);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function cancelRideRequest(req: Request, res: Response) {
  try {
    const id = getSingleParam(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Valid request ID is required' });
    }

    const request = await prisma.rideRequest.findUnique({ where: { id } });

    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.status === 'STARTED' || request.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Cannot cancel a trip that has already started' });
    }

    const updated = await prisma.rideRequest.update({
      where: { id },
      data: { status: 'CANCELLED', poolId: null },
    });

    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}