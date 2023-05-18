import request from 'supertest';
import { app } from '../app';
import { categories, transactions } from '../models/model';
import { User } from "../models/User.js";
import { createTransaction } from '../controllers/controller';

//jest.mock('../models/model');
jest.mock('../models/User.js');
jest.mock('../models/model.js')

beforeEach(() => {
    jest.clearAllMocks();
  /*categories.find.mockClear();
  categories.prototype.save.mockClear();
  transactions.find.mockClear();
  transactions.deleteOne.mockClear();
  transactions.aggregate.mockClear();
  transactions.prototype.save.mockClear();*/
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
    const mockRes =()=>({
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          message: "",
        },
      });
    const mockReq =()=>({
        cookies:{
            accessToken: 'testaccesstoken',
            refreshToken: 'testrefreshtoken'
        },
        body: {
            username: 'testuser',
            type: 'testcategory',
            amount: '100',
        },
        params:{username: 'testuser'}
    });
    beforeEach(() => {
        
        
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('Expect to create a new transaction', async () => {
        const req=mockReq();
        const res =mockRes();
        const new_transaction={
            username: 'testuser',
            type: 'testcategory',
            amount: '100',
            date: '2023-05-17'
        }
        // mock the existance of the user
        jest.spyOn(User, "findOne").mockResolvedValue({username:'testuser', refreshToken: 'testrefreshtoken'});
        // mock the existance of the category
        jest.spyOn(categories,"findOne").mockResolvedValue({type:'testcategory'});
        jest.spyOn(transactions, "create").mockResolvedValue(new_transaction);

        await createTransaction(req,res);
        expect(User.findOne).toHaveBeenCalledWith({username:req.body.username});
        expect(categories.findOne).toHaveBeenCalledWith({type:req.body.type});
        expect(transactions.create).toHaveBeenCalledWith({username: req.body.username, 
                                                        amount: req.body.amount, 
                                                        type: req.body.type})
        expect(res.json).toHaveBeenCalledWith({data: new_transaction, message:""});
    });
    test("Expect to not found the user and return status 401", async () => {
        const req=mockReq();
        const res =mockRes();
        const new_transaction={
            username: 'testuser',
            type: 'testcategory',
            amount: '100',
            date: '2023-05-17'
        }
        // mock the existance of the user
        jest.spyOn(User, "findOne").mockResolvedValue(null);

        await createTransaction(req, res);
        expect(User.findOne).toHaveBeenCalled();
        expect(transactions.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({message:"User not found"});
    });
    test.todo("user not auth");
    test("Expected category not to be found", async () => {
        const req=mockReq();
        const res =mockRes();
        const new_transaction={
            username: 'testuser',
            type: 'testcategory',
            amount: '100',
            date: '2023-05-17'
        }
        jest.spyOn(User, "findOne").mockResolvedValue({username:'testuser', refreshToken: 'testrefreshtoken'});
        jest.spyOn(categories,"findOne").mockResolvedValue(null);

        await createTransaction(req, res);

        expect(User.findOne).toHaveBeenCalledWith({username:req.body.username});
        expect(categories.findOne).toHaveBeenCalledWith({type:req.body.type});
        expect(transactions.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({message:"Category not found"});
    });
    test("transactions.create ritorna un errore", async () => {
        const req=mockReq();
        const res =mockRes();
        const new_transaction={
            username: 'testuser',
            type: 'testcategory',
            amount: '100',
            date: '2023-05-17'
        }
        // mock the existance of the user
        jest.spyOn(User, "findOne").mockResolvedValue({username:'testuser', refreshToken: 'testrefreshtoken'});
        // mock the existance of the category
        jest.spyOn(categories,"findOne").mockResolvedValue({type:'testcategory'});
        jest.spyOn(transactions, "create").mockRejectedValue(new Error("test"));

        await createTransaction(req,res);
        expect(User.findOne).toHaveBeenCalledWith({username:req.body.username});
        expect(categories.findOne).toHaveBeenCalledWith({type:req.body.type});
        expect(transactions.create).rejects.toThrowError("test");
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({error: "test"});
    })
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
