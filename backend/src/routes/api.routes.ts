import { Router } from 'express';
import { createRideRequest, getPassengerRequests, cancelRideRequest } from '../controllers/passenger.controller';
import { getAvailableRequests, acceptRequestIntoPool, updatePoolStatus, getActivePool } from '../controllers/driver.controller';
import { login } from '../controllers/auth.controller';

const router = Router();
router.post('/auth/login', login);
router.post('/requests', createRideRequest);
router.get('/passengers/:passengerId/requests', getPassengerRequests);
router.patch('/requests/:id/cancel', cancelRideRequest);
router.get('/drivers/requests/available', getAvailableRequests);
router.post('/pools/accept', acceptRequestIntoPool);
router.patch('/pools/:poolId/status', updatePoolStatus);
router.get('/drivers/:driverId/active-pool', getActivePool);
export default router;