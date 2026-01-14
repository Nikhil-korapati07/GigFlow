import mongoose, { Document, Schema } from 'mongoose';

export interface IBid extends Document {
  gigId: mongoose.Types.ObjectId;
  freelancerId: mongoose.Types.ObjectId;
  amount: number;
  message: string;
  status: 'pending' | 'hired' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const BidSchema = new Schema<IBid>(
  {
    gigId: {
      type: Schema.Types.ObjectId,
      ref: 'Gig',
      required: true,
    },
    freelancerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'hired', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Unique index to prevent duplicate bids
BidSchema.index({ gigId: 1, freelancerId: 1 }, { unique: true });

export const Bid = mongoose.model<IBid>('Bid', BidSchema);
