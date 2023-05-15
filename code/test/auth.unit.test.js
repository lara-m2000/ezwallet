import request from 'supertest';
import { app } from '../app';
import { User } from '../models/User.js';
import jwt from 'jsonwebtoken';
import { register, registerAdmin } from '../controllers/auth';
const bcrypt = require("bcryptjs")


jest.mock("bcryptjs")
jest.mock('../models/User.js');

beforeEach(() => {
    jest.clearAllMocks();
})

describe('register', () => {
    let req;
    let res;

    beforeEach(() => {
        req = {
            body: {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password',
            },
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });
    test('Should register a new user and return a success message', async () => {
        // Mock the findOne function to return null (no existing user)
        User.findOne.mockResolvedValue(undefined);
        // Mock the hash function to return the hashed password
        bcrypt.hash.mockResolvedValue('hashedpassword');
        // Mock the create function to return the newly created user
        User.create.mockResolvedValue({
            username: 'testuser',
            email: 'test@example.com',
            password: 'hashedpassword',
        });

        await register(req, res);

        // Check if the appropriate functions were called
        expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
        expect(bcrypt.hash).toHaveBeenCalledWith('password', 12);
        expect(User.create).toHaveBeenCalledWith({
            username: 'testuser',
            email: 'test@example.com',
            password: 'hashedpassword',
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith('user added succesfully');
    });

    test("Should return an error message if the user is already registered", async () => {
        // Mock the findOne function to return an existing user
        User.findOne.mockResolvedValue({ username: 'testuser', email: 'test@example.com' });

        await register(req, res);

        // Check if the appropriate functions were called
        expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'you are already registered' });
    })

    test("Should return an error if an exception occurs", async () => {
        // Mock the findOne function to throw an error
        User.findOne.mockRejectedValue(new Error('Database error'));

        await register(req, res);

        // Check if the appropriate functions were called
        expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(new Error('Database error'));
    })

});

describe("registerAdmin", () => {
    // Define the request and response objects
    let req;
    let res;

    beforeEach(() => {
        req = {
            body: {
                username: 'testadmin',
                email: 'admin@example.com',
                password: 'adminpassword',
            },
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should register a new admin user and return a success message', async () => {
        // Mock the findOne function to return null (no existing user)
        User.findOne.mockResolvedValue(null);
        // Mock the hash function to return the hashed password
        bcrypt.hash.mockResolvedValue('hashedpassword');
        // Mock the create function to return the newly created user
        User.create.mockResolvedValue({
            username: 'testadmin',
            email: 'admin@example.com',
            password: 'hashedpassword',
            role: 'Admin',
        });

        await registerAdmin(req, res);

        // Check if the appropriate functions were called
        expect(User.findOne).toHaveBeenCalledWith({ email: 'admin@example.com' });
        expect(bcrypt.hash).toHaveBeenCalledWith('adminpassword', 12);
        expect(User.create).toHaveBeenCalledWith({
            username: 'testadmin',
            email: 'admin@example.com',
            password: 'hashedpassword',
            role: 'Admin',
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith('admin added succesfully');
    });

    it('should return an error message if the admin user is already registered', async () => {
        // Mock the findOne function to return an existing user
        User.findOne.mockResolvedValue({ username: 'testadmin', email: 'admin@example.com' });

        await registerAdmin(req, res);

        // Check if the appropriate functions were called
        expect(User.findOne).toHaveBeenCalledWith({ email: 'admin@example.com' });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'you are already registered' });
    });

    it('should return an error if an exception occurs', async () => {
        // Mock the findOne function to throw an error
        User.findOne.mockRejectedValue(new Error('Database error'));

        await registerAdmin(req, res);

        // Check if the appropriate functions were called
        expect(User.findOne).toHaveBeenCalledWith({ email: 'admin@example.com' });
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(new Error('Database error'));
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
