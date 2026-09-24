import { Router } from 'express';
import { createRequest } from '../controllers/passenger.controller';

const router = Router();

// Passenger Routes
router.post('/requests', createRequest);

export default router;