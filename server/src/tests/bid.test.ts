import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import mongoose from 'mongoose';
import { errorHandler } from '../middleware/errorHandler';
import authRoutes from '../routes/authRoutes';
import gigRoutes from '../routes/gigRoutes';
import bidRoutes from '../routes/bidRoutes';
import { User } from '../models/User';
import { Gig } from '../models/Gig';
import { Bid } from '../models/Bid';

const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use('/api/gigs', gigRoutes);
app.use('/api', bidRoutes);
app.use(errorHandler);

describe('Bid endpoints', () => {
  let clientCookie: string;
  let freelancerCookie: string;
  let freelancer2Cookie: string;
  let clientId: string;
  let freelancerId: string;
  let freelancer2Id: string;
  let gigId: string;

  beforeAll(async () => {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gigflow-test';
    await mongoose.connect(mongoURI);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Gig.deleteMany({});
    await Bid.deleteMany({});

    // Create client
    const clientRes = await request(app).post('/api/auth/register').send({
      email: 'client@test.com',
      password: 'password123',
      role: 'client',
      name: 'Test Client',
    });
    clientCookie = clientRes.headers['set-cookie'][0];
    clientId = clientRes.body.user.id;

    // Create freelancer
    const freelancerRes = await request(app).post('/api/auth/register').send({
      email: 'freelancer@test.com',
      password: 'password123',
      role: 'freelancer',
      name: 'Test Freelancer',
    });
    freelancerCookie = freelancerRes.headers['set-cookie'][0];
    freelancerId = freelancerRes.body.user.id;

    // Create second freelancer
    const freelancer2Res = await request(app).post('/api/auth/register').send({
      email: 'freelancer2@test.com',
      password: 'password123',
      role: 'freelancer',
      name: 'Test Freelancer 2',
    });
    freelancer2Cookie = freelancer2Res.headers['set-cookie'][0];
    freelancer2Id = freelancer2Res.body.user.id;

    // Create gig
    const gigRes = await request(app)
      .post('/api/gigs')
      .set('Cookie', clientCookie)
      .send({
        title: 'Test Gig',
        description: 'Test Description',
        budget: 1000,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        skills: ['React', 'TypeScript'],
      });
    gigId = gigRes.body.gig._id;
  });

  describe('POST /api/gigs/:gigId/bids', () => {
    it('should prevent duplicate bids from same freelancer', async () => {
      // First bid
      const res1 = await request(app)
        .post(`/api/gigs/${gigId}/bids`)
        .set('Cookie', freelancerCookie)
        .send({
          amount: 800,
          message: 'First bid',
        });
      expect(res1.status).toBe(201);

      // Duplicate bid
      const res2 = await request(app)
        .post(`/api/gigs/${gigId}/bids`)
        .set('Cookie', freelancerCookie)
        .send({
          amount: 900,
          message: 'Second bid attempt',
        });
      expect(res2.status).toBe(400);
      expect(res2.body.error).toContain('already placed a bid');
    });
  });
});
