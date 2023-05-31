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
    const test_categories = [{ type: 'Food', color: 'red' }, { type: 'Transportation', color: 'blue' }, { type: 'Entertainment', color: 'green' }]
    //let new_transaction = { username: 'testUser1', amount: 100, type: 'Food' }
    const test_users = [
        { username: 'testUser1', password: 'password', email: 'test1@email.com', role: 'Regular' },
        { username: 'testUser2', password: 'password', email: 'test2@email.com', role: 'Regular' },
        { username: 'testAdmin', password: 'password', email: 'admin@email', role: 'Admin' }
    ]
    
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

    test("Expect to sucessfully create a new transaction", async()=>{
        const refreshToken = generateToken(test_users[0], '1h');
        const accessToken = generateToken(test_users[0], '1h');
        const new_transaction = { username: 'testUser1', amount: 100, type: 'Food' }
    
        const url = `/api/users/${test_users[0].username}/transactions`;
        const response = await request(app)
                .post(url)
                .set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`])
                .send(new_transaction);
        expect(response.status).toBe(200);
        expect(response.body.data.username).toEqual(new_transaction.username);
        expect(response.body.data.amount).toEqual(new_transaction.amount);
        expect(response.body.data.type).toEqual(new_transaction.type);
    })
    describe("Body attributes errors", ()=>{
        const errorMessage="Missing body attributes";

        test("Expect to return an error if 'username' is not given", async()=>{
            const refreshToken = generateToken(test_users[0], '1h');
            const accessToken = generateToken(test_users[0], '1h');
            const new_transaction = { amount: 100, type: 'Food' };
            const url = `/api/users/${test_users[0].username}/transactions`;
            const response = await request(app)
                .post(url)
                .set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`])
                .send(new_transaction);
        
            expect(response.status).toBe(400);
            expect(response.body.error).toEqual(errorMessage);
        })
        test("Expect to return an error if 'username' is empty", async()=>{
            const refreshToken = generateToken(test_users[0], '1h');
            const accessToken = generateToken(test_users[0], '1h');
            const new_transaction = { username: ' ', amount: 100, type: 'Food' };
            const url = `/api/users/${test_users[0].username}/transactions`;
            const response = await request(app)
                .post(url)
                .set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`])
                .send(new_transaction);
            expect(response.status).toBe(400);
            expect(response.body.error).toEqual(errorMessage);
        })
        test("Expect to return an error if 'amount' is empty", async()=>{
            const refreshToken = generateToken(test_users[0], '1h');
            const accessToken = generateToken(test_users[0], '1h');
            const new_transaction = { username: 'testUser1', amount: " ", type: 'Food' };
            const url = `/api/users/${test_users[0].username}/transactions`;
            const response = await request(app)
                .post(url)
                .set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`])
                .send(new_transaction);
            expect(response.status).toBe(400);
            expect(response.body.error).toEqual(errorMessage);
        })
        test("Expect to return an error if 'amount' is not a number", async()=>{
            const refreshToken = generateToken(test_users[0], '1h');
            const accessToken = generateToken(test_users[0], '1h');
            const amounts=["A100", "100A", "100 A", "AAA"];
            const url = `/api/users/${test_users[0].username}/transactions`;
            for(const amount of amounts){
                const new_transaction = { username: test_users[0].username, amount, type: 'Food' }
                const response = await request(app)
                .post(url)
                .set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`])
                .send(new_transaction);
            expect(response.status).toBe(400);
            expect(response.body.error).toEqual("Invalid 'amount' value");
            }
            
        })
    })
    describe("Authorization errors", ()=>{
        test("Expect to ruturn an error if not logged in", async()=>{
            const new_transaction = { username: 'testUser1', amount: 100, type: 'Food' }
        
            const url = `/api/users/${test_users[0].username}/transactions`;
            const response = await request(app)
                    .post(url)
                    .send(new_transaction);
            expect(response.status).toBe(401);
            expect(response.body.error).toBeDefined();
        })
        test("Expected to return an error if logged in, but not as the user in the body", async()=>{
            const refreshToken = generateToken(test_users[0], '1h');
            const accessToken = generateToken(test_users[0], '1h');
            const new_transaction = { username: test_users[1].username, amount: 100, type: 'Food' }
        
            const url = `/api/users/${test_users[0].username}/transactions`;
            const response = await request(app)
                    .post(url)
                    .set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`])
                    .send(new_transaction);
            expect(response.status).toBe(401);
            expect(response.body.error).toBeDefined();
        })
        test("Expected to return an error if logged in, but not as the user in the path", async()=>{
            const refreshToken = generateToken(test_users[0], '1h');
            const accessToken = generateToken(test_users[0], '1h');
            const new_transaction = { username: test_users[0].username, amount: 100, type: 'Food' }
        
            const url = `/api/users/${test_users[1].username}/transactions`;
            const response = await request(app)
                    .post(url)
                    .set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`])
                    .send(new_transaction);
            expect(response.status).toBe(400);
            expect(response.body.error).toEqual("Username mismatch");
        })
    })
    test("Expected to return an error if the user is not found in the database", async()=>{
        // need to pass valid tokens
        const fake_user={ username: 'fake', password: 'password', email: 'fake@email.com', role: 'Regular' };
        const refreshToken = generateToken(fake_user, '1h');
        const accessToken = generateToken(fake_user, '1h');
        const new_transaction = { username: 'fake', amount: 100, type: 'Food' }
    
        const url = `/api/users/${fake_user.username}/transactions`;
        const response = await request(app)
                .post(url)
                .set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`])
                .send(new_transaction);
        expect(response.status).toBe(400);
        expect(response.body.error).toEqual("User not found");
    
    })
    test("Expected to return an error if the category is not found", async()=>{
        const refreshToken = generateToken(test_users[0], '1h');
        const accessToken = generateToken(test_users[0], '1h');
        const new_transaction = { username: test_users[0].username, amount: 100, type: 'Wrong category' }
    
        const url = `/api/users/${test_users[0].username}/transactions`;
        const response = await request(app)
                .post(url)
                .set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`])
                .send(new_transaction);
        expect(response.status).toBe(400);
        expect(response.body.error).toEqual("Category not found");
    
    })
})

describe("getAllTransactions", () => {
    const test_categories = [{ type: 'Food', color: 'red' }, { type: 'Transportation', color: 'blue' }, { type: 'Entertainment', color: 'green' }]
    const test_transactions = [
        { username: 'testUser1', amount: 100, type: 'Food', date: '2020-01-01T00:00:00.000Z' },
        { username: 'testUser1', amount: 200, type: 'Transportation', date: '2021-01-02T23:59:59.000Z' },
        { username: 'testUser1', amount: 300, type: 'Entertainment', date: '2022-01-03T00:00:00.000Z' },
        { username: 'testUser1', amount: 100, type: 'Food', date: '2021-05-01T00:00:00.000Z' },
        { username: 'testUser1', amount: 200, type: 'Transportation', date: '2021-05-02T00:00:00.000Z' },
        { username: 'testUser1', amount: 50, type: 'Food', date: '2021-05-03T00:00:00.000Z' },
        { username: 'testUser1', amount: 77, type: 'Transportation', date: '2021-05-04T00:00:00.000Z'},
        { username: 'testUser1', amount: 88, type: 'Entertainment', date: '2021-05-05T00:00:00.000Z'},
        { username: 'testUser1', amount: 99, type: 'Food', date: '2021-05-06T00:00:00.000Z'},
        { username: 'testUser1', amount: 400, type: 'Food', date: '2020-01-01T00:00:00.000Z'},
        { username: 'testUser1', amount: 500, type: 'Transportation', date: '2021-01-02T23:59:59.000Z'},
        { username: 'testUser2', amount: 100, type: 'Food', date: '2020-01-01T00:00:00.000Z' },
        { username: 'testUser2', amount: 200, type: 'Transportation', date: '2021-01-02T00:00:00.000Z' },
        { username: 'testUser2', amount: 300, type: 'Entertainment', date: '2022-01-03T00:00:00.000Z' },
    ]
    const test_users = [
        { username: 'testUser1', password: 'password', email: 'test1@email.com', role: 'Regular' },
        { username: 'testUser2', password: 'password', email: 'test2@email.com', role: 'Regular' },
        { username: 'testAdmin', password: 'password', email: 'admin@email', role: 'Admin' }
    ]
    const transactions_with_color = [
        { username: 'testUser1', amount: 100, type: 'Food', date: '2020-01-01T00:00:00.000Z', color: 'red' },
        { username: 'testUser1', amount: 200, type: 'Transportation', date: '2021-01-02T23:59:59.000Z', color: 'blue' },
        { username: 'testUser1', amount: 300, type: 'Entertainment', date: '2022-01-03T00:00:00.000Z', color: 'green' },
        { username: 'testUser1', amount: 100, type: 'Food', date: '2021-05-01T00:00:00.000Z', color: 'red' },
        { username: 'testUser1', amount: 200, type: 'Transportation', date: '2021-05-02T00:00:00.000Z', color: 'blue' },
        { username: 'testUser1', amount: 50, type: 'Food', date: '2021-05-03T00:00:00.000Z', color: 'red' },
        { username: 'testUser1', amount: 77, type: 'Transportation', date: '2021-05-04T00:00:00.000Z', color: 'blue' },
        { username: 'testUser1', amount: 88, type: 'Entertainment', date: '2021-05-05T00:00:00.000Z', color: 'green' },
        { username: 'testUser1', amount: 99, type: 'Food', date: '2021-05-06T00:00:00.000Z', color: 'red' },
        { username: 'testUser1', amount: 400, type: 'Food', date: '2020-01-01T00:00:00.000Z', color: 'red' },
        { username: 'testUser1', amount: 500, type: 'Transportation', date: '2021-01-02T23:59:59.000Z', color: 'blue' },
        { username: 'testUser2', amount: 100, type: 'Food', date: '2020-01-01T00:00:00.000Z', color: 'red' },
        { username: 'testUser2', amount: 200, type: 'Transportation', date: '2021-01-02T00:00:00.000Z', color: 'blue' },
        { username: 'testUser2', amount: 300, type: 'Entertainment', date: '2022-01-03T00:00:00.000Z', color: 'green' },
    ]
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
    test('Expect to return a list with all transactions', async () => {
        const refreshToken = generateToken(test_users[2], '1h');
        const accessToken = generateToken(test_users[2], '1h');
        const url = '/api/transactions';
        //Create transactions
        await transactions.insertMany(test_transactions);

        const response = await request(app).get(url).set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]);

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(transactions_with_color);
    
    });
    test('Expect to return an empty list if no transactions are present', async () => {
        const refreshToken = generateToken(test_users[2], '1h');
        const accessToken = generateToken(test_users[2], '1h');
        const url = '/api/transactions';
        
        const response = await request(app).get(url).set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]);

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual([]);
    
    });
    test('Expect to return an error if the user is not an Admin', async () => {
        const refreshToken = generateToken(test_users[0], '1h');
        const accessToken = generateToken(test_users[0], '1h');
        const url = '/api/transactions';
        await transactions.insertMany(test_transactions);

        const response = await request(app).get(url).set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("error")
    
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
        { username: 'testUser1', amount: 50, type: 'Food', date: '2021-05-03T00:00:00.000Z' },
        { username: 'testUser1', amount: 77, type: 'Transportation', date: '2021-05-04T00:00:00.000Z' },
        { username: 'testUser1', amount: 88, type: 'Entertainment', date: '2021-05-05T00:00:00.000Z' },
        { username: 'testUser1', amount: 99, type: 'Food', date: '2021-05-06T00:00:00.000Z' },
        { username: 'testUser1', amount: 400, type: 'Food', date: '2020-01-01T00:00:00.000Z' },
        { username: 'testUser1', amount: 500, type: 'Transportation', date: '2021-01-02T23:59:59.000Z' },
        { username: 'testUser2', amount: 100, type: 'Food', date: '2020-01-01T00:00:00.000Z' },
        { username: 'testUser2', amount: 200, type: 'Transportation', date: '2021-01-02T00:00:00.000Z' },
        { username: 'testUser2', amount: 300, type: 'Entertainment', date: '2022-01-03T00:00:00.000Z' },
    ]
    const test_users = [
        { username: 'testUser1', password: 'password', email: 'test1@email.com', role: 'Regular' },
        { username: 'testUser2', password: 'password', email: 'test2@email.com', role: 'Regular' },
        { username: 'testAdmin', password: 'password', email: 'admin@email', role: 'Admin' }
    ]
    const transactions_with_color = [
        { username: 'testUser1', amount: 100, type: 'Food', date: '2020-01-01T00:00:00.000Z', color: 'red' },
        { username: 'testUser1', amount: 200, type: 'Transportation', date: '2021-01-02T23:59:59.000Z', color: 'blue' },
        { username: 'testUser1', amount: 300, type: 'Entertainment', date: '2022-01-03T00:00:00.000Z', color: 'green' },
        { username: 'testUser1', amount: 100, type: 'Food', date: '2021-05-01T00:00:00.000Z', color: 'red' },
        { username: 'testUser1', amount: 200, type: 'Transportation', date: '2021-05-02T00:00:00.000Z', color: 'blue' },
        { username: 'testUser1', amount: 50, type: 'Food', date: '2021-05-03T00:00:00.000Z', color: 'red' },
        { username: 'testUser1', amount: 77, type: 'Transportation', date: '2021-05-04T00:00:00.000Z', color: 'blue' },
        { username: 'testUser1', amount: 88, type: 'Entertainment', date: '2021-05-05T00:00:00.000Z', color: 'green' },
        { username: 'testUser1', amount: 99, type: 'Food', date: '2021-05-06T00:00:00.000Z', color: 'red' },
        { username: 'testUser1', amount: 400, type: 'Food', date: '2020-01-01T00:00:00.000Z', color: 'red' },
        { username: 'testUser1', amount: 500, type: 'Transportation', date: '2021-01-02T23:59:59.000Z', color: 'blue' },
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
        const url2 = '/api/users/' + test_users[0].username + '/transactions?from="20221-01- 0d1"';
        const url3 = '/api/users/' + test_users[0].username + '/transactions?from="20221 -01-01"';
        const urls = [url, url2, url3];

        for (const url of urls) {
            const response = await request(app).get(url).set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]);
            expect(response.status).toBe(500);
            expect(response.body.error).toBe("Wrong date format");
        }

    });
    test('should return an error if upTo is a non-valid date string', async () => {
        const refreshToken = generateToken(test_users[0], '1h');
        const accessToken = generateToken(test_users[0], '1h');
        const url = '/api/users/' + test_users[0].username + '/transactions?upTo=" 2021-01-01"';
        const url2 = '/api/users/' + test_users[0].username + '/transactions?upTo="2021 01 01 "';
        const url3 = '/api/users/' + test_users[0].username + '/transactions?upTo="202 21-0 d1-01"';
        const urls = [url, url2, url3];

        for (const url of urls) {
            const response = await request(app).get(url).set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]);
            expect(response.status).toBe(500);
            expect(response.body.error).toBe("Wrong date format");
        }
    });
    test('should return an error if date is a non-valid date string', async () => {
        const refreshToken = generateToken(test_users[0], '1h');
        const accessToken = generateToken(test_users[0], '1h');
        const url = '/api/users/' + test_users[0].username + '/transactions?date="20221-01-01"';
        const url2 = '/api/users/' + test_users[0].username + '/transactions?date="2 0221-01-01"';
        const url3 = '/api/users/' + test_users[0].username + '/transactions?date="2021-01-0d1 "';
        const urls = [url, url2, url3]

        for (const url of urls) {
            const response = await request(app).get(url).set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]);
            expect(response.status).toBe(500);
            expect(response.body.error).toBe("Wrong date format");
        }
    });
    //Amount filters
    test('should return filtered user transactions based on query param "min"', async () => {
        const refreshToken = generateToken(test_users[0], '1h');
        const accessToken = generateToken(test_users[0], '1h');
        const baseUrl = '/api/users/' + test_users[0].username + '/transactions?min=';
        const mins = [50, 100, 150, 200, 250, 300, 350, 400, 450, 500];

        await transactions.insertMany(test_transactions);

        for (const min of mins) {
            const response = await request(app).get(baseUrl + min).set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]);
            const result = transactions_with_color.filter(transaction => transaction.amount >= min && transaction.username === test_users[0].username);

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(result);
        }
    });
    test('should return filtered user transactions based on query param "max"', async () => {
        const refreshToken = generateToken(test_users[0], '1h');
        const accessToken = generateToken(test_users[0], '1h');
        const baseUrl = '/api/users/' + test_users[0].username + '/transactions?max=';
        const maxs = [50, 100, 150, 200, 250, 300, 350, 400, 450, 500];

        await transactions.insertMany(test_transactions);

        for (const max of maxs) {
            const response = await request(app).get(baseUrl + max).set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]);
            const result = transactions_with_color.filter(transaction => transaction.amount <= max && transaction.username === test_users[0].username);

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(result);
        }
    });
    test('should return filtered user transactions based on query params "min" and "max"', async () => {
        const refreshToken = generateToken(test_users[0], '1h');
        const accessToken = generateToken(test_users[0], '1h');
        await transactions.insertMany(test_transactions);

        const ranges = [[50, 100], [100, 150], [150, 200], [200, 250], [250, 300], [300, 350], [350, 400], [400, 450], [450, 500]];

        for (const range of ranges) {
            const response = await request(app).get('/api/users/' + test_users[0].username + '/transactions?min=' + range[0] + '&max=' + range[1]).set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]);
            const result = transactions_with_color.filter(transaction => transaction.amount >= range[0] && transaction.amount <= range[1] && transaction.username === test_users[0].username);
            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(result);
        }
    });
    test('should return an error if min is not a number', async () => {
        const refreshToken = generateToken(test_users[0], '1h');
        const accessToken = generateToken(test_users[0], '1h');
        const invalidValues = ["a", "1a", "a", "d7.0a", "4add", "a4.0", "fourty"];

        for (const value of invalidValues) {
            const response = await request(app).get('/api/users/' + test_users[0].username + '/transactions?min=' + value + '&max=1').set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]);
            expect(response.status).toBe(500);
            expect(response.body.error).toBe("Query parameters badly formatted");
        }
    });
    test('should return an error if max is not a number', async () => {
        const refreshToken = generateToken(test_users[0], '1h');
        const accessToken = generateToken(test_users[0], '1h');
        const invalidValues = ["12 3", "1a", "167..0", "d7.0a", "4add", "a4.0", "fourty"];

        for (const value of invalidValues) {
            const response = await request(app).get('/api/users/' + test_users[0].username + '/transactions?max=' + value + '&min=1').set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]);
            expect(response.status).toBe(500);
            expect(response.body.error).toBe("Query parameters badly formatted");
        }
    });
    test('should return an empty transactions array if min is greater than max', async () => {
        const refreshToken = generateToken(test_users[0], '1h');
        const accessToken = generateToken(test_users[0], '1h');

        const response = await request(app).get('/api/users/' + test_users[0].username + '/transactions?min=100&max=50').set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]);
        expect(response.status).toBe(200);
        expect(response.body.data).toEqual([]);
    });
    //Mixed filters
    test('should return filtered user transactions based on query params "min", "max", "from" and "upTo"', async () => {
        const refreshToken = generateToken(test_users[0], '1h');
        const accessToken = generateToken(test_users[0], '1h');

        const filters = [{ min: 50, max: 100, from: "2021-01-01", upTo: "2023-01-01" }, { min: 100, max: 150, from: "2020-01-01", upTo: "2022-01-01" }, { min: 150, max: 200, from: "2019-01-01", upTo: "2021-01-01" }, { min: 200, max: 250, from: "2018-01-01", upTo: "2020-01-01" }, { min: 250, max: 300, from: "2017-01-01", upTo: "2019-01-01" }, { min: 300, max: 350, from: "2016-01-01", upTo: "2018-01-01" }, { min: 350, max: 400, from: "2015-01-01", upTo: "2017-01-01" }, { min: 400, max: 450, from: "2014-01-01", upTo: "2016-01-01" }, { min: 450, max: 500, from: "2013-01-01", upTo: "2015-01-01" }];

        await transactions.insertMany(test_transactions);

        for (const filter of filters) {
            const response = await request(app).get('/api/users/' + test_users[0].username + '/transactions?min=' + filter.min + '&max=' + filter.max + '&from=' + filter.from + '&upTo=' + filter.upTo).set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]);
            const result = transactions_with_color.filter(transaction => transaction.amount >= filter.min && transaction.amount <= filter.max && transaction.username === test_users[0].username && transaction.date >= filter.from && transaction.date <= filter.upTo);
            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(result);
        }

    });
    //Authorizations
    test('should return an error if the user is not the owner of the transactions', async () => {
        const refreshToken = generateToken(test_users[1], '1h');
        const accessToken = generateToken(test_users[1], '1h');

        const response = await request(app).get('/api/users/' + test_users[0].username + '/transactions').set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]);
        expect(response.status).toBe(401);
        expect(response.body.error).toBe("You cannot request info about another user");
    });
    test('should return an error if users is not logged in', async () => {
        const response = await request(app).get('/api/users/' + test_users[0].username + '/transactions');
        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Unauthorized");
    });
    //Route admin
    test('should return all transactions of the requested user if the user is admin', async () => {
        const refreshToken = generateToken(test_users[2], '1h');
        const accessToken = generateToken(test_users[2], '1h');

        await transactions.insertMany(test_transactions);

        const response = await request(app).get('/api/transactions/users/' + test_users[0].username).set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]);
        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(transactions_with_color.filter(transaction => transaction.username === test_users[0].username));
    });
    test('should return all transactions of the requested user if the user is admin even if query params are provided', async () => {
        const refreshToken = generateToken(test_users[2], '1h');
        const accessToken = generateToken(test_users[2], '1h');

        await transactions.insertMany(test_transactions);

        const response = await request(app).get('/api/transactions/users/' + test_users[0].username + '?min=50&max=100&from=2021-01-01&upTo=2023-01-01').set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]);
        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(transactions_with_color.filter(transaction => transaction.username === test_users[0].username));
    });
    test('should return empty array if there no transactions of the requested user and the user is admin', async () => {
        const refreshToken = generateToken(test_users[2], '1h');
        const accessToken = generateToken(test_users[2], '1h');

        const response = await request(app).get('/api/transactions/users/' + test_users[0].username).set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]);
        expect(response.status).toBe(200);
        expect(response.body.data).toEqual([]);
    });
    //Authorizations
    test('should return an error if the user is not admin', async () => {
        const refreshToken = generateToken(test_users[0], '1h');
        const accessToken = generateToken(test_users[0], '1h');

        const response = await request(app).get('/api/transactions/users/' + test_users[0].username).set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]);
        expect(response.status).toBe(401);
        expect(response.body.error).toBe("You need to be admin to perform this action");
    });
    test('should return an error if the user does not exist and route is admin route', async () => {
        const refreshToken = generateToken(test_users[2], '1h');
        const accessToken = generateToken(test_users[2], '1h');

        const response = await request(app).get('/api/transactions/users/nonExistentUsername').set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]);
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("User not found");
    });
    test('should return an error if users is not logged in', async () => {
        const response = await request(app).get('/api/transactions/users/' + test_users[0].username);
        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Unauthorized");
    });

    //Other errors
    test('should not let an admin through user route', async () => {
        const refreshToken = generateToken(test_users[2], '1h');
        const accessToken = generateToken(test_users[2], '1h');

        const response = await request(app).get('/api/users/' + test_users[0].username + '/transactions').set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]);
        expect(response.status).toBe(401);
        expect(response.body.error).toBe("You cannot request info about another user");
    });
    test('should not let a user through admin route', async () => {
        const refreshToken = generateToken(test_users[0], '1h');
        const accessToken = generateToken(test_users[0], '1h');

        const response = await request(app).get('/api/transactions/users/' + test_users[0].username).set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]);
        expect(response.status).toBe(401);
        expect(response.body.error).toBe("You need to be admin to perform this action");
    });


})

describe("getTransactionsByUserByCategory", () => {
    const test_categories = [{ type: 'Food', color: 'red' }, { type: 'Transportation', color: 'blue' }, { type: 'Entertainment', color: 'green' }]
    const test_transactions = [
        { username: 'testUser1', amount: 100, type: 'Food', date: '2020-01-01T00:00:00.000Z' },
        { username: 'testUser1', amount: 200, type: 'Transportation', date: '2021-01-02T23:59:59.000Z' },
        { username: 'testUser1', amount: 300, type: 'Entertainment', date: '2022-01-03T00:00:00.000Z' },
        { username: 'testUser1', amount: 100, type: 'Food', date: '2021-05-01T00:00:00.000Z' },
        { username: 'testUser1', amount: 200, type: 'Transportation', date: '2021-05-02T00:00:00.000Z' },
        { username: 'testUser1', amount: 50, type: 'Food', date: '2021-05-03T00:00:00.000Z' },
        { username: 'testUser1', amount: 77, type: 'Transportation', date: '2021-05-04T00:00:00.000Z' },
        { username: 'testUser1', amount: 88, type: 'Entertainment', date: '2021-05-05T00:00:00.000Z' },
        { username: 'testUser1', amount: 99, type: 'Food', date: '2021-05-06T00:00:00.000Z' },
        { username: 'testUser1', amount: 400, type: 'Food', date: '2020-01-01T00:00:00.000Z' },
        { username: 'testUser1', amount: 500, type: 'Transportation', date: '2021-01-02T23:59:59.000Z' },
        { username: 'testUser2', amount: 100, type: 'Food', date: '2020-01-01T00:00:00.000Z' },
        { username: 'testUser2', amount: 200, type: 'Transportation', date: '2021-01-02T00:00:00.000Z' },
        { username: 'testUser2', amount: 300, type: 'Entertainment', date: '2022-01-03T00:00:00.000Z' },
    ]
    const test_users = [
        { username: 'testUser1', password: 'password', email: 'test1@email.com', role: 'Regular' },
        { username: 'testUser2', password: 'password', email: 'test2@email.com', role: 'Regular' },
        { username: 'testAdmin', password: 'password', email: 'admin@email', role: 'Admin' }
    ]
    const transactions_with_color = [
        { username: 'testUser1', amount: 100, type: 'Food', date: '2020-01-01T00:00:00.000Z', color: 'red' },
        { username: 'testUser1', amount: 200, type: 'Transportation', date: '2021-01-02T23:59:59.000Z', color: 'blue' },
        { username: 'testUser1', amount: 300, type: 'Entertainment', date: '2022-01-03T00:00:00.000Z', color: 'green' },
        { username: 'testUser1', amount: 100, type: 'Food', date: '2021-05-01T00:00:00.000Z', color: 'red' },
        { username: 'testUser1', amount: 200, type: 'Transportation', date: '2021-05-02T00:00:00.000Z', color: 'blue' },
        { username: 'testUser1', amount: 50, type: 'Food', date: '2021-05-03T00:00:00.000Z', color: 'red' },
        { username: 'testUser1', amount: 77, type: 'Transportation', date: '2021-05-04T00:00:00.000Z', color: 'blue' },
        { username: 'testUser1', amount: 88, type: 'Entertainment', date: '2021-05-05T00:00:00.000Z', color: 'green' },
        { username: 'testUser1', amount: 99, type: 'Food', date: '2021-05-06T00:00:00.000Z', color: 'red' },
        { username: 'testUser1', amount: 400, type: 'Food', date: '2020-01-01T00:00:00.000Z', color: 'red' },
        { username: 'testUser1', amount: 500, type: 'Transportation', date: '2021-01-02T23:59:59.000Z', color: 'blue' },
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

    test('should return all transactions of a user filtered by given category', async () => {
        const refreshToken = generateToken(test_users[0], '1h');
        const accessToken = generateToken(test_users[0], '1h');

        await transactions.insertMany(test_transactions);

        for (const category of test_categories) {
            let url = '/api/users/' + test_users[0].username + '/transactions/category/' + category.type;
            const response = await request(app).get(url).set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]);
            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(transactions_with_color.filter(transaction => transaction.type === category.type && transaction.username === test_users[0].username));
        }
    });
    test('should return empty array if there are no transactions for the user in the given category', async () => {
        const refreshToken = generateToken(test_users[0], '1h');
        const accessToken = generateToken(test_users[0], '1h');

        await transactions.insertMany(test_transactions.filter(transaction => transaction.type !== 'Food'));

        let url = '/api/users/' + test_users[0].username + '/transactions/category/Food';
        const response = await request(app).get(url).set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]);
        expect(response.status).toBe(200);
        expect(response.body.data).toEqual([]);
    });
    test('should return error 400 if category does not exist', async () => {
        const refreshToken = generateToken(test_users[0], '1h');
        const accessToken = generateToken(test_users[0], '1h');

        await transactions.insertMany(test_transactions);

        let url = '/api/users/' + test_users[0].username + '/transactions/category/InvalidCategory';
        const response = await request(app).get(url).set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]);
        expect(response.status).toBe(400);
        expect(response.body.error).toEqual('Category not found');
    });
    test('should return error 401 if called by an authenticated user that is not the owner of the transactions', async () => {
        const refreshToken = generateToken(test_users[0], '1h');
        const accessToken = generateToken(test_users[0], '1h');

        await transactions.insertMany(test_transactions);

        let url = '/api/users/' + test_users[1].username + '/transactions/category/Food';
        const response = await request(app).get(url).set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]);
        expect(response.status).toBe(401);
        expect(response.body.error).toEqual('You cannot request info about another user');
    });
    test('should return error 401 if called by an unauthenticated user', async () => {
        await transactions.insertMany(test_transactions);

        let url = '/api/users/' + test_users[0].username + '/transactions/category/Food';
        const response = await request(app).get(url);
        expect(response.status).toBe(401);
        expect(response.body.error).toEqual('Unauthorized');
    });
    //Admin route
    test('should return all transactions of the requested user with given category, asked by admin', async () => {
        const refreshToken = generateToken(test_users[2], '1h');
        const accessToken = generateToken(test_users[2], '1h');

        await transactions.insertMany(test_transactions);

        for (const category of test_categories) {
            let url = '/api/transactions/users/' + test_users[0].username + '/category/' + category.type;
            const response = await request(app).get(url).set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]);
            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(transactions_with_color.filter(transaction => transaction.type === category.type && transaction.username === test_users[0].username));
        }
    });
    test('should return empty array if there are no transactions for the requested user in the given category, asked by admin', async () => {
        const refreshToken = generateToken(test_users[2], '1h');
        const accessToken = generateToken(test_users[2], '1h');

        await transactions.insertMany(test_transactions.filter(transaction => transaction.type !== 'Food'));

        let url = '/api/transactions/users/' + test_users[0].username + '/category/Food';
        const response = await request(app).get(url).set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]);
        expect(response.status).toBe(200);
        expect(response.body.data).toEqual([]);
    });
    test('should return error 400 if category does not exist, asked by admin', async () => {
        const refreshToken = generateToken(test_users[2], '1h');
        const accessToken = generateToken(test_users[2], '1h');

        await transactions.insertMany(test_transactions);

        let url = '/api/transactions/users/' + test_users[0].username + '/category/InvalidCategory';
        const response = await request(app).get(url).set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]);
        expect(response.status).toBe(400);
        expect(response.body.error).toEqual('Category not found');
    });
    test('should return error 400 if user does not exist, asked by admin', async () => {
        const refreshToken = generateToken(test_users[2], '1h');
        const accessToken = generateToken(test_users[2], '1h');

        await transactions.insertMany(test_transactions);

        let url = '/api/transactions/users/InvalidUser/category/Food';
        const response = await request(app).get(url).set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]);
        expect(response.status).toBe(400);
        expect(response.body.error).toEqual('User not found');
    });
    test('should return error 401 if called by a non-admin user', async () => {
        const refreshToken = generateToken(test_users[0], '1h');
        const accessToken = generateToken(test_users[0], '1h');

        await transactions.insertMany(test_transactions);

        let url = '/api/transactions/users/' + test_users[0].username + '/category/Food';
        const response = await request(app).get(url).set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]);
        expect(response.status).toBe(401);
        expect(response.body.error).toEqual('You need to be admin to perform this action');
    });
    test('should return error 401 if called by an unauthenticated user', async () => {
        await transactions.insertMany(test_transactions);

        let url = '/api/transactions/users/' + test_users[0].username + '/category/Food';
        const response = await request(app).get(url);
        expect(response.status).toBe(401);
        expect(response.body.error).toEqual('Unauthorized');
    });
    test('should not let an admin through user route', async () => {
        const refreshToken = generateToken(test_users[2], '1h');
        const accessToken = generateToken(test_users[2], '1h');

        await transactions.insertMany(test_transactions);

        let url = '/api/users/' + test_users[0].username + '/transactions/category/Food';
        const response = await request(app).get(url).set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]);
        expect(response.status).toBe(401);
        expect(response.body.error).toEqual('You cannot request info about another user');
    });
    test('should not let a user through admin route', async () => {
        const refreshToken = generateToken(test_users[0], '1h');
        const accessToken = generateToken(test_users[0], '1h');

        await transactions.insertMany(test_transactions);

        for (const category of test_categories) {
            let url = '/api/transactions/users/' + test_users[0].username + '/category/' + category.type;
            const response = await request(app).get(url).set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]);
            expect(response.status).toBe(401);
            expect(response.body.error).toEqual('You need to be admin to perform this action');
        }
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
    const test_categories = [{ type: 'Food', color: 'red' }, { type: 'Transportation', color: 'blue' }, { type: 'Entertainment', color: 'green' }]
    const test_transactions = [
        { username: 'testUser1', amount: 100, type: 'Food', date: '2020-01-01T00:00:00.000Z' },
        { username: 'testUser1', amount: 200, type: 'Transportation', date: '2021-01-02T23:59:59.000Z' },
        { username: 'testUser1', amount: 300, type: 'Entertainment', date: '2022-01-03T00:00:00.000Z' },
        { username: 'testUser1', amount: 100, type: 'Food', date: '2021-05-01T00:00:00.000Z' },
        { username: 'testUser1', amount: 200, type: 'Transportation', date: '2021-05-02T00:00:00.000Z' },
        { username: 'testUser1', amount: 50, type: 'Food', date: '2021-05-03T00:00:00.000Z' },
        { username: 'testUser1', amount: 77, type: 'Transportation', date: '2021-05-04T00:00:00.000Z' },
        { username: 'testUser1', amount: 88, type: 'Entertainment', date: '2021-05-05T00:00:00.000Z' },
        { username: 'testUser1', amount: 99, type: 'Food', date: '2021-05-06T00:00:00.000Z' },
        { username: 'testUser1', amount: 400, type: 'Food', date: '2020-01-01T00:00:00.000Z' },
        { username: 'testUser1', amount: 500, type: 'Transportation', date: '2021-01-02T23:59:59.000Z' },
        { username: 'testUser2', amount: 100, type: 'Food', date: '2020-01-01T00:00:00.000Z' },
        { username: 'testUser2', amount: 200, type: 'Transportation', date: '2021-01-02T00:00:00.000Z' },
        { username: 'testUser2', amount: 300, type: 'Entertainment', date: '2022-01-03T00:00:00.000Z' },
    ]
    const test_users = [
        { username: 'testUser1', password: 'password', email: 'test1@email.com', role: 'Regular' },
        { username: 'testUser2', password: 'password', email: 'test2@email.com', role: 'Regular' },
        { username: 'testAdmin', password: 'password', email: 'admin@email', role: 'Admin' }
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
    test('Should successfully delete a transaction', async () => {
        const refreshToken = generateToken(test_users[0]);
        const accessToken = generateToken(test_users[0]); 
        const inserted_transactions = await transactions.insertMany(test_transactions);
        let len = inserted_transactions.filter(transaction => transaction.username === test_users[0].username).length;
        for (const transaction of inserted_transactions.filter(transaction => transaction.username === test_users[0].username)) {
            const response = await request(app).delete('/api/users/' + test_users[0].username + '/transactions/' ).set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]).send({_id: transaction._id});
            const deleted_transaction = await transactions.findOne({_id: transaction._id});
            //Check that the transaction was deleted
            expect(deleted_transaction).toBeNull();
            len = len - 1;
            //Check that the other transactions were not deleted
            expect(await transactions.find({username: test_users[0].username})).toHaveLength(len);
            //Check that the response is correct
            expect(response.status).toBe(200);
            expect(response.body.data).toEqual({ message: 'Transaction deleted' });
        }

    });
    //Non valid-body
    test('should return error 400 if _id in body is not defined', async () => {
        const refreshToken = generateToken(test_users[0]);
        const accessToken = generateToken(test_users[0]);
        const non_valid_bodies = [{}, { _notId:'1'}, { _id: undefined}, { id:'233'}];
        
        for (const body of non_valid_bodies) {
            const response = await request(app).delete('/api/users/' + test_users[0].username + '/transactions/' )
            .set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`])
            .send(body);
            expect(response.status).toBe(400);
            expect(response.body.error).toEqual('Missing body attributes');
        }
    });
    test('should return error 400 if _id in body is an empty string', async () => {
        const refreshToken = generateToken(test_users[0]);
        const accessToken = generateToken(test_users[0]);
        const non_valid_bodies = [{ _id: ''}, { _id: '   '}, { _id: '\n'}, { _id: '\t'}, { _id: '\r'}, { _id: '\r\n'}];

        for (const body of non_valid_bodies) {
            const response = await request(app).delete('/api/users/' + test_users[0].username + '/transactions/' )
            .set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`])
            .send(body);
            expect(response.status).toBe(400);
            expect(response.body.error).toEqual('Missing body attributes');
        }
    });
    test('should return error 400 if _id in body is not a string', async () => {
        const refreshToken = generateToken(test_users[0]);
        const accessToken = generateToken(test_users[0]);
        const non_valid_bodies = [{ _id: 1}, { _id: 1.1}, { _id: true}, { _id: false}, { _id: null}, { _id: undefined}, { _id: []}, { _id: {}}];

        for (const body of non_valid_bodies) {
            const response = await request(app).delete('/api/users/' + test_users[0].username + '/transactions/' )
            .set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`])
            .send(body);
            expect(response.status).toBe(400);
            expect(response.body.error).toEqual('Missing body attributes');
        }
    }
    );
    test('should return error 400 if _id in body is not a valid ObjectId', async () => {
        const refreshToken = generateToken(test_users[0]);
        const accessToken = generateToken(test_users[0]);
        const non_valid_bodies = [{ _id: '1'}, { _id: '1.1'}, { _id: 'true'}, { _id: 'false'}, { _id: 'null'}, { _id: 'undefined'}, { _id: '[]'}, { _id: '{}'}, { _id: '1234567890123456789012345'}];

        for (const body of non_valid_bodies) {
            const response = await request(app).delete('/api/users/' + test_users[0].username + '/transactions/' )
            .set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`])
            .send(body);
            expect(response.body.error).toEqual('Missing body attributes');
            expect(response.status).toBe(400);
        }
    }
    );

    //Others
    test('should return error 400 if username passed as params does not exist in the DB', async () => {
        const refreshToken = generateToken({username: 'nonExistingUser', role: 'Regular', password: 'password', email: 'nonExisting@email.com' });
        const accessToken = generateToken({username: 'nonExistingUser', role: 'Regular', password: 'password', email: 'nonExisting@email.com' });
        
        const response = await request(app).delete('/api/users/' + 'nonExistingUser' + '/transactions/' )
        .set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`])
        .send({_id: '1'});

        expect(response.status).toBe(400);
        expect(response.body.error).toEqual('User not found');
        //Restore deleted user
    });
    test('should return error 400 if the _id (transaction) in the body does not exist in the DB', async () => {
        const refreshToken = generateToken(test_users[0]);
        const accessToken = generateToken(test_users[0]);

        const inserted_transactions = await transactions.insertMany(test_transactions);
        await transactions.deleteMany({_id: inserted_transactions[0]._id});
        const response = await request(app).delete('/api/users/' + test_users[0].username + '/transactions/' )
        .set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`])
        .send({_id: inserted_transactions[0]._id});

        expect(response.status).toBe(400);
        expect(response.body.error).toEqual('Transaction not found');
    }
    );
    test('should return error 400 if the _id (transaction) in the body does not belong to the user', async () => {
        const refreshToken = generateToken(test_users[0]);
        const accessToken = generateToken(test_users[0]);

        const inserted_transactions = await transactions.insertMany(test_transactions);

        for (const transaction of inserted_transactions.filter(transaction => transaction.username !== test_users[0].username)) {
            const response = await request(app).delete('/api/users/' + test_users[0].username + '/transactions/' )
            .set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`])
            .send({_id: transaction._id});

            expect(response.status).toBe(400);
            expect(response.body.error).toEqual("You can't delete a transaction of another user");
        }
    });

    //Authorization
    test('should return error 401 if called by a non-authenticated user', async () => {
        const response = await request(app).delete('/api/users/' + test_users[0].username + '/transactions/' ).send({_id: '1'});
        expect(response.status).toBe(401);
        expect(response.body.error).toEqual('Unauthorized');
    }
    );
    test('should error 401 if called by an authenticated user who is not the same as the one in the route (authType=user)', async () => {
        const refreshToken = generateToken(test_users[0]);
        const accessToken = generateToken(test_users[0]);
        const response = await request(app).delete('/api/users/' + test_users[1].username + '/transactions/' )
        .set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`])
        .send({_id: '1'});
        expect(response.status).toBe(401);
        expect(response.body.error).toEqual('You cannot request info about another user');
    });
    test('should check authentication before other types of errors', async () => {
        const response = await request(app).delete('/api/users/' + test_users[0].username + '/transactions/' ).send({_id: 'nonValidId'});
        expect(response.status).toBe(401);
        expect(response.body.error).toEqual('Unauthorized');
        const response2 = await request(app).delete('/api/users/' + test_users[0].username + '/transactions/' ).send({});
        expect(response2.status).toBe(401);
        expect(response2.body.error).toEqual('Unauthorized');
        const response3 = await request(app).delete('/api/users/' + test_users[1].username + '/transactions/' ).send({_id: '  '});
        expect(response3.status).toBe(401);
        expect(response3.body.error).toEqual('Unauthorized');
    });
})

describe("deleteTransactions", () => {
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})
