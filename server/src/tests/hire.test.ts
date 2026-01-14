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

describe('Atomic hire concurrency test', () => {
  let clientCookie: string;
  let freelancer1Cookie: string;
  let freelancer2Cookie: string;
  let freelancer3Cookie: string;
  let clientId: string;
  let freelancer1Id: string;
  let freelancer2Id: string;
  let freelancer3Id: string;
  let gigId: string;
  let bid1Id: string;
  let bid2Id: string;
  let bid3Id: string;

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

    // Create freelancers
    const f1Res = await request(app).post('/api/auth/register').send({
      email: 'f1@test.com',
      password: 'password123',
      role: 'freelancer',
      name: 'Freelancer 1',
    });
    freelancer1Cookie = f1Res.headers['set-cookie'][0];
    freelancer1Id = f1Res.body.user.id;

    const f2Res = await request(app).post('/api/auth/register').send({
      email: 'f2@test.com',
      password: 'password123',
      role: 'freelancer',
      name: 'Freelancer 2',
    });
    freelancer2Cookie = f2Res.headers['set-cookie'][0];
    freelancer2Id = f2Res.body.user.id;

    const f3Res = await request(app).post('/api/auth/register').send({
      email: 'f3@test.com',
      password: 'password123',
      role: 'freelancer',
      name: 'Freelancer 3',
    });
    freelancer3Cookie = f3Res.headers['set-cookie'][0];
    freelancer3Id = f3Res.body.user.id;

    // Create gig
    const gigRes = await request(app)
      .post('/api/gigs')
      .set('Cookie', clientCookie)
      .send({
        title: 'Test Gig',
        description: 'Test Description',
        budget: 1000,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        skills: ['React'],
      });
    gigId = gigRes.body.gig._id;

    // Create bids
    const bid1Res = await request(app)
      .post(`/api/gigs/${gigId}/bids`)
      .set('Cookie', freelancer1Cookie)
      .send({ amount: 800, message: 'Bid 1' });
    bid1Id = bid1Res.body.bid._id;

    const bid2Res = await request(app)
      .post(`/api/gigs/${gigId}/bids`)
      .set('Cookie', freelancer2Cookie)
      .send({ amount: 700, message: 'Bid 2' });
    bid2Id = bid2Res.body.bid._id;

    const bid3Res = await request(app)
      .post(`/api/gigs/${gigId}/bids`)
      .set('Cookie', freelancer3Cookie)
      .send({ amount: 900, message: 'Bid 3' });
    bid3Id = bid3Res.body.bid._id;
  });

  it('should only allow one hire to succeed under concurrency', async () => {
    // Simulate concurrent hire attempts
    const hirePromises = [
      request(app)
        .post(`/api/gigs/${gigId}/hire/${bid1Id}`)
        .set('Cookie', clientCookie),
      request(app)
        .post(`/api/gigs/${gigId}/hire/${bid2Id}`)
        .set('Cookie', clientCookie),
      request(app)
        .post(`/api/gigs/${gigId}/hire/${bid3Id}`)
        .set('Cookie', clientCookie),
    ];

    const results = await Promise.all(hirePromises);

    // Only one should succeed (200)
    const successCount = results.filter((r) => r.status === 200).length;
    expect(successCount).toBe(1);

    // Others should fail (400 - gig already assigned)
    const failCount = results.filter((r) => r.status === 400).length;
    expect(failCount).toBe(2);

    // Verify final state
    const gig = await Gig.findById(gigId);
    expect(gig?.status).toBe('assigned');
    expect(gig?.assignedFreelancerId).toBeDefined();

    const bids = await Bid.find({ gigId });
    const hiredBids = bids.filter((b) => b.status === 'hired');
    expect(hiredBids.length).toBe(1);

    const rejectedBids = bids.filter((b) => b.status === 'rejected');
    expect(rejectedBids.length).toBe(2);
  });
});
