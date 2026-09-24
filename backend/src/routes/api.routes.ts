import { Router } from 'express';
import { createRequest, cancelRequest } from '../controllers/passenger.controller';
import { acceptRide, updatePoolStatus } from '../controllers/driver.controller';

const router = Router();

// Passenger Routes
router.post('/requests', createRequest);
router.patch('/requests/:id/cancel', cancelRequest);

// Driver/Pool Routes
router.post('/pools/accept', acceptRide);
router.patch('/pools/:id/status', updatePoolStatus);

export default router;