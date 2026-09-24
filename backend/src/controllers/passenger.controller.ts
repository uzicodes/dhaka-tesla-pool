import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { calculateFare } from '../services/fare.service';

const prisma = new PrismaClient();

export const createRequest = async (req: Request, res: Response): Promise<any> => {
  try {
    const { passengerId, pickupLocation, dropoffLocation, seatsRequested } = req.body;

    // 1. Validate Input
    if (!passengerId || !pickupLocation || !dropoffLocation || !seatsRequested) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (seatsRequested < 1 || seatsRequested > 3) {
      return res.status(400).json({ error: 'Seats must be between 1 and 3' });
    }

    // 2. Fare Calculation Model (PRD Section 5)
    // Non-pooled fare calculation upon request creation
    const fare = calculateFare(pickupLocation, dropoffLocation, false);

    // 3. Create the Database Record
    const rideRequest = await prisma.rideRequest.create({
      data: {
        passengerId,
        pickupLocation,
        dropoffLocation,
        seatsRequested,
        status: 'REQUESTED',
        baseFarePoysha: fare.baseFarePoysha,
        distanceChargePoysha: fare.distanceChargePoysha,
        poolDiscountPoysha: fare.poolDiscountPoysha,
        finalFarePoysha: fare.finalFarePoysha
      }
    });

    return res.status(201).json(rideRequest);
  } catch (error) {
    console.error('Error creating ride request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const createRideRequest = createRequest;

export const getActivePassengerRequest = async (req: Request, res: Response): Promise<any> => {
  const { passengerId } = req.params;

  try {
    const activeRequest = await prisma.rideRequest.findFirst({
      where: {
        passengerId,
        status: { in: ['REQUESTED', 'MATCHED', 'DRIVER_ARRIVED', 'STARTED'] },
      },
      include: {
        pool: {
          include: {
            driver: true,
            vehicle: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(activeRequest || null);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch active passenger request' });
  }
};

export const cancelPassengerRequest = async (req: Request, res: Response): Promise<any> => {
  const { requestId } = req.params;

  try {
    const request = await prisma.rideRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Cancellation rule: Allowed only before the ride has physically started
    if (request.status === 'STARTED' || request.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Cannot cancel an ongoing or completed trip' });
    }

    const cancelled = await prisma.rideRequest.update({
      where: { id: requestId },
      data: { status: 'CANCELLED' },
    });

    return res.json(cancelled);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to cancel request' });
  }
};