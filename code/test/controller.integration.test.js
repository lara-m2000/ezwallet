import request from 'supertest';
import { app } from '../app';
import { categories, transactions } from '../models/model';
import { createCategory, updateCategory, deleteCategory, getCategories } from '../controllers/controller';
import mongoose, { Model } from 'mongoose';
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
import { Group, User } from '../models/User';

dotenv.config();

const newUser = (user) => ({
    username: user,
    email: `${user}@${user}.it`,
    id: user,
    password: user,
  });
  
  /**
   *
   * @param {*} user
   * @param {"Regular"|"Admin"} role
   * @returns
   */
const newDbUser = (user, role = "Regular") => ({
    ...newUser(user),
    role: role,
    refreshToken: jwt.sign(
      { ...newUser(user), password: undefined, role: role },
      process.env.ACCESS_KEY,
      { expiresIn: "300d" }
    ),
    accessToken: jwt.sign(
      { ...newUser(user), password: undefined, role: role },
      process.env.ACCESS_KEY,
      { expiresIn: "300d" }
    ),
});

// Define users
const regularUser = newDbUser('Matteo');
const admin = newDbUser('MatteoButCooler', 'Admin');

beforeAll(async () => {
    const dbName = "testingDatabaseController";
    const url = `${process.env.MONGO_URI}/${dbName}`;

    await mongoose.connect(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
  
    await User.deleteMany({});
    await transactions.deleteMany({});
    await categories.deleteMany({});
    // Insert users
    await User.insertMany([regularUser,admin]);    
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
});  

let body;
const test_categories = [
    { type: 'Stuff',            color: 'Red'},
    { type: 'Food',             color: 'Blue'},
    { type: 'Transportation',   color: 'Green'},
    { type: 'Entertainment',    color: 'Yellow'},
]
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


describe("createCategory", () => { 

    beforeEach(async () => {
        await categories.deleteMany({});
        await transactions.deleteMany({});
        body = {
            type: 'category1',
            color: 'blue'
        };
    });

    const createRequest = async (body, refreshToken = admin.refreshToken) => {
        return await request(app)
          .post("/api/categories")
          .set("Content-Type", "application/json")
          .set("Cookie", [
            `refreshToken=${refreshToken}`,
            `accessToken=${refreshToken}`,
          ])
          .send(body);
      };
    

    test('should create a new category successfully', async () => {
        const res = await createRequest(body);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            data: {
                type: body.type,
                color: body.color
            }
        });
    });

    test('should return an error if user is not authorized', async () => {
        const res = await createRequest(body, regularUser.refreshToken)

        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: "You need to be admin to perform this action" });
    });

    test('should return an error if type or color is not a string', async () => {
        const invalidType = 123;
        const invalidColor = true;
        body.type = invalidType;
        body.color = invalidColor;

        const res = await createRequest(body);

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'Invalid attribute' });
    });

    test('should return an error if type or color is empty', async () => {
        const invalidType = "   ";
        const invalidColor = "";
        body.type = invalidType;
        body.color = invalidColor;

        const res = await createRequest(body);

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'Invalid attribute' });
    });

    test('should return an error if category with the same type already exists', async () => {
        const newCategory = {type: 'category1', color: 'green'};
        await categories.insertMany([newCategory])
        
        const res = await createRequest(body);

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'Category with same type already exists' });
    });

    // Non riesco a generare un internal error
    /*test('should return a server error if an exception occurs', async () => {
        body = {};
        const res = await request(app)
        .post("/api/categories")
        .set("Content-Type", "application/json")
        .set("Cookie", [
          `refreshToken=${admin.refreshToken}`,
          `accessToken=${admin.refreshToken}`,
        ])
        .send(body);

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });*/
});

describe("updateCategory", () => {

    let oldType;

    beforeEach(async () => {
        await categories.deleteMany({});
        await transactions.deleteMany({});
        await categories.insertMany(test_categories);
        await transactions.insertMany(test_transactions);
        body = {
            type: 'Food&Beverage',
            color: 'Purple'
        };
        oldType = 'Food';
    });
    
    const updateRequest = async (body,oldType,refreshToken = admin.refreshToken) => {
        return await request(app)
          .patch(`/api/categories/${oldType}/`)
          .set("Content-Type", "application/json")
          .set("Cookie", [
            `refreshToken=${refreshToken}`,
            `accessToken=${refreshToken}`,
          ])
          .send(body);
      };

      test('should update the category and related transactions successfully', async () => {
        let tran,typeCnt = 0;
        for (let i=0;i<test_transactions.length;i++){
            if(test_transactions[i].type === oldType){
                typeCnt++;
            }        
        }

        const res = await updateRequest(body, oldType);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            data: { message: "Category edited successfully", count: typeCnt }
        });

        // Check that the oldType is not in the db anymore
        let cats = await categories.find({});
        cats = cats.map(e => e.type);
        const index = cats.indexOf(oldType);
        expect(index).toBe(-1);
    });

    test('should update the category\'s color successfully', async () => {
        body.type  = oldType;

        const res = await updateRequest(body, oldType);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            data: { message: "Category edited successfully", count: 0 }
        });

        // Check that the oldType is not in the db anymore
        const cats = await categories.find({});
        let flag = false;
        for(let i=0;i<cats.length;i++){
            if(cats[i].type == oldType && cats[i].color == body.color)
                flag = true;
        }
        expect(flag).toBe(true);
    });
    
    test('should return an error if user is not authorized', async () => {
        const res = await updateRequest(body, oldType, regularUser.refreshToken);

        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: "You need to be admin to perform this action" });
    });

    test('should return an error if invalid parameter in request', async () => {
        const res = await updateRequest(body, '  ');

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'Invalid parameter in request' });
    });

    test('should return an error if type or color are not strings', async () => {
        body.type = 123;
        body.color = true;

        const res = await updateRequest(body,oldType);

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'Invalid attribute' });
    });

    test('should return an error if type or color are void strings', async () => {
        body.type = "   ";
        body.color = "";

        const res = await updateRequest(body,oldType);

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'Invalid attribute' });
    });

    test('should return an error if the category does not exist', async () => {
        oldType = 'iDoNotExist';

        const res = await updateRequest(body,oldType);

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'The category does not exist' });
    });

    test('should return an error if category with the same type already exists', async () => {
        body.type = 'Entertainment';

        const res = await updateRequest(body,oldType);

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'Category type already exists' });
    });

    /*test('should return a server error if an exception occurs', async () => {
        const errorMessage = 'Internal Server Error';
        categories.findOne = jest.fn().mockRejectedValueOnce(new Error(errorMessage));

        await updateCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });*/
})

describe("deleteCategory", () => { 
    
    beforeEach(async () => {
        await categories.deleteMany({});
        await transactions.deleteMany({});
        await categories.insertMany(test_categories);
        await transactions.insertMany(test_transactions);
        body = {
            types: ['Food', 'Entertainment'] 
        };
    })

    const deleteRequest = async (body,refreshToken = admin.refreshToken) => {
        return await request(app)
          .delete(`/api/categories`)
          .set("Content-Type", "application/json")
          .set("Cookie", [
            `refreshToken=${refreshToken}`,
            `accessToken=${refreshToken}`,
          ])
          .send(body);
      };

    test('should return an error if user is not authorized', async () => {
        const res = await deleteRequest(body, regularUser.refreshToken);

        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: "You need to be admin to perform this action" });
    });

    test('Should return an error if types is not an array', async () => {
        body.types = 123;

        const res = await deleteRequest(body);

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'Wrong format' });
    });

    test('Should return an error if types is a void array', async () => {
        body.types = [];

        const res = await deleteRequest(body);

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'Types must be a non-void array' });
    });

    test('Should return an error if types contains void strings', async () => {
        body.types = ['Food','   '];

        const res = await deleteRequest(body);

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'Types must be an array of non-void strings' });
    });

    test('Should return an error if types contains non string elements', async () => {
        body.types = ['Food',123];

        const res = await deleteRequest(body);

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'Wrong format' });
    });


    test('Should return error 400 if the number of existing categories is <=1', async () => {
        await categories.deleteMany({});
        await categories.insertMany([{type: 'Food', color: 'Blue'}]);
        
        const res = await deleteRequest(body);
        
        expect(res.status).toBe(400);
        expect(res.body).toEqual({
            error: 'Not enough categories to perform a deletion',
        });
    });

    test('Should return error 400 if one of the passed categories does not exist', async () => {
        body.types.push('FakeCategory');
        const docsBefore = await categories.countDocuments();
        
        const res = await deleteRequest(body);
        
        expect(res.status).toBe(400);
        expect(res.body).toEqual({
            error: 'All categories must exist',
        });
        const docsAfter = await categories.countDocuments();
        // No elimination should happen
        expect(docsAfter).toBe(docsBefore);
    });

    test('Should delete categories and update transactions when #passed_categories=#db_categories', async () => {
        body.types = test_categories.map(e => e.type);
        // The oldest category is the first one of the array that we insert beforeeach test
        const firstCategory = test_categories[0].type;
        // Count transactions that are going to be modified
        const modTrans = test_transactions.filter(e => e.type !== firstCategory).length;

        const res = await deleteRequest(body);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            data: {message: "Categories deleted", count: modTrans}
        });
        // Check that the categories have been deleted
        const foundCategories = await categories.find({});
        expect(foundCategories.length).toBe(1);
        expect(foundCategories[0].type).toBe(firstCategory);
        // Check that the transactions type is the first inserted category
        let tran = await transactions.find({});
        let flag = true;
        for(let i=0; i<tran.length;i++){
            if(tran[i].type !== firstCategory){
                flag = false;
                break;
            }
        }
        expect(flag).toBe(true);
    });

    test('Should delete categories and update transactions when #passed_categories<#db_categories-1', async () => {
        // Define categories to be deleted
        body.types = test_categories.filter(e => e.type == 'Food').map(e => e.type);
        // The oldest category is the first one of the array that we insert beforeeach test (except for the category we are deleting now)
        const firstCategory = test_categories.filter(e => e.type !== 'Food')[0].type; 
        // Save transactions that are going to be modified
        const oldTransactions = await transactions.find({type: 'Food'});
        const modTrans = oldTransactions.length;

        const res = await deleteRequest(body);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            data: {message: "Categories deleted", count: modTrans}}
        );
        // Check that the categories have been deleted
        const foundCategories = await categories.findOne({type: 'Food'});
        expect(foundCategories).toBe(null);
        // Check that the transactions type is the first inserted category
        const newTransactions = await transactions.find({_id: {$in: oldTransactions.map(e => e._id)}});
        for (const tran of newTransactions) {
            expect(tran.type).toBe(firstCategory);
        }
    });

    test('Should delete categories and update transactions when #passed_categories<#db_categories-2', async () => {
        // Insert another category just to be sure the natural order sorting works
        await categories.insertMany({type: 'Dummy', color: 'Dummy'});
        body.types = test_categories.map(e => e.type);
        const foundCategories = await categories.find({}).sort({createdAt: 1}).limit(2);
        // Eliminate all but the second oldest category
        const firstCategory = foundCategories[1].type;
        // Remove firstCategory from the categories to remove
        let index = body.types.indexOf(firstCategory);
        body.types.splice(index,1);
        // Count transactions that are going to be modified
        let tran = await transactions.find({});
        let modTrans = 0;
        tran.forEach((el) => {
            if(el.type !== firstCategory)
                modTrans++;
        });

        const res = await deleteRequest(body);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            data: {message: "Categories deleted", count: modTrans}
        });
        // Check that the transactions type is the first inserted category
        tran = await transactions.find({})
        let flag = true;
        for(let i=0; i<tran.length;i++){
            if(tran[i].type !== firstCategory){
                flag = false;
                break;
            }
        }
        expect(flag).toBe(true);
    });

    /*test('should return a server error if an exception occurs', async () => {
        const errorMessage = 'Internal Server Error';
        categories.countDocuments.mockRejectedValueOnce(new Error(errorMessage));

        await deleteCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });*/
})

describe("getCategories", () => { 

    beforeEach(async () => {
        await categories.deleteMany({});
        await transactions.deleteMany({});
        await categories.insertMany(test_categories);
        await transactions.insertMany(test_transactions);
    })

    const getRequest = async (refreshToken = admin.refreshToken) => {
        return await request(app)
          .get(`/api/categories`)
          .set("Content-Type", "application/json")
          .set("Cookie", [
            `refreshToken=${refreshToken}`,
            `accessToken=${refreshToken}`,
          ])
          .send();
    };

    test('should return all categories', async () => {
        const res = await getRequest();
        
        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            data: test_categories
        });
    });

    test('should return an empty array if there are no categories', async () => {
        await categories.deleteMany({});

        const res = await getRequest();

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ data: [] });
    });

    /*test('should handle and return error 500', async () => {
        // Mock the categories.find function to throw an error
        categories.find.mockRejectedValueOnce(new Error('Database error'));
        await getCategories(req, res);
        // Verify the response
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
    });*/
})

describe("createTransaction", () => {
    const test_categories = [{ type: 'Food', color: 'red' }, { type: 'Transportation', color: 'blue' }, { type: 'Entertainment', color: 'green' }]
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
        return jwt.sign(payload, process.env.ACCESS_KEY, { expiresIn: expirationTime });
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
        test("Expected to return an error if logged in, but not as the user in the path", async()=>{
            const refreshToken = generateToken(test_users[0], '1h');
            const accessToken = generateToken(test_users[0], '1h');
            const new_transaction = { username: test_users[0].username, amount: 100, type: 'Food' }
        
            const url = `/api/users/${test_users[1].username}/transactions`;
            const response = await request(app)
                    .post(url)
                    .set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`])
                    .send(new_transaction);
            expect(response.status).toBe(401);
            expect(response.body.error).toBeDefined();
        })
        test("Expected to return an error if username mismatch between path and body", async()=>{
            const refreshToken = generateToken(test_users[0], '1h');
            const accessToken = generateToken(test_users[0], '1h');
            const new_transaction = { username: test_users[1].username, amount: 100, type: 'Food' }
        
            const url = `/api/users/${test_users[0].username}/transactions`;
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
    test("Should check authentication before other types of errors", async()=>{
        //missing attribute, empty attribute, no category, no user, mismatch
        const new_transactions=[
            { username: 'testUser1', type: 'Food' },
            { username: 'testUser1', amount: 100, type: ' ' },
            { username: 'testUser1', amount: 100, type: 'Wrong type' },
            { username: 'wrongUser', amount: 100, type: 'Food' }
        ]
        const url = `/api/users/testUser1/transactions`;
        for(const new_transaction of new_transactions){
            const response = await request(app)
                    .post(url)
                    .send(new_transaction);
            expect(response.status).toBe(401);
        }
    })
})

describe("getAllTransactions", () => {
    const test_categories = [{ type: 'Food', color: 'red' }, { type: 'Transportation', color: 'blue' }, { type: 'Entertainment', color: 'green' }]
    const test_transactions = [
        { username: 'testUser1', amount: 100, type: 'Food', date: '2020-01-01T00:00:00.000Z' },
        { username: 'testUser1', amount: 200, type: 'Transportation', date: '2021-01-02T23:59:59.999Z' },
        { username: 'testUser1', amount: 300, type: 'Entertainment', date: '2022-01-03T00:00:00.000Z' },
        { username: 'testUser1', amount: 100, type: 'Food', date: '2021-05-01T00:00:00.000Z' },
        { username: 'testUser1', amount: 200, type: 'Transportation', date: '2021-05-02T00:00:00.000Z' },
        { username: 'testUser1', amount: 50, type: 'Food', date: '2021-05-03T00:00:00.000Z' },
        { username: 'testUser1', amount: 77, type: 'Transportation', date: '2021-05-04T00:00:00.000Z'},
        { username: 'testUser1', amount: 88, type: 'Entertainment', date: '2021-05-05T00:00:00.000Z'},
        { username: 'testUser1', amount: 99, type: 'Food', date: '2021-05-06T00:00:00.000Z'},
        { username: 'testUser1', amount: 400, type: 'Food', date: '2020-01-01T00:00:00.000Z'},
        { username: 'testUser1', amount: 500, type: 'Transportation', date: '2021-01-02T23:59:59.999Z'},
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
        { username: 'testUser1', amount: 200, type: 'Transportation', date: '2021-01-02T23:59:59.999Z', color: 'blue' },
        { username: 'testUser1', amount: 300, type: 'Entertainment', date: '2022-01-03T00:00:00.000Z', color: 'green' },
        { username: 'testUser1', amount: 100, type: 'Food', date: '2021-05-01T00:00:00.000Z', color: 'red' },
        { username: 'testUser1', amount: 200, type: 'Transportation', date: '2021-05-02T00:00:00.000Z', color: 'blue' },
        { username: 'testUser1', amount: 50, type: 'Food', date: '2021-05-03T00:00:00.000Z', color: 'red' },
        { username: 'testUser1', amount: 77, type: 'Transportation', date: '2021-05-04T00:00:00.000Z', color: 'blue' },
        { username: 'testUser1', amount: 88, type: 'Entertainment', date: '2021-05-05T00:00:00.000Z', color: 'green' },
        { username: 'testUser1', amount: 99, type: 'Food', date: '2021-05-06T00:00:00.000Z', color: 'red' },
        { username: 'testUser1', amount: 400, type: 'Food', date: '2020-01-01T00:00:00.000Z', color: 'red' },
        { username: 'testUser1', amount: 500, type: 'Transportation', date: '2021-01-02T23:59:59.999Z', color: 'blue' },
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
        return jwt.sign(payload, process.env.ACCESS_KEY, { expiresIn: expirationTime });
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
        { username: 'testUser1', amount: 200, type: 'Transportation', date: '2021-01-02T23:59:59.999Z' },
        { username: 'testUser1', amount: 300, type: 'Entertainment', date: '2022-01-03T00:00:00.000Z' },
        { username: 'testUser1', amount: 100, type: 'Food', date: '2021-05-01T00:00:00.000Z' },
        { username: 'testUser1', amount: 200, type: 'Transportation', date: '2021-05-02T00:00:00.000Z' },
        { username: 'testUser1', amount: 50, type: 'Food', date: '2021-05-03T00:00:00.000Z' },
        { username: 'testUser1', amount: 77, type: 'Transportation', date: '2021-05-04T00:00:00.000Z' },
        { username: 'testUser1', amount: 88, type: 'Entertainment', date: '2021-05-05T00:00:00.000Z' },
        { username: 'testUser1', amount: 99, type: 'Food', date: '2021-05-06T00:00:00.000Z' },
        { username: 'testUser1', amount: 400, type: 'Food', date: '2020-01-01T00:00:00.000Z' },
        { username: 'testUser1', amount: 500, type: 'Transportation', date: '2021-01-02T23:59:59.999Z' },
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
        { username: 'testUser1', amount: 200, type: 'Transportation', date: '2021-01-02T23:59:59.999Z', color: 'blue' },
        { username: 'testUser1', amount: 300, type: 'Entertainment', date: '2022-01-03T00:00:00.000Z', color: 'green' },
        { username: 'testUser1', amount: 100, type: 'Food', date: '2021-05-01T00:00:00.000Z', color: 'red' },
        { username: 'testUser1', amount: 200, type: 'Transportation', date: '2021-05-02T00:00:00.000Z', color: 'blue' },
        { username: 'testUser1', amount: 50, type: 'Food', date: '2021-05-03T00:00:00.000Z', color: 'red' },
        { username: 'testUser1', amount: 77, type: 'Transportation', date: '2021-05-04T00:00:00.000Z', color: 'blue' },
        { username: 'testUser1', amount: 88, type: 'Entertainment', date: '2021-05-05T00:00:00.000Z', color: 'green' },
        { username: 'testUser1', amount: 99, type: 'Food', date: '2021-05-06T00:00:00.000Z', color: 'red' },
        { username: 'testUser1', amount: 400, type: 'Food', date: '2020-01-01T00:00:00.000Z', color: 'red' },
        { username: 'testUser1', amount: 500, type: 'Transportation', date: '2021-01-02T23:59:59.999Z', color: 'blue' },
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
        return jwt.sign(payload, process.env.ACCESS_KEY, { expiresIn: expirationTime });
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
        const result = transactions_with_color.filter(transaction => transaction.username === test_users[0].username && transaction.date <= '2021-01-02T23:59:59.999Z');

        await transactions.insertMany(test_transactions);

        const response = await request(app).get(url).set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]);

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(result);
    });
    test('should return filtered user transactions based on query param "from" and "upTo"', async () => {
        const refreshToken = generateToken(test_users[0], '1h');
        const accessToken = generateToken(test_users[0], '1h');
        const url = '/api/users/' + test_users[0].username + '/transactions?from=2021-01-02&upTo=2021-05-01';
        const result = transactions_with_color.filter(transaction => transaction.username === test_users[0].username && transaction.date >= '2021-01-02T00:00:00.000Z' && transaction.date <= '2021-05-01T23:59:59.999Z');

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
        { username: 'testUser1', amount: 200, type: 'Transportation', date: '2021-01-02T23:59:59.999Z' },
        { username: 'testUser1', amount: 300, type: 'Entertainment', date: '2022-01-03T00:00:00.000Z' },
        { username: 'testUser1', amount: 100, type: 'Food', date: '2021-05-01T00:00:00.000Z' },
        { username: 'testUser1', amount: 200, type: 'Transportation', date: '2021-05-02T00:00:00.000Z' },
        { username: 'testUser1', amount: 50, type: 'Food', date: '2021-05-03T00:00:00.000Z' },
        { username: 'testUser1', amount: 77, type: 'Transportation', date: '2021-05-04T00:00:00.000Z' },
        { username: 'testUser1', amount: 88, type: 'Entertainment', date: '2021-05-05T00:00:00.000Z' },
        { username: 'testUser1', amount: 99, type: 'Food', date: '2021-05-06T00:00:00.000Z' },
        { username: 'testUser1', amount: 400, type: 'Food', date: '2020-01-01T00:00:00.000Z' },
        { username: 'testUser1', amount: 500, type: 'Transportation', date: '2021-01-02T23:59:59.999Z' },
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
        { username: 'testUser1', amount: 200, type: 'Transportation', date: '2021-01-02T23:59:59.999Z', color: 'blue' },
        { username: 'testUser1', amount: 300, type: 'Entertainment', date: '2022-01-03T00:00:00.000Z', color: 'green' },
        { username: 'testUser1', amount: 100, type: 'Food', date: '2021-05-01T00:00:00.000Z', color: 'red' },
        { username: 'testUser1', amount: 200, type: 'Transportation', date: '2021-05-02T00:00:00.000Z', color: 'blue' },
        { username: 'testUser1', amount: 50, type: 'Food', date: '2021-05-03T00:00:00.000Z', color: 'red' },
        { username: 'testUser1', amount: 77, type: 'Transportation', date: '2021-05-04T00:00:00.000Z', color: 'blue' },
        { username: 'testUser1', amount: 88, type: 'Entertainment', date: '2021-05-05T00:00:00.000Z', color: 'green' },
        { username: 'testUser1', amount: 99, type: 'Food', date: '2021-05-06T00:00:00.000Z', color: 'red' },
        { username: 'testUser1', amount: 400, type: 'Food', date: '2020-01-01T00:00:00.000Z', color: 'red' },
        { username: 'testUser1', amount: 500, type: 'Transportation', date: '2021-01-02T23:59:59.999Z', color: 'blue' },
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
        return jwt.sign(payload, process.env.ACCESS_KEY, { expiresIn: expirationTime });
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

    test('should check authentication before other types of errors', async () => {
        const adminRoute = '/api/transactions/users/' + test_users[0].username + '/category/nonexistentcategory';
        const response = await request(app).get(adminRoute);
        expect(response.status).toBe(401);
        expect(response.body.error).toEqual('Unauthorized');
        const userRoute = '/api/users/' + test_users[0].username + '/transactions/category/nonexistentcategory';
        const response2 = await request(app).get(userRoute);
        expect(response2.status).toBe(401);
        expect(response2.body.error).toEqual('Unauthorized');
    }
    );
})

describe("getTransactionsByGroup", () => {
    const sendRequest = async (groupName, refreshToken = bre.refreshToken, admin = false) => {
        return await request(app)
            .get(admin
                ? `/api/transactions/groups/${groupName}`
                : `/api/groups/${groupName}/transactions`)
            .set("Content-Type", "application/json")
            .set("Cookie", [
              `refreshToken=${refreshToken}`,
              `accessToken=${refreshToken}`,
            ])
            .send();
    };

    const bre = newDbUser("bre");
    const fra = newDbUser("fra");
    const breAdmin = newDbUser("breAdmin", "Admin");

    const groupStub = () => ({
        name: "test",
        members: [{email: bre.email}]
    });

    const transactionsStub = () => [
        { username: 'bre', amount: 100, type: 'Food', date: '2020-01-01T00:00:00.000Z' },
        { username: 'bre', amount: 200, type: 'Transportation', date: '2021-01-02T23:59:59.000Z' },
        { username: 'breAdmin', amount: 300, type: 'Entertainment', date: '2022-01-03T00:00:00.000Z' },
    ];

    const categoriesStub = () => [{ type: 'Food', color: 'red' }, { type: 'Transportation', color: 'blue' }, { type: 'Entertainment', color: 'green' }];

    /**
     * Keep the data inside the DB consistent,
     * the test are all the same so just keep all
     * the initialization in one place
     */
    beforeEach(async () => {
        await User.deleteMany();
        await Group.deleteMany();
        await transactions.deleteMany();
        await  categories.deleteMany();

        await User.create([bre, fra, breAdmin]);
        await Group.create(groupStub());
        await transactions.create(transactionsStub());
        await categories.create(categoriesStub());
    });

    test("should return transactions", async () => {
        const res = await sendRequest(groupStub().name);

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(2);
    });

    test("should return error if group doesn't exist", async () => {
        const res = await sendRequest("Camurati:(");

        expect(res.status).toBe(400);
    });

    test("should return 401 is user is not part of the group", async () => {
        const res = await sendRequest(groupStub().name, fra.refreshToken);

        expect(res.status).toBe(401);
    });

    test("should return 401 if not Admin role", async () => {
        const res = await sendRequest(groupStub().name, bre.refreshToken, true);

        expect(res.status).toBe(401);
    });

    test("should return transaction if Admin", async () => {
        const res = await sendRequest(groupStub().name, breAdmin.refreshToken, true);

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(2);
    });
})

describe("getTransactionsByGroupByCategory", () => {
    const sendRequest = async (groupName, category, refreshToken = bre.refreshToken, admin = false) => {
        return await request(app)
            .get(admin
                ? `/api/transactions/groups/${groupName}/category/${category}`
                : `/api/groups/${groupName}/transactions/category/${category}`)
            .set("Content-Type", "application/json")
            .set("Cookie", [
                `refreshToken=${refreshToken}`,
                `accessToken=${refreshToken}`,
            ])
            .send();
    };

    const bre = newDbUser("bre");
    const fra = newDbUser("fra");
    const breAdmin = newDbUser("breAdmin", "Admin");

    const groupStub = () => ({
        name: "test",
        members: [{email: bre.email}]
    });

    const transactionsStub = () => [
        { username: 'bre', amount: 100, type: 'Food', date: '2020-01-01T00:00:00.000Z' },
        { username: 'bre', amount: 200, type: 'Transportation', date: '2021-01-02T23:59:59.000Z' },
        { username: 'breAdmin', amount: 300, type: 'Entertainment', date: '2022-01-03T00:00:00.000Z' },
    ];

    const categoriesStub = () => [{ type: 'Food', color: 'red' }, { type: 'Transportation', color: 'blue' }, { type: 'Entertainment', color: 'green' }];

    /**
     * Keep the data inside the DB consistent,
     * the test are all the same so just keep all
     * the initialization in one place
     */
    beforeEach(async () => {
        await User.deleteMany();
        await Group.deleteMany();
        await transactions.deleteMany();
        await  categories.deleteMany();

        await User.create([bre, fra, breAdmin]);
        await Group.create(groupStub());
        await transactions.create(transactionsStub());
        await categories.create(categoriesStub());
    });

    test("should return list of transactions", async () => {
        const res = await sendRequest(groupStub().name, "Food");

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(1);
    });

    test("should return error if group doesn't exist", async () => {
        const res = await sendRequest("Cabodi<3", "Food");

        expect(res.status).toBe(400);
    });

    test("should return 400 if category doesn't exist", async () => {
        const res = await sendRequest(groupStub().name, "NonEsiste");

        expect(res.status).toBe(400);
    });

    test("should return 401 is user is not part of the group", async () => {
        const res = await sendRequest(groupStub().name, "Food", fra.refreshToken);

        expect(res.status).toBe(401);
    });

    test("should return 401 if not Admin role", async () => {
        const res = await sendRequest(groupStub().name, "Food", bre.refreshToken, true);

        expect(res.status).toBe(401);
    });

    test("should return transaction if Admin", async () => {
        const res = await sendRequest(groupStub().name, "Food", breAdmin.refreshToken, true);

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(1);
    });
})

describe("deleteTransaction", () => {
    const test_categories = [{ type: 'Food', color: 'red' }, { type: 'Transportation', color: 'blue' }, { type: 'Entertainment', color: 'green' }]
    const test_transactions = [
        { username: 'testUser1', amount: 100, type: 'Food', date: '2020-01-01T00:00:00.000Z' },
        { username: 'testUser1', amount: 200, type: 'Transportation', date: '2021-01-02T23:59:59.999Z' },
        { username: 'testUser1', amount: 300, type: 'Entertainment', date: '2022-01-03T00:00:00.000Z' },
        { username: 'testUser1', amount: 100, type: 'Food', date: '2021-05-01T00:00:00.000Z' },
        { username: 'testUser1', amount: 200, type: 'Transportation', date: '2021-05-02T00:00:00.000Z' },
        { username: 'testUser1', amount: 50, type: 'Food', date: '2021-05-03T00:00:00.000Z' },
        { username: 'testUser1', amount: 77, type: 'Transportation', date: '2021-05-04T00:00:00.000Z' },
        { username: 'testUser1', amount: 88, type: 'Entertainment', date: '2021-05-05T00:00:00.000Z' },
        { username: 'testUser1', amount: 99, type: 'Food', date: '2021-05-06T00:00:00.000Z' },
        { username: 'testUser1', amount: 400, type: 'Food', date: '2020-01-01T00:00:00.000Z' },
        { username: 'testUser1', amount: 500, type: 'Transportation', date: '2021-01-02T23:59:59.999Z' },
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
        return jwt.sign(payload, process.env.ACCESS_KEY, { expiresIn: expirationTime });
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
    test('should return error 500 if _id in body is not a valid ObjectId', async () => {
        const refreshToken = generateToken(test_users[0]);
        const accessToken = generateToken(test_users[0]);
        const non_valid_bodies = [{ _id: '1'}, { _id: '1.1'}, { _id: 'true'}, { _id: 'false'}, { _id: 'null'}, { _id: 'undefined'}, { _id: '[]'}, { _id: '{}'}, { _id: '1234567890123456789012345'}];

        for (const body of non_valid_bodies) {
            const response = await request(app).delete('/api/users/' + test_users[0].username + '/transactions/' )
            .set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`])
            .send(body);
            
            expect(response.status).toBe(500);
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
    const test_transactions = [
        { username: 'testUser1', amount: 100, type: 'Food', date: '2020-01-01T00:00:00.000Z' },
        { username: 'testUser1', amount: 200, type: 'Transportation', date: '2021-01-02T23:59:59.999Z' },
        { username: 'testUser1', amount: 300, type: 'Entertainment', date: '2022-01-03T00:00:00.000Z' },
        { username: 'testUser1', amount: 100, type: 'Food', date: '2021-05-01T00:00:00.000Z' },
        { username: 'testUser1', amount: 200, type: 'Transportation', date: '2021-05-02T00:00:00.000Z' },
        { username: 'testUser1', amount: 50, type: 'Food', date: '2021-05-03T00:00:00.000Z' },
        { username: 'testUser1', amount: 77, type: 'Transportation', date: '2021-05-04T00:00:00.000Z'},
        { username: 'testUser1', amount: 88, type: 'Entertainment', date: '2021-05-05T00:00:00.000Z'},
        { username: 'testUser1', amount: 99, type: 'Food', date: '2021-05-06T00:00:00.000Z'},
        { username: 'testUser1', amount: 400, type: 'Food', date: '2020-01-01T00:00:00.000Z'},
        { username: 'testUser1', amount: 500, type: 'Transportation', date: '2021-01-02T23:59:59.999Z'},
        { username: 'testUser2', amount: 100, type: 'Food', date: '2020-01-01T00:00:00.000Z' },
        { username: 'testUser2', amount: 200, type: 'Transportation', date: '2021-01-02T00:00:00.000Z' },
        { username: 'testUser2', amount: 300, type: 'Entertainment', date: '2022-01-03T00:00:00.000Z' },
    ]
    const test_users = [
        { username: 'testUser1', password: 'password', email: 'test1@email.com', role: 'Regular' },
        { username: 'testAdmin', password: 'password', email: 'admin@email', role: 'Admin' }
    ]
    const url = '/api/transactions';
    let current_ids;
    beforeAll(async () => {
        await User.deleteMany({});
        await transactions.deleteMany({});
        await User.insertMany(test_users);
        
    })
    beforeEach(async () => {
        await transactions.deleteMany({});
        const tr=await transactions.insertMany(test_transactions);
        current_ids=tr.map((t)=>t._id);
    })

    afterAll(async () => {
        await User.deleteMany({});
        await transactions.deleteMany({});
    });

    const generateToken = (payload, expirationTime = '1h') => {
        return jwt.sign(payload, process.env.ACCESS_KEY, { expiresIn: expirationTime });
    };

    test('Expected to delete some transactions', async() => {
        const refreshToken = generateToken(test_users[1], '1h');
        const accessToken = generateToken(test_users[1], '1h');
        const _ids=current_ids.slice(0,5);
        
        const response = await request(app).delete(url)
            .set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`])
            .send({_ids});
        
        expect(response.status).toBe(200);
        expect(response.body.data.message).toEqual("Transactions deleted");
        
        //check if the transactions are truly deleted
        const stillExisting=await transactions.find({_id:{$in: _ids}}).countDocuments();
        expect(stillExisting).toEqual(0);
    });
    test('Expected to be successful with empty array', async() => {
        const refreshToken = generateToken(test_users[1], '1h');
        const accessToken = generateToken(test_users[1], '1h');
        const _ids=[];
        
        const response = await request(app).delete(url)
            .set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`])
            .send({_ids});
        
        expect(response.status).toBe(200);
        expect(response.body.data.message).toEqual("Transactions deleted");
    });
    test("Expected to return an error if not logged in", async()=>{
        const _ids=current_ids.slice(0,1);
        
        const response = await request(app).delete(url)
            .send({_ids});
        
        expect(response.status).toBe(401);
        expect(response.body.error).toBeDefined();
        
        //check if the transactions is still in db
        const stillExisting=await transactions.find({_id:{$in: _ids}}).countDocuments();
        expect(stillExisting).toBeGreaterThan(0);
    })
    test('Expected to return an error if not logged in as an Admin', async() => {
        const refreshToken = generateToken(test_users[0], '1h');
        const accessToken = generateToken(test_users[0], '1h');
        const _ids=current_ids.slice(0,2);
        
        const response = await request(app).delete(url)
            .set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`])
            .send({_ids});
        
        expect(response.status).toBe(401);
        expect(response.body.error).toBeDefined();
    });
    test("Expected to return an error if missing '_ids' attribute", async() => {
        const refreshToken = generateToken(test_users[1], '1h');
        const accessToken = generateToken(test_users[1], '1h');
        
        const response = await request(app).delete(url)
            .set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`])
            .send({});
        
        expect(response.status).toBe(400);
        expect(response.body.error).toEqual("Missing body attributes");
    });
    test('Expected to return an error in an _id is an empty string', async() => {
        const refreshToken = generateToken(test_users[1], '1h');
        const accessToken = generateToken(test_users[1], '1h');
        const _ids=current_ids.slice(0,1);
        
        const response = await request(app).delete(url)
            .set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`])
            .send({_ids:_ids.concat(" ")});
        
        expect(response.status).toBe(400);
        expect(response.body.error).toEqual("Invalid transaction id");
        
        //check if the transactions still exist
        const stillExisting=await transactions.find({_id:{$in: _ids}}).countDocuments();
        expect(stillExisting).toBeGreaterThan(0);
    });
    test('Expected to return an error if an _id is an invalid string', async() => {
        const refreshToken = generateToken(test_users[1], '1h');
        const accessToken = generateToken(test_users[1], '1h');
        const _ids=current_ids.slice(0,1);
        
        const response = await request(app).delete(url)
            .set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`])
            .send({_ids:_ids.concat("wrongId")});
        
        expect(response.status).toBe(500);
        expect(response.body.error).toBeDefined();
        
        //check if the transactions still exist
        const stillExisting=await transactions.find({_id:{$in: _ids}}).countDocuments();
        expect(stillExisting).toBeGreaterThan(0);
    });
    test('Expected to return an error if a transaction is not found', async() => {
        const refreshToken = generateToken(test_users[1], '1h');
        const accessToken = generateToken(test_users[1], '1h');
        // to make sure the second _id is valid but not in the db
        await transactions.deleteOne({_id:current_ids[1]});
        const _ids=current_ids.slice(0,3);
        const still_present=[current_ids[0], current_ids[2]];
        
        const response = await request(app).delete(url)
            .set('Cookie', [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`])
            .send({_ids});
        
        expect(response.status).toBe(400);
        expect(response.body.error).toEqual("Invalid transaction id");
        
        //check if the transactions still exist
        const stillExisting=await transactions.find({_id:{$in: still_present}}).countDocuments();
        expect(stillExisting).toBeGreaterThan(0);
    });
    test("Should check authentication before other types of errors", async()=>{
        //missing attribute, empty attribute, no category, no user, mismatch
        const bodies=[
            { },
            { _ids: ['invalidId']},
            { _ids: [' ']},
        ]
        const url = `/api/users/testUser1/transactions`;
        for(const body of bodies){
            const response = await request(app)
                    .post(url)
                    .send(body);
            expect(response.status).toBe(401);
        }
    })
})
