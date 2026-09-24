import { Router } from 'express';
import {
  createRequest,
  createRideRequest,
  getActivePassengerRequest,
  cancelPassengerRequest,
} from '../controllers/passenger.controller';
import {
  getPendingRequests,
  acceptRequest,
  getActivePool,
  updatePoolStatus,
} from '../controllers/driver.controller';

const router = Router();

// Passenger Routes
router.post('/requests', createRequest);
router.get('/requests/active/:passengerId', getActivePassengerRequest);
router.patch('/requests/:requestId/cancel', cancelPassengerRequest);

// Driver & Pool Routes
router.get('/requests/pending', getPendingRequests);
router.post('/pools/accept', acceptRequest);
router.get('/pools/active/:driverId', getActivePool);
router.patch('/pools/:poolId/status', updatePoolStatus);

export default router;