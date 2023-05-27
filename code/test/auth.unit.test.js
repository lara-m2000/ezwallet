import request from 'supertest';
import { app } from '../app';
import { User } from '../models/User.js';
import jwt from 'jsonwebtoken';
import { register, registerAdmin, login, logout, isValidBody, isValidEmail } from '../controllers/auth';
const bcrypt = require("bcryptjs")


jest.mock("bcryptjs");
jest.mock('../models/User.js');
jest.mock('jsonwebtoken');

beforeEach(() => {
    jest.clearAllMocks();
})

describe('isValidBody', () => {
    test('returns false if body is missing attributes', () => {
        const body = { username: 'john', password: 'password123' };
        const result = isValidBody(body);
        expect(result).toBe(false);
    });

    test('returns false if body contains empty string', () => {
        const body = { username: 'john', email: '', password: 'password123' };
        const result = isValidBody(body);
        expect(result).toBe(false);
    });

    test('returns true if body contains all necessary attributes', () => {
        const body = { username: 'john', email: 'john@example.com', password: 'password123' };
        const result = isValidBody(body);
        expect(result).toBe(true);
    });
});

describe('isValidEmail', () => {
    test('returns true for a valid email address', () => {
        const validEmails = [
            'test@example.com',
            'john.doe@example.co.uk',
            'user1234@test.domain',
        ];
        validEmails.forEach((email) => {
            const result = isValidEmail(email);
            expect(result).toBe(true);
        });
    });

    test('returns false for an invalid email address', () => {
        const invalidEmails = [
            'invalidemail',
            'test@',
            '@example.com',
            'user@.domain',
        ];
        invalidEmails.forEach((email) => {
            const result = isValidEmail(email);
            expect(result).toBe(false);
        });
    });
});

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
        expect(bcrypt.hash).toHaveBeenCalledWith('password', 12);
        expect(User.create).toHaveBeenCalledWith({
            username: 'testuser',
            email: 'test@example.com',
            password: 'hashedpassword',
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ data: { message: 'user added succesfully' } });
    });

    test("Should return an error message if the user is already registered", async () => {
        // Mock the findOne function to return an existing user
        User.findOne.mockResolvedValue({ username: 'testuser', email: 'test@example.com' });

        await register(req, res);

        // Check if the appropriate functions were called
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'you are already registered' });
    })

    test("Should return an error if an exception occurs", async () => {
        // Mock the findOne function to throw an error
        const err = new Error('Database error');
        User.findOne.mockRejectedValue(err);

        await register(req, res);

        // Check if the appropriate functions were called
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: err.message });
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

    test('should register a new admin user and return a success message', async () => {
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
        expect(bcrypt.hash).toHaveBeenCalledWith('adminpassword', 12);
        expect(User.create).toHaveBeenCalledWith({
            username: 'testadmin',
            email: 'admin@example.com',
            password: 'hashedpassword',
            role: 'Admin',
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ data: { message: 'admin added succesfully' } });
    });

    test('should return an error message if the admin user is already registered', async () => {
        // Mock the findOne function to return an existing user
        User.findOne.mockResolvedValue({ username: 'testadmin', email: 'admin@example.com' });

        await registerAdmin(req, res);

        // Check if the appropriate functions were called
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'you are already registered' });
    });

    test('should return an error if an exception occurs', async () => {
        // Mock the findOne function to throw an error
        const err = new Error('Database error')
        User.findOne.mockRejectedValue(err);

        await registerAdmin(req, res);

        // Check if the appropriate functions were called
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: err.message });
    });
})

describe('login', () => {
    // Define the request and response objects
    let req;
    let res;

    beforeEach(() => {
        req = {
            body: {
                email: 'test@example.com',
                password: 'password',
            },
            cookies: {},
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            cookie: jest.fn(),
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should perform login and return access token and refresh token', async () => {
        // Mock the findOne function to return an existing user
        User.findOne.mockResolvedValue({
            email: 'test@example.com',
            password: 'hashedpassword',
            id: 'user123',
            username: 'testuser',
            role: 'user',
            save: jest.fn(),
        });
        // Mock the compare function to return true (password match)
        bcrypt.compare.mockResolvedValue(true);
        // Mock the sign function to return different token in consecutive calls
        jwt.sign.mockReturnValueOnce('accessToken').mockReturnValueOnce('refreshToken');

        await login(req, res);

        // Check if the appropriate functions were called
        expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hashedpassword');
        expect(jwt.sign).toHaveBeenCalledWith(
            {
                email: 'test@example.com',
                id: 'user123',
                username: 'testuser',
                role: 'user',
            },
            process.env.ACCESS_KEY,
            { expiresIn: '1h' }
        );
        expect(jwt.sign).toHaveBeenCalledWith(
            {
                email: 'test@example.com',
                id: 'user123',
                username: 'testuser',
                role: 'user',
            },
            process.env.ACCESS_KEY,
            { expiresIn: '7d' }
        );
        expect(res.cookie).toHaveBeenCalledWith(
            'accessToken',
            'accessToken',
            {
                httpOnly: true,
                domain: 'localhost',
                path: '/api',
                maxAge: 3600000,
                sameSite: 'none',
                secure: true,
            }
        );
        expect(res.cookie).toHaveBeenCalledWith(
            'refreshToken',
            'refreshToken',
            {
                httpOnly: true,
                domain: 'localhost',
                path: '/api',
                maxAge: 604800000,
                sameSite: 'none',
                secure: true,
            }
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            data: { accessToken: 'accessToken', refreshToken: 'refreshToken' },
        });
    });

    test('should return an error message if the user does not exist', async () => {
        // Mock the findOne function to return null (user not found)
        User.findOne.mockResolvedValue(null);

        await login(req, res);

        // Check if the appropriate functions were called
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'please you need to register' });
    });

    test('should return an error message if the supplied password does not match', async () => {
        // Mock the findOne function to return an existing user
        User.findOne.mockResolvedValue({
            email: 'test@example.com',
            password: 'hashedpassword',
        });
        // Mock the compare function to return false (password does not match)
        bcrypt.compare.mockResolvedValue(false);

        await login(req, res);

        // Check if the appropriate functions were called
        expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hashedpassword');
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'wrong credentials' });
    });

    test('should return an error if an exception occurs', async () => {
        // Mock the findOne function to throw an error
        const err = new Error('Database error');
        User.findOne.mockRejectedValue(err);

        await login(req, res);

        // Check if the appropriate functions were called
        expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: err.message });
    });
})


describe('logout', () => {
    // Define the request and response objects
    let req;
    let res;

    beforeEach(() => {
        req = {
            cookies: {
                refreshToken: 'refreshToken123',
            },
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            cookie: jest.fn(),
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should perform logout and clear cookies', async () => {
        // Mock the findOne function to return an existing user
        User.findOne.mockResolvedValue({
            refreshToken: 'refreshToken123',
            save: jest.fn(),
        });

        await logout(req, res);

        // Check if the appropriate functions were called
        expect(User.findOne).toHaveBeenCalledWith({ refreshToken: 'refreshToken123' });
        expect(res.cookie).toHaveBeenCalledWith(
            'accessToken',
            '',
            {
                httpOnly: true,
                path: '/api',
                maxAge: 0,
                sameSite: 'none',
                secure: true,
            }
        );
        expect(res.cookie).toHaveBeenCalledWith(
            'refreshToken',
            '',
            {
                httpOnly: true,
                path: '/api',
                maxAge: 0,
                sameSite: 'none',
                secure: true,
            }
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ data: { message: 'logged out' } });
    });

    test('should return an error message if the user does not exist', async () => {
        // Mock the findOne function to return null (user not found)
        User.findOne.mockResolvedValue(null);

        await logout(req, res);

        // Check if the appropriate functions were called
        expect(User.findOne).toHaveBeenCalledWith({ refreshToken: 'refreshToken123' });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'user not found' });
    });

    test('should return an error message if there is no refreshToken in the request', async () => {
        //Set refreshToken to undefined
        req.cookies.refreshToken = undefined;

        await logout(req, res);

        // Check if the appropriate functions were called
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'user not found' });
    });

    test('should return an error if an exception occurs', async () => {
        // Mock the findOne function to throw an error
        const err = new Error('Database error');
        User.findOne.mockRejectedValue(err);

        await logout(req, res);

        // Check if the appropriate functions were called
        expect(User.findOne).toHaveBeenCalledWith({ refreshToken: 'refreshToken123' });
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: err.message });
    });
});

