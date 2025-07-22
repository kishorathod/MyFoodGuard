const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/User');
const FoodItem = require('../models/FoodItem');

jest.mock('../services/emailService', () => ({
  sendReportEmail: jest.fn().mockResolvedValue(true),
}));

jest.mock('passport-google-oauth20', () => {
  return {
    Strategy: jest.fn().mockImplementation((opts, verify) => {
      // Simulate Google OAuth callback
      process.nextTick(() => {
        verify(null, { id: 'google123', displayName: 'Test User', emails: [{ value: 'testuser@gmail.com' }] }, (err, user) => {});
      });
      return {};
    }),
  };
});

describe('Full-stack integration tests', () => {
  let mongoServer;
  let agent;
  let userToken;
  let userId;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    agent = request(app);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await User.deleteMany({});
    await FoodItem.deleteMany({});
  });

  it('should register a user via email/password', async () => {
    const res = await agent.post('/api/auth/register').send({
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    userToken = res.body.token;
    userId = res.body.user?._id || res.body._id;
  });

  it('should login a user via email/password', async () => {
    await agent.post('/api/auth/register').send({
      name: 'Test User',
      email: 'testuser2@example.com',
      password: 'password123',
    });
    const res = await agent.post('/api/auth/login').send({
      email: 'testuser2@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('should mock Google OAuth login', async () => {
    // Simulate Google OAuth callback
    // This is a placeholder; actual implementation may differ based on your passport setup
    const res = await agent.get('/api/auth/google/callback?code=dummy');
    expect([200, 302]).toContain(res.status);
  });

  it('should add inventory and return only active items', async () => {
    // Register and login
    const reg = await agent.post('/api/auth/register').send({
      name: 'Test User',
      email: 'invuser@example.com',
      password: 'password123',
    });
    const token = reg.body.token;
    // Add active item
    await agent.post('/api/food').set('Authorization', `Bearer ${token}`).send({
      name: 'Milk',
      quantity: 1,
      expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: 'active',
    });
    // Add consumed item
    await agent.post('/api/food').set('Authorization', `Bearer ${token}`).send({
      name: 'Bread',
      quantity: 1,
      expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: 'consumed',
    });
    // Add expired item
    await agent.post('/api/food').set('Authorization', `Bearer ${token}`).send({
      name: 'Eggs',
      quantity: 1,
      expiryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: 'active',
    });
    // Get inventory (should only return active, not consumed or expired)
    const res = await agent.get('/api/food').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('Milk');
  });

  it('should return all items in analytics route', async () => {
    // Register and login
    const reg = await agent.post('/api/auth/register').send({
      name: 'Test User',
      email: 'analyticsuser@example.com',
      password: 'password123',
    });
    const token = reg.body.token;
    // Add items
    await agent.post('/api/food').set('Authorization', `Bearer ${token}`).send({
      name: 'Milk',
      quantity: 1,
      expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: 'active',
    });
    await agent.post('/api/food').set('Authorization', `Bearer ${token}`).send({
      name: 'Bread',
      quantity: 1,
      expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: 'consumed',
    });
    await agent.post('/api/food').set('Authorization', `Bearer ${token}`).send({
      name: 'Eggs',
      quantity: 1,
      expiryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: 'active',
    });
    // Get analytics (should return all 3)
    const res = await agent.get('/api/analytics').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(3);
  });

  it('should mock email report sending', async () => {
    // Register and login
    const reg = await agent.post('/api/auth/register').send({
      name: 'Test User',
      email: 'reportuser@example.com',
      password: 'password123',
    });
    const token = reg.body.token;
    // Trigger report email
    const res = await agent.post('/api/notifications/send-report').set('Authorization', `Bearer ${token}`).send({
      reportType: 'waste',
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
    });
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
  });
}); 