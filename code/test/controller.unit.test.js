import request from "supertest";
import { app } from "../app";
import { categories, transactions } from "../models/model";
import { User } from "../models/User.js";
import {
    createTransaction,
    deleteTransactions,
    getAllTransactions,
    getTransactionsByUser,
    getTransactionsByUserByCategory,
} from "../controllers/controller";
import { verifyAuth } from "../controllers/utils";

//jest.mock('../models/model');
jest.mock("../models/User.js");
jest.mock("../models/model.js");
jest.mock("../controllers/utils.js");

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
    test("Dummy test, change it", () => {
        expect(true).toBe(true);
    });
});

describe("updateCategory", () => {
    test("Dummy test, change it", () => {
        expect(true).toBe(true);
    });
});

describe("deleteCategory", () => {
    test("Dummy test, change it", () => {
        expect(true).toBe(true);
    });
});

describe("getCategories", () => {
    test("Dummy test, change it", () => {
        expect(true).toBe(true);
    });
});

describe("createTransaction", () => {
    const mockRes = () => ({
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
            refreshedTokenMessage: "RefreshToken",
        },
    });
    const mockReq = () => ({
        cookies: {},
        body: {
            username: "testuser",
            type: "testcategory",
            amount: "100",
        },
        params: { username: "testuser" },
    });
    beforeEach(() => {
        jest.resetAllMocks();
        verifyAuth.mockReturnValue({ flag: true });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Expect to sucessfully create a new transaction", async () => {
        const req = mockReq();
        const res = mockRes();
        const new_transaction = {
            username: "testuser",
            type: "testcategory",
            amount: "100",
            date: "2023-05-17",
        };

        // mock the existance of the user
        jest.spyOn(User, "findOne").mockResolvedValue({
            username: "testuser",
            refreshToken: "testrefreshtoken",
        });
        // mock the existance of the category
        jest
            .spyOn(categories, "findOne")
            .mockResolvedValue({ type: "testcategory" });
        jest.spyOn(transactions, "create").mockResolvedValue(new_transaction);

        await createTransaction(req, res);
        expect(verifyAuth).toHaveBeenCalledWith(req, res, {
            authType: "User",
            username: req.body.username,
        });
        expect(User.findOne).toHaveBeenCalledWith({ username: req.body.username });
        expect(categories.findOne).toHaveBeenCalledWith({ type: req.body.type });
        expect(transactions.create).toHaveBeenCalledWith({
            username: req.body.username,
            amount: Number(req.body.amount),
            type: req.body.type,
        });
        expect(res.json).toHaveBeenCalledWith({
            data: new_transaction,
            refreshedTokenMessage: res.locals.refreshedTokenMessage,
        });
    });
    test("Expect to fail due to missing body attribute", async () => {
        const req = mockReq();
        const res = mockRes();
        req.body = { username: "testuser", amount: 0 };

        await createTransaction(req, res);
        expect(transactions.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "Missing body attributes" });
    });
    test("Expect to fail due to empty string body attribute", async () => {
        const req = mockReq();
        const res = mockRes();
        req.body = { username: "", amount: 0, type: "testcategory" };

        await createTransaction(req, res);
        expect(transactions.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "Missing body attributes" });
    });
    test("Expect to return error when user not authenticated", async () => {
        const req = mockReq();
        const res = mockRes();
        const authMessage = "failure cause";

        verifyAuth.mockReturnValue({ flag: false, cause: authMessage });

        await createTransaction(req, res);
        expect(verifyAuth).toBeCalledWith(req, res, {
            authType: "User",
            username: req.body.username,
        });
        expect(transactions.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: authMessage });
    });
    test("Expect error due to username mismatch", async () => {
        const req = mockReq();
        const res = mockRes();
        req.params.username = "anotherUser";

        await createTransaction(req, res);

        expect(transactions.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "Username mismatch" });
    });
    test("Expect user not to be found", async () => {
        const req = mockReq();
        const res = mockRes();
        // mock the not existance of the user
        jest.spyOn(User, "findOne").mockResolvedValue(null);

        await createTransaction(req, res);
        expect(User.findOne).toHaveBeenCalled();
        expect(transactions.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
    });
    test("Expected category not to be found", async () => {
        const req = mockReq();
        const res = mockRes();

        jest.spyOn(User, "findOne").mockResolvedValue({
            username: "testuser",
            refreshToken: "testrefreshtoken",
        });
        jest.spyOn(categories, "findOne").mockResolvedValue(null);

        await createTransaction(req, res);

        expect(User.findOne).toHaveBeenCalledWith({ username: req.body.username });
        expect(categories.findOne).toHaveBeenCalledWith({ type: req.body.type });
        expect(transactions.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "Category not found" });
    });
    test("Expect error due to invalid 'amount' attribute", async () => {
        const req = mockReq();
        const res = mockRes();
        req.body.amount = "A100";

        jest.spyOn(User, "findOne").mockResolvedValue({ username: "testuser" });
        jest
            .spyOn(categories, "findOne")
            .mockResolvedValue({ type: "testcategory" });

        await createTransaction(req, res);

        expect(transactions.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "Invalid 'amount' value" });
    });

    test("Expect to return a server error if an exception occurs", async () => {
        const req = mockReq();
        const res = mockRes();
        const errorMessage = "Server error";
        jest.spyOn(User, "findOne").mockResolvedValue({
            username: "testuser",
            refreshToken: "testrefreshtoken",
        });
        jest
            .spyOn(categories, "findOne")
            .mockResolvedValue({ type: "testcategory" });
        jest
            .spyOn(transactions, "create")
            .mockRejectedValue(new Error(errorMessage));

        await createTransaction(req, res);
        expect(User.findOne).toHaveBeenCalledWith({ username: req.body.username });
        expect(categories.findOne).toHaveBeenCalledWith({ type: req.body.type });
        expect(transactions.create).rejects.toThrowError(errorMessage);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
});

describe("getAllTransactions", () => {
    const mockRes = () => ({
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
            refreshedTokenMessage: "RefreshToken",
        },
    });

    beforeEach(() => {
        jest.resetAllMocks();
        verifyAuth.mockReturnValue({ flag: true });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });
    test("Expect empty list if no transactions are present", async () => {
        const req = {};
        const res = mockRes();
        jest.spyOn(transactions, "aggregate").mockResolvedValue([]);

        await getAllTransactions(req, res);

        expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: "Admin" });
        expect(transactions.aggregate).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({
            data: [],
            refreshedTokenMessage: res.locals.refreshedTokenMessage,
        });
    });
    test("Expect list of transactions", async () => {
        const req = {};
        const res = mockRes();
        const listDbTransactions = [
            {
                _id: "000",
                username: "Mario",
                amount: 100,
                type: "food",
                date: "2023-05-19T00:00:00",
                categories_info: { color: "red" },
            },
            {
                _id: "aaa",
                username: "Luigi",
                amount: 20,
                type: "food",
                date: "2023-05-19T10:00:00",
                categories_info: { color: "red" },
            },
        ];
        const resultList = [
            {
                _id: "000",
                username: "Mario",
                amount: 100,
                type: "food",
                date: "2023-05-19T00:00:00",
                color: "red",
            },
            {
                _id: "aaa",
                username: "Luigi",
                amount: 20,
                type: "food",
                date: "2023-05-19T10:00:00",
                color: "red",
            },
        ];
        jest.spyOn(transactions, "aggregate").mockResolvedValue(listDbTransactions);

        await getAllTransactions(req, res);

        expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: "Admin" });
        expect(transactions.aggregate).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({
            data: resultList,
            refreshedTokenMessage: res.locals.refreshedTokenMessage,
        });
    });
    test("Expect to return error when user is not an admin", async () => {
        const req = {};
        const res = mockRes();
        const authMessage = "Not an admin";
        verifyAuth.mockReturnValue({ flag: false, cause: authMessage });

        await getAllTransactions(req, res);

        expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: "Admin" });
        expect(transactions.aggregate).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: authMessage });
    });
    //TODO: check
    /*test("Expect to return a server error if an exception occurs", async()=>{
            const req={};
            const res=mockRes();
            const errorMessage="Server error"
            //problem here
            jest.spyOn(transactions, "aggregate").mockRejectedValue(new Error(errorMessage));
    
            await getAllTransactions();
    
            expect(verifyAuth).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({error: errorMessage})
        });*/
});

describe("getTransactionsByUser", () => {
    const mockRes = () => ({
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
            refreshedTokenMessage: "RefreshToken",
        },
    });
    const mockReq = (isAdmin = true) => ({
        params: { username: "Mario" },
        url: isAdmin ? "/transactions/users/" : "/users/",
    });
    beforeEach(() => {
        jest.resetAllMocks();
        verifyAuth.mockReturnValue({ flag: true });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });
    test.skip("Expect list of transactions, made by Admin", async () => {
        const req = mockReq(true);
        const res = mockRes();
        const listTransactions = [
            {
                _id: "000",
                username: "Mario",
                amount: 100,
                type: "food",
                date: "2023-05-19T00:00:00",
                categories_info: { color: "red" },
            },
            {
                _id: "111",
                username: "Mario",
                amount: 70,
                type: "health",
                date: "2023-05-19T10:00:00",
                categories_info: { color: "green" },
            },
        ];
        const resultList = [
            {
                _id: "000",
                username: "Mario",
                amount: 100,
                type: "food",
                date: "2023-05-19T00:00:00",
                color: "red",
            },
            {
                _id: "111",
                username: "Mario",
                amount: 70,
                type: "health",
                date: "2023-05-19T10:00:00",
                color: "green",
            },
        ];

        jest.spyOn(User, "findOne").mockResolvedValue({ username: "Mario" });
        jest.spyOn(transactions, "aggregate").mockResolvedValue(listTransactions);
        await getTransactionsByUser(req, res);

        expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: "Admin" });
        expect(User.findOne).toHaveBeenCalled();
        expect(transactions.aggregate).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({
            data: resultList,
            refreshedTokenMessage: res.locals.refreshedTokenMessage,
        });
    });

    test("should return transactions for a valid user", async () => {
        const req = {
            params: { username: "Mario" },
            url: "/api/users/Mario/transactions",
        };
        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            locals: { refreshedTokenMessage: "Token refreshed" },
        };

        User.findOne.mockResolvedValue({ username: "Mario" });
        transactions.aggregate.mockResolvedValue([
            {
                _id: "transactionId1",
                username: "Mario",
                amount: 100,
                type: "food",
                date: "2023-05-19T00:00:00",
                categories_info: { color: "red" },
            },
            {
                _id: "transactionId2",
                username: "Mario",
                amount: 70,
                type: "health",
                date: "2023-05-19T10:00:00",
                categories_info: { color: "green" },
            },
        ]);

        await getTransactionsByUser(req, res);

        expect(User.findOne).toHaveBeenCalledWith({ username: "Mario" });
        expect(transactions.aggregate).toHaveBeenCalledWith([
            { $match: { username: "Mario" } },
            {
                $lookup: {
                    from: "categories",
                    localField: "type",
                    foreignField: "type",
                    as: "categories_info",
                },
            },
            { $unwind: "$categories_info" },
        ]);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            data: [
                {
                    username: "Mario",
                    amount: 100,
                    type: "food",
                    color: "red",
                    date: "2023-05-19T00:00:00",
                },
                {
                    username: "Mario",
                    amount: 70,
                    type: "health",
                    color: "green",
                    date: "2023-05-19T10:00:00",
                },
            ],
            refreshedTokenMessage: "Token refreshed",
        });
    });
    test("should return transactions for a valid user asked by an admin", async () => {
        const req = {
            params: { username: "Mario" },
            url: "/api/transactions/users/Mario",
        };
        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            locals: { refreshedTokenMessage: "Token refreshed" },
        };

        User.findOne.mockResolvedValue({ username: "Mario" });
        transactions.aggregate.mockResolvedValue([
            {
                _id: "transactionId1",
                username: "Mario",
                amount: 100,
                type: "food",
                date: "2023-05-19T00:00:00",
                categories_info: { color: "red" },
            },
            {
                _id: "transactionId2",
                username: "Mario",
                amount: 70,
                type: "health",
                date: "2023-05-19T10:00:00",
                categories_info: { color: "green" },
            },
        ]);

        await getTransactionsByUser(req, res);

        expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: "Admin" });
        expect(User.findOne).toHaveBeenCalledWith({ username: "Mario" });
        expect(transactions.aggregate).toHaveBeenCalledWith([
            { $match: { username: "Mario" } },
            {
                $lookup: {
                    from: "categories",
                    localField: "type",
                    foreignField: "type",
                    as: "categories_info",
                },
            },
            { $unwind: "$categories_info" },
        ]);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            data: [
                {
                    username: "Mario",
                    amount: 100,
                    type: "food",
                    color: "red",
                    date: "2023-05-19T00:00:00",
                },
                {
                    username: "Mario",
                    amount: 70,
                    type: "health",
                    color: "green",
                    date: "2023-05-19T10:00:00",
                },
            ],
            refreshedTokenMessage: "Token refreshed",
        });
    });
    test("should return 400 error if user not found", async () => {
        const req = {
            params: { username: "NonexistentUser" },
            url: "/api/users/NonexistentUser/transactions",
        };
        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };

        User.findOne.mockResolvedValue(null);

        await getTransactionsByUser(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
    });
    test("should return 401 error if verifyAuth (authType:User) returns false", async () => {
        const req = {
            params: { username: "Mario" },
            url: "/api/users/Mario/transactions",
        };
        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };
        verifyAuth.mockReturnValue({ flag: false, cause: "error" });

        await getTransactionsByUser(req, res);

        expect(verifyAuth).toHaveBeenCalledWith(req, res, {
            authType: "User",
            username: "Mario",
        });
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: "error" });
    });
    test("should return 401 error if verifyAuth (authType:Admin) returns false", async () => {
        const req = {
            params: { username: "Mario" },
            url: "/api/transactions/users/Mario",
        };
        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };
        verifyAuth.mockReturnValue({ flag: false, cause: "error" });

        await getTransactionsByUser(req, res);

        expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: "Admin" });
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: "error" });
    });
    test("should return 500 error if exception occurs-1", async () => {
        const req = {
            params: { username: "Mario" },
            url: "/api/transactions/users/Mario",
        };
        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };

        User.findOne.mockRejectedValue(new Error("error"));

        await getTransactionsByUser(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "error" });
        expect(User.findOne).toHaveBeenCalledWith({ username: "Mario" });
    });
    test("should return 500 error if exception occurs-2", async () => {
        const req = {
            params: { username: "Mario" },
            url: "/api/transactions/users/Mario",
        };
        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            locals: { refreshedTokenMessage: "Token refreshed" },
        };
        User.findOne.mockResolvedValue({ username: "Mario" });
        transactions.aggregate.mockResolvedValue({map: jest.fn().mockImplementation(() => {throw {error: "error"}})});

        await getTransactionsByUser(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
    test.todo("should return filtered transactions if query params are provided");

});

describe("getTransactionsByUserByCategory", () => {
    beforeEach(() => {
        jest.resetAllMocks();
        verifyAuth.mockReturnValue({ flag: true });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });
    test('should return transactions for a user and category, asked by a user', async () => {
        const req = {
          params: {
            username: 'Mario',
            category: 'food',
          },
          url: '/api/users/Mario/transactions/category/food',
        };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
            refreshedTokenMessage: 'Token refreshed',
          },
        };
    
        // Mock the verifyAuth function
        verifyAuth.mockReturnValue({
          flag: true,
          cause: null,
        });
    
        // Mock the User.findOne and categories.findOne functions
        User.findOne.mockResolvedValue({ username: 'Mario' });
        categories.findOne.mockResolvedValue({ type: 'food', color: 'red' });
    
        // Mock the transactions.aggregate function
        transactions.aggregate.mockResolvedValue([
          {
            _id: 'transaction1',
            username: 'Mario',
            amount: 100,
            type: 'food',
            categories_info: { color: 'red' },
            date: '2023-05-19T00:00:00',
          },
        ]);
    
        // Call the function being tested
        await getTransactionsByUserByCategory(req, res);
    
        // Assertions
        expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: 'User', username: 'Mario' });
        expect(User.findOne).toHaveBeenCalledWith({ username: 'Mario' });
        expect(categories.findOne).toHaveBeenCalledWith({ type: 'food' });
        expect(transactions.aggregate).toHaveBeenCalledWith([
          { $match: { username: 'Mario', type: 'food' } },
          {
            $lookup: {
              from: 'categories',
              localField: 'type',
              foreignField: 'type',
              as: 'categories_info',
            },
          },
          { $unwind: '$categories_info' },
        ]);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          data: [{
            username: 'Mario',
            amount: 100,
            type: 'food',
            color: 'red',
            date: '2023-05-19T00:00:00',
          }],
          refreshedTokenMessage: 'Token refreshed',
        });
      });
    
});

describe("getTransactionsByGroup", () => {
    test("Dummy test, change it", () => {
        expect(true).toBe(true);
    });
});

describe("getTransactionsByGroupByCategory", () => {
    test("Dummy test, change it", () => {
        expect(true).toBe(true);
    });
});

describe("deleteTransaction", () => {
    test("Dummy test, change it", () => {
        expect(true).toBe(true);
    });
});

describe("deleteTransactions", () => {
    const mockRes = () => ({
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
            refreshedTokenMessage: "RefreshToken",
        },
    });
    const mockReq = () => ({
        body: {
            _ids: [],
        },
    });
    beforeEach(() => {
        jest.resetAllMocks();
        verifyAuth.mockReturnValue({ flag: true });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    //derver error
    test("Expected to sucessfully delete many transctions", async () => {
        const req = mockReq();
        const res = mockRes();
        req.body._ids = ["1", "2"];
        //mock the existance of EVERY id
        jest.spyOn(transactions, "findById").mockResolvedValue({});
        jest.spyOn(transactions, "deleteMany").mockResolvedValue({});

        await deleteTransactions(req, res);

        expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: "Admin" });
        expect(transactions.findById).toHaveBeenCalledTimes(req.body._ids.length);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            data: { message: "Transactions deleted" },
            refreshedTokenMessage: res.locals.refreshedTokenMessage,
        });
    });
    test("Expected to be successful with empty array of _ids", async () => {
        const req = mockReq();
        const res = mockRes();
        jest.spyOn(transactions, "deleteMany").mockResolvedValue({});

        await deleteTransactions(req, res);

        expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: "Admin" });
        expect(transactions.findById).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            data: { message: "Transactions deleted" },
            refreshedTokenMessage: res.locals.refreshedTokenMessage,
        });
    });
    test("Expected to return an error if missing body", async () => {
        const req = mockReq();
        const res = mockRes();
        req.body = {};

        await deleteTransactions(req, res);

        expect(verifyAuth).not.toHaveBeenCalled();
        expect(transactions.deleteMany).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "Missing body attributes" });
    });
    test("Expected to return an error if user is not an Admin", async () => {
        const req = mockReq();
        const res = mockRes();
        const authMessage = "Not an admin";
        verifyAuth.mockReturnValue({ flag: false, cause: authMessage });

        await deleteTransactions(req, res);

        expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: "Admin" });
        expect(transactions.deleteMany).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: authMessage });
    });
    test("Expected to return an error if an id is an empty string", async () => {
        const req = mockReq();
        const res = mockRes();
        req.body._ids = ["1", ""];
        jest.spyOn(transactions, "findById").mockResolvedValue({});
        jest.spyOn(transactions, "deleteMany").mockResolvedValue({});

        await deleteTransactions(req, res);

        expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: "Admin" });
        expect(transactions.findById).toHaveBeenCalledTimes(1);
        expect(transactions.deleteMany).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "Invalid transaction id" });
    });
    test("Expected to return an error if an id is not in the db", async () => {
        const req = mockReq();
        const res = mockRes();
        req.body._ids = ["1", "2"];
        // mock the existance of first transaction, not the second
        jest.spyOn(transactions, "findById").mockResolvedValueOnce({});
        jest.spyOn(transactions, "findById").mockResolvedValueOnce(null);
        jest.spyOn(transactions, "deleteMany").mockResolvedValue({});

        await deleteTransactions(req, res);

        expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: "Admin" });
        expect(transactions.findById).toHaveBeenCalledTimes(2);
        expect(transactions.deleteMany).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "Invalid transaction id" });
    });
    test("Expect to return a server error if an exception occurs", async () => {
        const req = mockReq();
        const res = mockRes();
        const errorMessage = "Server error";
        jest.spyOn(transactions, "findById").mockResolvedValue({});
        jest
            .spyOn(transactions, "deleteMany")
            .mockRejectedValue(new Error(errorMessage));

        await deleteTransactions(req, res);

        expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: "Admin" });
        expect(transactions.findById).toHaveBeenCalledTimes(req.body._ids.length);
        expect(transactions.deleteMany).rejects.toThrowError(errorMessage);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
});
