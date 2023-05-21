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
  beforeEach(async() => {
    await User.deleteMany();
  })
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
    expect(response.body).toEqual({data: {message: 'user added succesfully'}});
  });

  test('should return an error if the user email is already registered', async () => {
    const user = {
      username: 'existinguser1',
      email: 'existing@example.com',
      password: 'password123',
    };
    const userWithSameEmail = {
      username: 'existinguser2',
      email: 'existing@example.com',
      password: 'password123',
    };
    await User.create(user)
    // Attempt to register the same email again
    const response = await request(app)
      .post('/api/register')
      .send(userWithSameEmail);

    // Check the response status code and error message
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'you are already registered' });
  });

  test('should return an error if the user username is already registered', async () => {
    const user = {
      username: 'existinguser',
      email: 'existing1@example.com',
      password: 'password123',
    };
    const userWithSameUsername = {
      username: 'existinguser',
      email: 'existing2@example.com',
      password: 'password123',
    };
    await User.create(user)
    // Attempt to register the same email again
    const response = await request(app)
      .post('/api/register')
      .send(userWithSameUsername);

    // Check the response status code and error message
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'you are already registered' });
  });

  test('should return an error if the email is not a valid email', async () => {
    const user = {
      username: 'existinguser',
      email: 'notValidEmail.com',
      password: 'password123',
    };
    // Attempt to register with not valid email
    const response = await request(app)
      .post('/api/register')
      .send(user);

    // Check the response status code and error message
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'email is not in the correct format' });
  });
});



describe("registerAdmin", () => {
  beforeEach(async() => {
    await User.deleteMany();
  })
  test('should register a new admin and return success message', async () => {
    const newAdmin = {
      username: 'adminuser',
      email: 'admin@example.com',
      password: 'password123',
    };

    const response = await request(app)
      .post('/api/admin')
      .send(newAdmin);

    // Check the response status code and message
    expect(response.status).toBe(200);
    expect(response.body).toEqual({data:{message:'admin added succesfully'}});
  });

  test('should return an error if the admin email is already registered', async () => {
    const user = {
      username: 'existinguser1',
      email: 'existing@example.com',
      password: 'password123',
    };
    const userWithSameEmail = {
      username: 'existinguser2',
      email: 'existing@example.com',
      password: 'password123',
    };
    await User.create(user)
    // Attempt to register the same email again
    const response = await request(app)
      .post('/api/admin')
      .send(userWithSameEmail);

    // Check the response status code and error message
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'you are already registered' });
  });

  test('should return an error if the admin username is already registered', async () => {
    const user = {
      username: 'existinguser',
      email: 'existing1@example.com',
      password: 'password123',
    };
    const userWithSameUsername = {
      username: 'existinguser',
      email: 'existing2@example.com',
      password: 'password123',
    };
    await User.create(user)
    // Attempt to register the same email again
    const response = await request(app)
      .post('/api/admin')
      .send(userWithSameUsername);

    // Check the response status code and error message
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'you are already registered' });
  });

  test('should return an error if the email is not a valid email', async () => {
    const user = {
      username: 'existinguser',
      email: 'notValidEmail.com',
      password: 'password123',
    };
    // Attempt to register with not valid email
    const response = await request(app)
      .post('/api/admin')
      .send(user);

    // Check the response status code and error message
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'email is not in the correct format' });
  });
})

describe('login', () => {
  test('should log in a user and return access and refresh tokens', async () => {
    const user = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };

    //Create the user in the database
    await User.create(user);

    // Log in the user
    const response = await request(app)
      .post('/api/login')
      .send({email: user.email, password: user.password});

    // Check the response status code and data content
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('accessToken');
    expect(response.body.data).toHaveProperty('refreshToken');
  });

  test('should return an error if the user does not exist', async () => {
    const userCredentials = {
      email: 'nonexistent@example.com',
      password: 'password123',
    };

    const response = await request(app)
      .post('/api/login')
      .send(userCredentials);

    // Check the response status code and error message
    expect(response.status).toBe(400);
    expect(response.body).toEqual({error:'please you need to register'});
  });

  test('should return an error if the password is incorrect', async () => {
    const userCredentials = {
      email: 'test@example.com',
      password: 'wrongpassword',
    };

    const response = await request(app)
      .post('/api/login')
      .send(userCredentials);

    // Check the response status code and error message
    expect(response.status).toBe(400);
    expect(response.body).toEqual({error:'wrong credentials'});
  });
});

describe('logout', () => {
  test('should log out a user and return a success message', async () => {
    // Register and log in the user first
    const registerResponse = await request(app)
      .post('/api/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

    const loginResponse = await request(app)
      .post('/api/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    // Get the refresh token from the login response
    const refreshToken = loginResponse.body.data.refreshToken;

    // Log out the user
    const response = await request(app)
      .get('/api/logout')
      .set('Cookie', [`refreshToken=${refreshToken}`]);

    // Check the response status code and data content
    expect(response.status).toBe(200);
    expect(response.body).toEqual('logged out');
  });

  test('should return an error if the user is not found', async () => {
    // Set an invalid refresh token
    const refreshToken = 'invalid-token';

    const response = await request(app)
      .get('/api/logout')
      .set('Cookie', [`refreshToken=${refreshToken}`]);

    // Check the response status code and error message
    expect(response.status).toBe(400);
    expect(response.body).toEqual('user not found');
  });

  test('should return an error if the refresh token is not provided', async () => {
    const response = await request(app).get('/api/logout');

    // Check the response status code and error message
    expect(response.status).toBe(400);
    expect(response.body).toEqual('user not found');
  });
});
