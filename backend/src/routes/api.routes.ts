import { Router } from 'express';
import { createRequest } from '../controllers/passenger.controller';
import { getPendingRequests, acceptRequest } from '../controllers/driver.controller';

const router = Router();

// Passenger Routes
router.post('/requests', createRequest);

// Driver & Pool Routes
router.get('/requests/pending', getPendingRequests);
router.post('/pools/accept', acceptRequest);

export default router;