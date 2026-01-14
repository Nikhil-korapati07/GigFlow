import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    res.status(400).json({ error: err.message });
    return;
  }

  if (err.name === 'CastError') {
    res.status(400).json({ error: 'Invalid ID format' });
    return;
  }

  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    res.status(400).json({ error: 'Duplicate entry' });
    return;
  }

  res.status(500).json({ error: 'Internal server error' });
};
