import request from 'supertest';
import { app } from '../app';
import { categories, transactions } from '../models/model';
import mongoose, { Model } from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { verifyAuth } from '../controllers/utils'; //TODO:delete

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
        { username: 'testUser1', amount: 100, type: 'Food', date: '2020-01-01T00:00:00.000Z' },
        { username: 'testUser1', amount: 200, type: 'Transportation', date: '2021-01-02T23:59:59.000Z' },
        { username: 'testUser1', amount: 300, type: 'Entertainment', date: '2022-01-03T00:00:00.000Z' },
        { username: 'testUser1', amount: 100, type: 'Food', date: '2021-05-01T00:00:00.000Z' },
        { username: 'testUser1', amount: 200, type: 'Transportation', date: '2021-05-02T00:00:00.000Z' },
        { username: 'testUser2', amount: 100, type: 'Food', date: '2020-01-01T00:00:00.000Z' },
        { username: 'testUser2', amount: 200, type: 'Transportation', date: '2021-01-02T00:00:00.000Z' },
        { username: 'testUser2', amount: 300, type: 'Entertainment', date: '2022-01-03T00:00:00.000Z' },
    ]
    const test_users = [
        { username: 'testUser1', password: 'password', email: 'test1@email.com', role: 'Regular'},
        { username: 'testUser2', password: 'password', email: 'test2@email.com', role: 'Regular'},
    ]
    const transactions_with_color = [
        { username: 'testUser1', amount: 100, type: 'Food', date: '2020-01-01T00:00:00.000Z', color: 'red' },
        { username: 'testUser1', amount: 200, type: 'Transportation', date: '2021-01-02T23:59:59.000Z', color: 'blue' },
        { username: 'testUser1', amount: 300, type: 'Entertainment', date: '2022-01-03T00:00:00.000Z', color: 'green' },
        { username: 'testUser1', amount: 100, type: 'Food', date: '2021-05-01T00:00:00.000Z', color: 'red' },
        { username: 'testUser1', amount: 200, type: 'Transportation', date: '2021-05-02T00:00:00.000Z', color: 'blue' },
        { username: 'testUser2', amount: 100, type: 'Food', date: '2020-01-01T00:00:00.000Z', color: 'red' },
        { username: 'testUser2', amount: 200, type: 'Transportation', date: '2021-01-02T00:00:00.000Z', color: 'blue' },
        { username: 'testUser2', amount: 300, type: 'Entertainment', date: '2022-01-03T00:00:00.000Z', color: 'green' },
    ]
    //Clean the database before all tests, and set up categories and users
    beforeAll(async () => {
        await User.deleteMany({});
        await transactions.deleteMany({});
        await categories.deleteMany({});
        await User.insertMany(test_users);
        await categories.insertMany(test_categories);
    })
    //Delete all transactions before each test
    beforeEach(async () => {
        await transactions.deleteMany({});
    })
    
    afterAll(async () => {
        await User.deleteMany({});
        await transactions.deleteMany({});
        await categories.deleteMany({});
    });

    const generateToken = (payload, expirationTime = '1h') => {
        return jwt.sign(payload, 'EZWALLET', { expiresIn: expirationTime });
    };
    //Route: User
    test('should return non-filtered user transactions', async () => {
        const refreshToken = generateToken(test_users[0], '1h');
        const accessToken = generateToken(test_users[0], '1h');
        const url = '/api/users/' + test_users[0].username + '/transactions';
        const test_result = transactions_with_color.filter(transaction => transaction.username === test_users[0].username);
        //Create transactions
        await transactions.insertMany(test_transactions);

        const response = await request(app).get(url).set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]);

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(test_result);
    });
    test('should return empty array if there are no user transactions', async () => {
        const refreshToken = generateToken(test_users[0], '1h');
        const accessToken = generateToken(test_users[0], '1h');
        const url = '/api/users/' + test_users[0].username + '/transactions';
        const test_result = [];

        await transactions.insertMany(test_transactions.filter(transaction => transaction.username !== test_users[0].username));

        const response = await request(app).get(url).set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]);

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(test_result);
    });

    //Date filters
    test('should return filtered user transactions based on query param "from"', async () => {
        const refreshToken = generateToken(test_users[0], '1h');
        const accessToken = generateToken(test_users[0], '1h');
        const url = '/api/users/' + test_users[0].username + '/transactions?from=2021-01-01';
        const result = transactions_with_color.filter(transaction => transaction.username === test_users[0].username && transaction.date >= '2021-01-01T00:00:00.000Z');
        
        await transactions.insertMany(test_transactions);

        const response = await request(app).get(url).set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]);

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(result);
    });
    test('should return filtered user transactions based on query param "upTo"', async () => {
        const refreshToken = generateToken(test_users[0], '1h');
        const accessToken = generateToken(test_users[0], '1h');
        const url = '/api/users/' + test_users[0].username + '/transactions?upTo=2021-01-02';
        const result = transactions_with_color.filter(transaction => transaction.username === test_users[0].username && transaction.date <= '2021-01-02T23:59:59.000Z');

        await transactions.insertMany(test_transactions);

        const response = await request(app).get(url).set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]);

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(result);
    });
    test('should return filtered user transactions based on query param "from" and "upTo"', async () => {
        const refreshToken = generateToken(test_users[0], '1h');
        const accessToken = generateToken(test_users[0], '1h');
        const url = '/api/users/' + test_users[0].username + '/transactions?from=2021-01-02&upTo=2021-05-01';
        const result = transactions_with_color.filter(transaction => transaction.username === test_users[0].username && transaction.date >= '2021-01-02T00:00:00.000Z' && transaction.date <= '2021-05-01T23:59:59.000Z');

        await transactions.insertMany(test_transactions);

        const response = await request(app).get(url).set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]);

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(result);
    });
    test('should return filtered user transactions based on query param "date"', async () => {
        const refreshToken = generateToken(test_users[0], '1h');
        const accessToken = generateToken(test_users[0], '1h');
        const url = '/api/users/' + test_users[0].username + '/transactions?date=2022-01-03';
        const result = transactions_with_color.filter(transaction => transaction.username === test_users[0].username && transaction.date === '2022-01-03T00:00:00.000Z');

        await transactions.insertMany(test_transactions);

        const response = await request(app).get(url).set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]);

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(result);
    });
    test('should return an error if date and from are both provided', async () => {
        const refreshToken = generateToken(test_users[0], '1h');
        const accessToken = generateToken(test_users[0], '1h');
        const url = '/api/users/' + test_users[0].username + '/transactions?date=2022-01-03&from=2021-01-01';

        const response = await request(app).get(url).set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]);

        expect(response.status).toBe(500);
        expect(response.body.error).toBe("Cannot set a 'date' filter with a 'from' or 'upTo' filter");
    });
    test('should return an error if date and upTo are both provided', async () => {
        const refreshToken = generateToken(test_users[0], '1h');
        const accessToken = generateToken(test_users[0], '1h');
        const url = '/api/users/' + test_users[0].username + '/transactions?date=2022-01-03&upTo=2022-01-03';

        const response = await request(app).get(url).set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]);

        expect(response.status).toBe(500);
        expect(response.body.error).toBe("Cannot set a 'date' filter with a 'from' or 'upTo' filter");
    });
    test('should return an error if from is a non-valid date string', async () => {
        const refreshToken = generateToken(test_users[0], '1h');
        const accessToken = generateToken(test_users[0], '1h');
        const url = '/api/users/' + test_users[0].username + '/transactions?from=dddddd2021-01-01dddddddd';

        const response = await request(app).get(url).set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]);

        expect(response.status).toBe(500);
        expect(response.body.error).toBe("Wrong date format");
    });
    test('should return an error if upTo is a non-valid date string', async () => {
        const refreshToken = generateToken(test_users[0], '1h');
        const accessToken = generateToken(test_users[0], '1h');
        const url = '/api/users/' + test_users[0].username + '/transactions?upTo=" 2021-01-01"';

        const response = await request(app).get(url).set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]);

        expect(response.status).toBe(500);
        expect(response.body.error).toBe("Wrong date format");
    });
    test('should return an error if date is a non-valid date string', async () => {
        const refreshToken = generateToken(test_users[0], '1h');
        const accessToken = generateToken(test_users[0], '1h');
        const url = '/api/users/' + test_users[0].username + '/transactions?date="20221-01-01"';
        const url2 = '/api/users/' + test_users[0].username + '/transactions?date="2 0221-01-01"';
        const url3 = '/api/users/' + test_users[0].username + '/transactions?date="2021-01-0d1 "';
        const urls = [url, url2, url3]

        urls.forEach(async url => {
            const response = await request(app).get(url).set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]);
            expect(response.status).toBe(500);
            expect(response.body.error).toBe("Wrong date format");
        });
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
