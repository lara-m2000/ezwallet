import request from 'supertest';
import { app } from '../app';
import { categories, transactions } from '../models/model';
import { createCategory, updateCategory } from '../controllers/controller';

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

//Missing controls on authentication (probably will have to mock the verifyAuth() func after inserting it)
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
  // Mock request and response objects
  const req = {
    params: {
      type: 'old-category',
    },
    body: {
      type: 'new-category',
      color: 'new-color',
    },
  };
  const res = {
    status: jest.fn(() => res),
    json: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return error 401 if category does not exist', async () => {
    // Mock the categories.findOne function to return null (category does not exist)
    categories.findOne = jest.fn().mockResolvedValueOnce(null);

    await updateCategory(req, res);

    // Verify the response
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ data: { count: 0 }, message: 'The category does not exist' });
  });

  test('should update category and related transactions', async () => {
    // Mock the categories.findOne function to return a category
    categories.findOne = jest.fn().mockResolvedValueOnce({ type: 'old-category' });

    // Mock the categories.updateOne and transactions.updateMany functions to return successful updates
    categories.updateOne = jest.fn().mockResolvedValueOnce();
    transactions.updateMany = jest.fn().mockResolvedValueOnce({ modifiedCount: 5 });

    await updateCategory(req, res);

    // Verify the response
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ data: { count: 5 }, message: 'Successfully updated' });

    // Verify the function calls
    expect(categories.updateOne).toHaveBeenCalledWith({ type: 'old-category' }, { $set: { type: 'new-category', color: 'new-color' } });
    expect(transactions.updateMany).toHaveBeenCalledWith({ type: 'old-category' }, { $set: { type: 'new-category' } });
  });

  /*test('should return error 401 if unauthorized', async () => {
    // Mock the categories.findOne function to return a category
    categories.findOne = jest.fn().mockResolvedValueOnce({ type: 'old-category' });

    // Uncomment the following lines to simulate an unauthorized request
    // req.cookies = {};

    await updateCategory(req, res);

    // Verify the response
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
  });*/

  test('should handle and return error 401', async () => {
    // Mock the categories.findOne function to throw an error
    categories.findOne = jest.fn().mockRejectedValueOnce(new Error('Database error'));

    await updateCategory(req, res);

    // Verify the response
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
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
