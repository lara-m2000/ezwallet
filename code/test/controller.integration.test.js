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

    /*test('should return a server error if an exception occurs', async () => {
        const res = await createRequest();

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty(error);
    });*/
});

describe("updateCategory", () => {

    beforeEach(async () => {
        await categories.deleteMany({});
        await transactions.deleteMany({});
        await transactions.insertMany({});
        body = {
            type: 'category1',
            color: 'blue'
        };
    });
    
    const createRequest = async (body,oldType,refreshToken = admin.refreshToken) => {
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
        const existingCategory = { type: 'OldCategoryType', color: 'OldCategoryColor' };
        categories.findOne = jest.fn().mockResolvedValueOnce(existingCategory);
        categories.findOne = jest.fn().mockResolvedValueOnce(req.body);
        categories.updateOne = jest.fn().mockResolvedValueOnce({});
        const changes = {modifiedCount : 5};
        transactions.updateMany.mockResolvedValue(changes);

        await updateCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            data: { message: "Category edited successfully", count: changes.modifiedCount },
            refreshedTokenMessage: "RefreshToken",
        });
    });

    test('should update the category\'s color successfully', async () => {
        const existingCategory = { type: 'OldCategoryType', color: 'OldCategoryColor' };
        categories.findOne = jest.fn().mockResolvedValueOnce(existingCategory);
        req.body = { type: 'OldCategoryType', color: 'NewCategoryColor' };
        categories.findOne = jest.fn().mockResolvedValueOnce(existingCategory);
        categories.updateOne = jest.fn().mockResolvedValueOnce({});
        const changes = {modifiedCount : 0};
        transactions.updateMany.mockResolvedValue(changes);

        await updateCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            data: { message: "Category edited successfully", count: changes.modifiedCount },
            refreshedTokenMessage: "RefreshToken",
        });
    });

    test('should return an error if user is not authorized', async () => {
        const unauthorizedError = 'Unauthorized Error';
        verifyAuth.mockReturnValue({flag: false, cause: unauthorizedError});

        await updateCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: unauthorizedError });
    });

    test('should return an error if invalid parameter in request', async () => {
        req.params.type = undefined;

        await updateCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid parameter in request' });
    });

    test('should return an error if type or color are not strings', async () => {
        req.body.type = 123;
        req.body.color = true;

        await updateCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid attribute' });
    });

    test('should return an error if type or color are void strings', async () => {
        req.body.type = "   ";
        req.body.color = "";

        await updateCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid attribute' });
    });

    test('should return an error if the category does not exist', async () => {
        categories.findOne.mockResolvedValueOnce(null);

        await updateCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'The category does not exist' });
    });

    test('should return an error if category with the same type already exists', async () => {
        const existingCategory = { type: 'ExistingType', color: 'ExistingColor' };
        // The mock category is returned also for the old type search in the db
        // so we have to keep the mock on findOne for more than one call
        categories.findOne.mockResolvedValue(existingCategory);

        await updateCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Category type already exists' });
    });


    test('should return a server error if an exception occurs', async () => {
        const errorMessage = 'Internal Server Error';
        categories.findOne = jest.fn().mockRejectedValueOnce(new Error(errorMessage));

        await updateCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
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
