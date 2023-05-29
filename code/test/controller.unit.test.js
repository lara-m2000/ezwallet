import request from 'supertest';
import { app } from '../app';
import { categories, transactions } from '../models/model';
import { User } from "../models/User.js";
import { createTransaction } from '../controllers/controller';
import { verifyAuth } from '../controllers/utils';

//jest.mock('../models/model');
jest.mock('../models/User.js');
jest.mock('../models/model.js');
jest.mock('../controllers/utils.js')

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
            refreshedTokenMessage: "RefreshToken",
        },
      });
    const mockReq =()=>({
        cookies: { },
        body: {
            username: 'testuser',
            type: 'testcategory',
            amount: '100',
        },
        params:{username: 'testuser'}
    });
    beforeEach(() => {
        jest.resetAllMocks();
        verifyAuth.mockReturnValue({flag: true});
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('Expect to sucessfully create a new transaction', async () => {
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
        expect(verifyAuth).toHaveBeenCalledWith(req, res, {authType:"User", username: req.body.username})
        expect(User.findOne).toHaveBeenCalledWith({username:req.body.username});
        expect(categories.findOne).toHaveBeenCalledWith({type:req.body.type});
        expect(transactions.create).toHaveBeenCalledWith({username: req.body.username, 
                                                        amount: Number(req.body.amount), 
                                                        type: req.body.type})
        expect(res.json).toHaveBeenCalledWith({data: new_transaction, refreshedTokenMessage: res.locals.refreshedTokenMessage});
    });
    test("Expect to fail due to missing body attribute", async()=>{
        const req=mockReq();
        const res =mockRes();
        req.body={username:"testuser", amount:0};

        await createTransaction(req, res);
        expect(transactions.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({error:"Missing body attributes"});
    });
    test("Expect to fail due to empty string body attribute", async()=>{
        const req=mockReq();
        const res =mockRes();
        req.body={username:"", amount:0, type:"testcategory"};

        await createTransaction(req, res);
        expect(transactions.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({error:"Missing body attributes"});
    });
    test("Expect to return error when user not authenticated", async()=>{
        const req=mockReq();
        const res =mockRes();

        verifyAuth.mockReturnValue({flag:false})

        await createTransaction(req, res);
        expect(verifyAuth).toBeCalledWith(req,res,{authType:"User", username:req.body.username})
        expect(transactions.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({error:"Unauthorized"});
    })
    test("Expect error due to username mismatch", async ()=>{
        const req=mockReq();
        const res =mockRes();
        req.params.username="anotherUser";

        await createTransaction(req, res);

        expect(transactions.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({error:"Username mismatch"});
    })
    test("Expect user not to be found", async () => {
        const req=mockReq();
        const res =mockRes();
        // mock the not existance of the user
        jest.spyOn(User, "findOne").mockResolvedValue(null);

        await createTransaction(req, res);
        expect(User.findOne).toHaveBeenCalled();
        expect(transactions.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({error:"User not found"});
    });
    test("Expected category not to be found", async () => {
        const req=mockReq();
        const res =mockRes();
        
        jest.spyOn(User, "findOne").mockResolvedValue({username:'testuser', refreshToken: 'testrefreshtoken'});
        jest.spyOn(categories,"findOne").mockResolvedValue(null);

        await createTransaction(req, res);

        expect(User.findOne).toHaveBeenCalledWith({username:req.body.username});
        expect(categories.findOne).toHaveBeenCalledWith({type:req.body.type});
        expect(transactions.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({error:"Category not found"});
    });
    // TODO: check
    /*test("Expect error due to invalid 'amount' attribute",async()=>{
        const req=mockReq();
        const res =mockRes();
        req.body.amount='A100';

        jest.spyOn(User, "findOne").mockResolvedValue({username:'testuser'});
        jest.spyOn(categories,"findOne").mockResolvedValue({type:'testcategory'});

        expect(transactions.create).not.toHaveBeenCalled();
        expect(Number(req.body.amount)).toBe(NaN);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({error:"Invalid 'amount' value"});
    
    })*/

    test("Expect to return a server error if an exception occurs", async () => {
        const req=mockReq();
        const res =mockRes();
        const errorMessage= "Server error";
        jest.spyOn(User, "findOne").mockResolvedValue({username:'testuser', refreshToken: 'testrefreshtoken'});
        jest.spyOn(categories,"findOne").mockResolvedValue({type:'testcategory'});
        jest.spyOn(transactions, "create").mockRejectedValue(new Error(errorMessage));

        await createTransaction(req,res);
        expect(User.findOne).toHaveBeenCalledWith({username:req.body.username});
        expect(categories.findOne).toHaveBeenCalledWith({type:req.body.type});
        expect(transactions.create).rejects.toThrowError(errorMessage);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({error: errorMessage});
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
