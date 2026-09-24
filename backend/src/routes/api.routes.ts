import { Router } from 'express';
import {
  createRideRequest,
  getPassengerRequests,
  cancelRideRequest,
} from '../controllers/passenger.controller';
import {
  getAvailableRequests,
  getDriverActivePool,
  acceptRequestIntoPool,
  updatePoolStatus,
} from '../controllers/driver.controller';

const router = Router();

// Passenger endpoints
router.post('/requests', createRideRequest);
router.get('/passengers/:passengerId/requests', getPassengerRequests);
router.patch('/requests/:id/cancel', cancelRideRequest);

// Driver & Pool endpoints
router.get('/drivers/requests/available', getAvailableRequests);
router.get('/drivers/:driverId/active-pool', getDriverActivePool);
router.post('/pools/accept', acceptRequestIntoPool);
router.patch('/pools/:poolId/status', updatePoolStatus);

export default router;