import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { calculateFare } from '../services/fare.service';

export async function createRideRequest(req: Request, res: Response) {
  try {
    const { passengerId, pickupLocation, dropoffLocation, seatsRequested, paymentMethod } = req.body;
    const fare = calculateFare(pickupLocation, dropoffLocation, false); 

    const rideRequest = await prisma.rideRequest.create({
      data: {
        passengerId, pickupLocation, dropoffLocation,
        seatsRequested: seatsRequested || 1,
        paymentMethod: paymentMethod || 'CASH',
        baseFarePoysha: fare.baseFarePoysha,
        distanceChargePoysha: fare.distanceChargePoysha,
        poolDiscountPoysha: 0,
        finalFarePoysha: fare.finalFarePoysha,
        status: 'REQUESTED'
      },
    });
    return res.status(201).json(rideRequest);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getPassengerRequests(req: Request, res: Response) {
  try {
    const { passengerId } = req.params;
    const requests = await prisma.rideRequest.findMany({
      where: { passengerId },
      include: { pool: { include: { driver: { select: { name: true } }, vehicle: { select: { name: true, capacity: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(requests);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function cancelRideRequest(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const request = await prisma.rideRequest.findUnique({ where: { id } });
    if (!request) return res.status(404).json({ error: 'Not found' });
    if (request.status === 'STARTED' || request.status === 'COMPLETED') return res.status(400).json({ error: 'Cannot cancel' });

    const updated = await prisma.rideRequest.update({
      where: { id },
      data: { status: 'CANCELLED', poolId: null },
    });
    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}