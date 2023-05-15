import request from 'supertest';
import { app } from '../app';
import { categories, transactions } from '../models/model';
import { createCategory } from '../controllers/controller';

jest.mock('../models/model');

beforeEach(() => {
    jest.clearAllMocks();
    /*categories.find.mockClear();
    categories.prototype.save.mockClear();
    transactions.find.mockClear();
    transactions.deleteOne.mockClear();
    transactions.aggregate.mockClear();
    transactions.prototype.save.mockClear();*/
});

//Missing controls on authentication, do i need to put them in here (?)
describe("createCategory", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should create a new category and return the category data', async () => {
        // Mock the request and response objects
        const req = {
            body: {
                type: 'Test Category',
                color: 'red',
            },
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        // Mock the category creation
        const mockSavedCategory = {
            type: 'Test Category',
            color: 'red',
        };
        categories.prototype.save.mockResolvedValue(mockSavedCategory);

        // Call the createCategory function
        await createCategory(req, res);

        // Check the response status and data
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ data: mockSavedCategory });
        expect(categories.prototype.save).toHaveBeenCalledTimes(1);
    });

    test('should return an error if there is an issue creating the category', async () => {
        // Mock the request and response objects
        const req = {
          body: {
            type: 'Test Category',
            color: 'red',
          },
        };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
    
        // Mock the category creation error
        const mockError = new Error('Database error');
        categories.prototype.save.mockRejectedValue(mockError);
    
        // Call the createCategory function
        await createCategory(req, res);
    
        // Check the response status and error message
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
        expect(categories.prototype.save).toHaveBeenCalledTimes(1);
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
