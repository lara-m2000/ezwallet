import request from 'supertest';
import { app } from '../app';
import { User } from '../models/User.js';
import { register, registerAdmin, login, logout } from '../controllers/auth';
import jwt from 'jsonwebtoken';
const bcrypt = require("bcryptjs")
import mongoose, { Model } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

beforeAll(async () => {
  const dbName = "testingDatabaseAuth";
  const url = `${process.env.MONGO_URI}/${dbName}`;

  await mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
});

describe('register', () => {
  test('should register a new user and return success message', async () => {
    const newUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };

    const response = await request(app)
      .post('/api/register')
      .send(newUser);

    // Check the response status code and message
    expect(response.status).toBe(200);
    expect(response.body).toEqual('user added succesfully');
  });

  test('should return an error if the user is already registered', async () => {
    const existingUser = {
      username: 'existinguser',
      email: 'existing@example.com',
      password: 'password123',
    };

    // Register the existing user first
    await request(app)
      .post('/api/register')
      .send(existingUser);

    // Attempt to register the same user again
    const response = await request(app)
      .post('/api/register')
      .send(existingUser);

    // Check the response status code and error message
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'you are already registered' });
  });
});



describe("registerAdmin", () => {
  test('Dummy test, change it', () => {
    expect(true).toBe(true);
  });
})

describe('login', () => {
  test('Dummy test, change it', () => {
    expect(true).toBe(true);
  });
});

describe('logout', () => {
  test('Dummy test, change it', () => {
    expect(true).toBe(true);
  });
});
