import request from 'supertest';
import { app } from '../app';
import { categories, transactions } from '../models/model';
import {User } from '../models/User'
import { createCategory, updateCategory, deleteCategory, getCategories } from '../controllers/controller';
import { verifyAuth } from '../controllers/utils';
import mongoose, { Model } from 'mongoose';
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';

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
          .patch(`/api/categories/${oldType}`)
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

    // Non riesco a generare un parametro nullo --> Ritorna un 404 o che la categoria non esiste
    /*test('should return an error if invalid parameter in request', async () => {
        const res = await updateRequest(body, 0);

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'Invalid parameter in request' });
    });*/

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
        expect(res.body).toEqual({ error: 'Types must be a non-void array' });
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
        expect(res.body).toEqual({ error: 'Types must be an array of non-void strings' });
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
        // Find oldest category
        const foundCategories = await categories.find({}).sort({createdAt:1}).limit(1);
        const firstCategory = foundCategories[0].type;
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
        tran = await transactions.find({});
        let flag = true;
        for(let i=0; i<tran.length;i++){
            if(tran[i].type !== firstCategory){
                flag = false;
                break;
            }
        }
        expect(flag).toBe(true);
    });

    test('Should delete categories and update transactions when #passed_categories<#db_categories', async () => {
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

    // TODO: it returns 200 even if the user is not in the db
    /*test('should return an error if user is not authenticated', async () => {
        const accessToken = jwt.sign(
            { ...newUser('fake'), password: undefined, role: 'Admin' },
            'fakeKey',
            { expiresIn: "300d" }
          );

        const res = await getCategories();

        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: "JsonWebTokenError" });
    });*/


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
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
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
