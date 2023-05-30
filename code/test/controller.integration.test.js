import request from 'supertest';
import { app } from '../app';
import { categories, transactions } from '../models/model';
import mongoose, { Model } from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

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
    const test_categories = [{ type: 'Food', color: 'red' }, { type: 'Transportation', color: 'blue' }, { type: 'Entertainment', color: 'green' }]
    const test_transactions = [
        { username: 'testUser1', amount: 100, category: 'Food', date: '2020-01-01' },
        { username: 'testUser1', amount: 200, category: 'Transportation', date: '2021-01-02' },
        { username: 'testUser1', amount: 300, category: 'Entertainment', date: '2022-01-03' },
        { username: 'testUser2', amount: 100, category: 'Food', date: '2020-01-01' },
        { username: 'testUser2', amount: 200, category: 'Transportation', date: '2021-01-02' },
        { username: 'testUser2', amount: 300, category: 'Entertainment', date: '2022-01-03' },
    ]
    const test_users = [
        { username: 'testUser1', password: 'password', email: 'test1@email.com', role: 'Regular'},
        { username: 'testUser2', password: 'password', email: 'test2@email.com', role: 'Regular'},
    ]

    beforeEach(async () => {
        await User.deleteMany({});
        await transactions.deleteMany({});
        await categories.deleteMany({});
    })

    const generateToken = (payload, expirationTime = '1h') => {
        return jwt.sign(payload, 'EZWALLET', { expiresIn: expirationTime });
    };
    //Route: User
    test('should return non-filtered user transactions', async () => {
        const refreshToken = generateToken(test_users[0], '1h');
        const accessToken = generateToken(test_users[0], '1h');
        const url = '/api/users/' + test_users[0].username + '/transactions';
        const test_result = test_transactions.filter(transaction => transaction.username === test_users[0].username);

        //Create users, transactions, categories
        await User.insertMany(test_users);
        await transactions.insertMany(test_transactions);
        await categories.insertMany(test_categories);

        const response = await request(app).get(url).set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]);

        expect(response.body).toBe();
        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(test_result);
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
