import { Router } from 'express';
import { createBid, getMyBids } from '../controllers/bidController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.post('/gigs/:gigId/bids', authenticate, authorize('freelancer'), createBid);
router.get('/bids/mine', authenticate, authorize('freelancer'), getMyBids);

export default router;
