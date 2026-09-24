import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { calculateFare } from '../services/fare.service';

export const createRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { passengerId, pickupLocation, dropoffLocation, seatsRequested } = req.body;
    
    const fare = calculateFare(pickupLocation, dropoffLocation, false);

    const request = await prisma.rideRequest.create({
      data: {
        passengerId,
        pickupLocation,
        dropoffLocation,
        seatsRequested,
        baseFarePoysha: fare.baseFarePoysha,
        distanceChargePoysha: fare.distanceChargePoysha,
        poolDiscountPoysha: fare.poolDiscountPoysha,
        finalFarePoysha: fare.finalFarePoysha,
      }
    });

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create request' });
  }
};

export const cancelRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const rideReq = await prisma.rideRequest.findUnique({
      where: { id },
      include: { pool: true }
    });

    if (!rideReq) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }

    if (rideReq.pool && (rideReq.pool.status === 'STARTED' || rideReq.pool.status === 'COMPLETED')) {
      res.status(400).json({ error: 'Cannot cancel a trip that has already started' });
      return;
    }

    const updated = await prisma.rideRequest.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel request' });
  }
};