import request from 'supertest';
import { app } from '../app';
import { categories, transactions } from '../models/model';
import mongoose, { Model } from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

beforeAll(async () => {
    const dbName = "testingDatabaseController";
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

describe("createCategory", () => {
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

describe("updateCategory", () => {
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

describe("deleteCategory", () => {
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

describe("getCategories", () => {
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

describe("createTransaction", () => {
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

describe("getAllTransactions", () => {
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

describe("getTransactionsByUser", () => {
    let req, res;
    const test_categories = [{ type: 'Food', color: 'red' }, { type: 'Transportation', color: 'blue' }, { type: 'Entertainment', color: 'green' }]
    const test_transactions = [
        { username: 'user', amount: 100, category: 'Food', date: '2020-01-01' },
        { username: 'user', amount: 200, category: 'Transportation', date: '2021-01-02' },
        { username: 'user', amount: 300, category: 'Entertainment', date: '2022-01-03' }
    ]
    const test_results = [
        { username: 'user', amount: 100, category: 'Food', date: '2020-01-01', color: 'red' },
        { username: 'user', amount: 200, category: 'Transportation', date: '2021-01-02', color: 'blue' },
        { username: 'user', amount: 300, category: 'Entertainment', date: '2022-01-03', color: 'green' },
    ]

    beforeEach(() => {
        req = {
            cookies: {},
            query: {},

        };

        res = {
            cookies: {},
            locals: {},
        };
    })

    const generateToken = (payload, expirationTime = '1h') => {
        return jwt.sign(payload, 'EZWALLET', { expiresIn: expirationTime });
    };
    //Route User
    test('should return non-filtered user transactions', async () => {
        req.cookies.refreshToken = generateToken({ username: 'user', email: 'test@email.com', password: 'password' });
        req.cookies.accessToken = generateToken({ username: 'user', email: 'test@email.com', password: 'password' });
        req.url = 'api/users/user/transactions';
        req.query = {};

        transactions.insertMany(test_transactions);
        categories.insertMany(test_categories);

        const response = await request(app).get(req.url).set('Cookie', [`refreshToken=${req.cookies.refreshToken}`, `accessToken=${req.cookies.accessToken}`]);
        expect(response.status).toBe(200);
        expect(response.body.data).toMatchObject(test_results);
    });
})

describe("getTransactionsByUserByCategory", () => {
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

describe("getTransactionsByGroup", () => {
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

describe("getTransactionsByGroupByCategory", () => {
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

describe("deleteTransaction", () => {
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

describe("deleteTransactions", () => {
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})
