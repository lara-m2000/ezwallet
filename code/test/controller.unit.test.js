import request from 'supertest';
import { app } from '../app';
import { categories, transactions } from '../models/model';
import { createCategory, updateCategory, deleteCategory, getCategories } from '../controllers/controller';
import { verifyAuth } from '../controllers/utils';

jest.mock('../models/model');
jest.mock('../controllers/utils.js');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('createCategory', () => {
    let req;
    let res;

    beforeEach(() => {
        req = {
            cookies: {},
            body: {
                type: 'CategoryType',
                color: 'CategoryColor'
            }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {},
        };
        verifyAuth.mockReturnValue({authorized:true, cause:"cause"});
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should create a new category successfully', async () => {
        categories.findOne = jest.fn().mockResolvedValueOnce(null);
        categories.prototype.save = jest.fn().mockResolvedValueOnce({
            type: req.body.type,
            color: req.body.color
        });

        await createCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            data: {
                type: req.body.type,
                color: req.body.color
            }
        });
    });

    test('should return an error if user is not authorized', async () => {
        const unauthorizedError = 'Unauthorized Error';
        verifyAuth.mockReturnValue({authorized: false, cause: unauthorizedError});

        await createCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: unauthorizedError });
    });

    test('should return an error if type or color is not valid', async () => {
        const invalidType = 123;
        const invalidColor = true;
        req.body.type = invalidType;
        req.body.color = invalidColor;

        await createCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid type or color' });
    });

    test('should return an error if category with the same type already exists', async () => {
        const existingCategory = { type: 'ExistingType', color: 'ExistingColor' };
        categories.findOne.mockResolvedValueOnce(existingCategory);

        await createCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Category with same type already exists' });
    });

    test('should return a server error if an exception occurs', async () => {
        const errorMessage = 'Internal Server Error';
        categories.findOne.mockRejectedValueOnce(new Error(errorMessage));

        await createCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
});
//Missing controls on authentication (probably will have to mock the verifyAuth() func after inserting it)
describe.skip("updateCategory", () => {
    // Mock request and response objects
    let req;
    let res;
    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            params: {
                type: 'old-category',
            },
            body: {
                type: 'new-category',
                color: 'new-color',
            },
        };
        res = {
            status: jest.fn(() => res),
            json: jest.fn(),
            locals: {
                message: "test message"
            }
        };
    });

    test('should return error 400 if category does not exist', async () => {
        // Mock the categories.findOne function to return null (category does not exist)
        categories.findOne = jest.fn().mockResolvedValueOnce(null);

        await updateCategory(req, res);

        // Verify the response
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "The category does not exist" });
    });

    test.todo('should return error 400 if parameters are invalid');

    test('should update category and related transactions', async () => {
        // Mock the categories.findOne function to return a category
        categories.findOne = jest.fn().mockResolvedValueOnce({ type: 'old-category' });

        // Mock the categories.updateOne and transactions.updateMany functions to return successful updates
        categories.updateOne = jest.fn().mockResolvedValueOnce();
        transactions.updateMany = jest.fn().mockResolvedValueOnce({ modifiedCount: 5 });

        await updateCategory(req, res);

        // Verify the response
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ data: { count: 5, message: 'Successfully updated' }, message: "test message" });

        // Verify the function calls
        expect(categories.updateOne).toHaveBeenCalledWith({ type: 'old-category' }, { $set: { type: 'new-category', color: 'new-color' } });
        expect(transactions.updateMany).toHaveBeenCalledWith({ type: 'old-category' }, { $set: { type: 'new-category' } });
    });

    test('should handle exception and return error 500', async () => {
        // Mock the categories.findOne function to throw an error
        categories.findOne = jest.fn().mockRejectedValueOnce(new Error('Database error'));

        await updateCategory(req, res);

        // Verify the response
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
    });
})
//Missing controls on authentication (probably will have to mock the verifyAuth() func after inserting it)
//NEED TO BE MODIFIED ACCORDING TO NEW REQUIREMENTS
describe.skip("deleteCategory", () => {
    // Mock request and response objects
    let req;
    let res;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            body: {
                types: ['category1', 'category2'],
            },
        };
        res = {
            status: jest.fn(() => res),
            json: jest.fn(),
            locals: {
                message: "test message"
            }
        };
    })

    test('should return error 401 if any category does not exist', async () => {
        // Mock the categories.findOne function to return null for one category
        categories.findOne = jest.fn().mockImplementation((query) => {
            if (query.type === 'category1') return { type: 'category1' };
            return null;
        });

        await deleteCategory(req, res);

        // Verify the response
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            message: 'The following categories do not exist: category2',
        });
    });

    test('should delete categories and update transactions', async () => {
        // Mock the categories.findOne function to return the categories
        categories.findOne.mockResolvedValueOnce({ type: 'category1' }).mockResolvedValueOnce({ type: 'category2' });

        // Mock the categories.deleteOne and transactions.updateMany functions to return successful deletions/updates
        categories.deleteOne.mockResolvedValue(undefined);
        transactions.updateMany.mockResolvedValue({ modifiedCount: 5 });

        await deleteCategory(req, res);

        // Verify the response
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ data: { message: 'Successfully deleted', count: 10 }, message: "test message" });

    });

    test('should handle and return error 400', async () => {
        // Mock the categories.findOne function to throw an error
        categories.findOne.mockRejectedValue(new Error('Database error'));

        await deleteCategory(req, res);

        // Verify the response
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
    });
})
//Missing controls on authentication (probably will have to mock the verifyAuth() func after inserting it)
//NEED TO BE MODIFIED ACCORDING TO NEW REQUIREMENTS
describe.skip("getCategories", () => {
    // Mock request and response objects
    let req;
    let res;
    beforeEach(() => {
        jest.clearAllMocks();
        req = {};
        res = {
            json: jest.fn(),
            status: jest.fn(() => res),
            locals: {
                message: "test message"
            }
        };
    });

    test('should return all categories', async () => {
        // Mock the categories.find function to return some data
        categories.find.mockResolvedValueOnce([
            { type: 'category1', color: 'red' },
            { type: 'category2', color: 'blue' },
        ]);

        await getCategories(req, res);

        // Verify the response
        expect(res.json).toHaveBeenCalledWith({
            data: [
                { type: 'category1', color: 'red' },
                { type: 'category2', color: 'blue' },
            ], message: "test message"
        });
    });

    test('should return an empty array if there are no categories', async () => {
        // Mock the categories.find function to return an empty array
        categories.find.mockResolvedValueOnce([]);

        await getCategories(req, res);

        // Verify the response
        expect(res.json).toHaveBeenCalledWith({ data: [], message: res.locals.message });
    });

    test('should handle and return error 400', async () => {
        // Mock the categories.find function to throw an error
        categories.find.mockRejectedValueOnce(new Error('Database error'));

        await getCategories(req, res);

        // Verify the response
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
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
