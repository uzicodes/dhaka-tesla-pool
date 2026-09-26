import { Router } from 'express';
import {
  createRequest,
  createRideRequest,
  getActivePassengerRequest,
  cancelPassengerRequest,
} from '../controllers/passenger.controller';
import {
  getPendingRequests,
  acceptCommuter,
  getActivePool,
  updatePoolStatus,
} from '../controllers/driver.controller';
import { login } from '../controllers/auth.controller';

const router = Router();

// Auth Routes
router.post('/auth/login', login);

// Passenger Routes
router.post('/requests', createRequest);
router.get('/requests/active/:passengerId', getActivePassengerRequest);
router.patch('/requests/:requestId/cancel', cancelPassengerRequest);

// Driver & Pool Routes
router.get('/requests/pending', getPendingRequests);
router.post('/pools/accept', acceptCommuter);
router.get('/pools/active/:driverId', getActivePool);
router.patch('/pools/:poolId/status', updatePoolStatus);

export default router;