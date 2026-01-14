import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Gig } from '../models/Gig';
import { Bid } from '../models/Bid';
import mongoose from 'mongoose';

export const createGig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, budget, deadline, skills } = req.body;

    if (!title || !description || !budget || !deadline) {
      res.status(400).json({ error: 'All required fields must be provided' });
      return;
    }

    const gig = new Gig({
      title,
      description,
      budget: Number(budget),
      deadline: new Date(deadline),
      skills: skills || [],
      clientId: req.user!.userId,
    });

    await gig.save();
    res.status(201).json({ gig });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create gig' });
  }
};

export const getMyGigs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const gigs = await Gig.find({ clientId: req.user!.userId }).sort({ createdAt: -1 });
    res.json({ gigs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch gigs' });
  }
};

export const getOpenGigs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const gigs = await Gig.find({ status: 'open' }).sort({ createdAt: -1 });
    res.json({ gigs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch open gigs' });
  }
};

export const getGigBids = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { gigId } = req.params;

    const gig = await Gig.findById(gigId);
    if (!gig) {
      res.status(404).json({ error: 'Gig not found' });
      return;
    }

    if (gig.clientId.toString() !== req.user!.userId) {
      res.status(403).json({ error: 'Not authorized to view this gig' });
      return;
    }

    const bids = await Bid.find({ gigId }).populate('freelancerId', 'name email').sort({ createdAt: -1 });
    res.json({ gig, bids });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bids' });
  }
};

export const hireFreelancer = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { gigId, bidId } = req.params;

    const gig = await Gig.findById(gigId).session(session);
    if (!gig) {
      await session.abortTransaction();
      res.status(404).json({ error: 'Gig not found' });
      return;
    }

    if (gig.clientId.toString() !== req.user!.userId) {
      await session.abortTransaction();
      res.status(403).json({ error: 'Not authorized to hire for this gig' });
      return;
    }

    if (gig.status !== 'open') {
      await session.abortTransaction();
      res.status(400).json({ error: 'Gig is already assigned' });
      return;
    }

    const bid = await Bid.findById(bidId).session(session);
    if (!bid) {
      await session.abortTransaction();
      res.status(404).json({ error: 'Bid not found' });
      return;
    }

    if (bid.gigId.toString() !== gigId) {
      await session.abortTransaction();
      res.status(400).json({ error: 'Bid does not belong to this gig' });
      return;
    }

    // Update gig status
    gig.status = 'assigned';
    gig.assignedFreelancerId = bid.freelancerId;
    await gig.save({ session });

    // Update chosen bid
    bid.status = 'hired';
    await bid.save({ session });

    // Reject other bids
    await Bid.updateMany(
      { gigId, _id: { $ne: bidId } },
      { $set: { status: 'rejected' } },
      { session }
    );

    await session.commitTransaction();

    res.json({ message: 'Freelancer hired successfully', gig, bid });
  } catch (error: any) {
    await session.abortTransaction();
    console.error('Hire error:', error);
    res.status(500).json({ error: error.message || 'Failed to hire freelancer' });
  } finally {
    session.endSession();
  }
};
