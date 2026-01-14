import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Bid } from '../models/Bid';
import { Gig } from '../models/Gig';
import mongoose from 'mongoose';

export const createBid = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { gigId } = req.params;
    const { amount, message } = req.body;

    if (!amount || !message) {
      res.status(400).json({ error: 'Amount and message are required' });
      return;
    }

    const gig = await Gig.findById(gigId);
    if (!gig) {
      res.status(404).json({ error: 'Gig not found' });
      return;
    }

    if (gig.status !== 'open') {
      res.status(400).json({ error: 'Cannot bid on closed gig' });
      return;
    }

    const bid = new Bid({
      gigId,
      freelancerId: req.user!.userId,
      amount: Number(amount),
      message,
    });

    await bid.save();
    res.status(201).json({ bid });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'You have already placed a bid on this gig' });
      return;
    }
    res.status(500).json({ error: error.message || 'Failed to create bid' });
  }
};

export const getMyBids = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bids = await Bid.find({ freelancerId: req.user!.userId })
      .populate('gigId', 'title description budget deadline status')
      .sort({ createdAt: -1 });
    res.json({ bids });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bids' });
  }
};
