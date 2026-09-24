import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

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
    // Storing as integer Poysha to prevent floating point errors
    const baseFarePoysha = 5000; // 50 BDT
    const distanceChargePoysha = 6000; // 60 BDT
    // Apply a 25% discount for agreeing to pool
    const poolDiscountPoysha = Math.round((baseFarePoysha + distanceChargePoysha) * 0.25); 
    const finalFarePoysha = baseFarePoysha + distanceChargePoysha - poolDiscountPoysha;

    // 3. Create the Database Record
    const rideRequest = await prisma.rideRequest.create({
      data: {
        passengerId,
        pickupLocation,
        dropoffLocation,
        seatsRequested,
        status: 'REQUESTED',
        baseFarePoysha,
        distanceChargePoysha,
        poolDiscountPoysha,
        finalFarePoysha
      }
    });

    return res.status(201).json(rideRequest);
  } catch (error) {
    console.error('Error creating ride request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};