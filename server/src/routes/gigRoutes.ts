import { Router } from 'express';
import {
  createGig,
  getMyGigs,
  getOpenGigs,
  getGigBids,
  hireFreelancer,
} from '../controllers/gigController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Client routes
router.post('/', authenticate, authorize('client'), createGig);
router.get('/mine', authenticate, authorize('client'), getMyGigs);
router.get('/:gigId/bids', authenticate, authorize('client'), getGigBids);
router.post('/:gigId/hire/:bidId', authenticate, authorize('client'), hireFreelancer);

// Freelancer routes
router.get('/open', authenticate, authorize('freelancer'), getOpenGigs);

export default router;
