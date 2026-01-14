import mongoose, { Document, Schema } from 'mongoose';

export interface IGig extends Document {
  title: string;
  description: string;
  budget: number;
  deadline: Date;
  skills: string[];
  status: 'open' | 'assigned' | 'completed';
  clientId: mongoose.Types.ObjectId;
  assignedFreelancerId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GigSchema = new Schema<IGig>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    budget: {
      type: Number,
      required: true,
      min: 0,
    },
    deadline: {
      type: Date,
      required: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['open', 'assigned', 'completed'],
      default: 'open',
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedFreelancerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const Gig = mongoose.model<IGig>('Gig', GigSchema);
