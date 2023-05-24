import request from 'supertest';
import { app } from '../app';
import { categories, transactions } from '../models/model';
import { createCategory, updateCategory, deleteCategory, getCategories } from '../controllers/controller';
import { verifyAuth } from '../controllers/utils';

jest.mock('../models/model');
jest.mock('../controllers/utils.js');



describe('createCategory', () => {
    let req;
    let res;

    beforeEach(() => {
        jest.resetAllMocks();
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
        verifyAuth.mockReturnValue({ authorized: true, cause: "cause" });
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
        verifyAuth.mockReturnValue({ authorized: false, cause: unauthorizedError });

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

describe('updateCategory', () => {
    let req;
    let res;

    beforeEach(() => {
        jest.resetAllMocks();
        req = {
            params: {
                type: 'OldCategoryType'
            },
            body: {
                type: 'NewCategoryType',
                color: 'NewCategoryColor'
            }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {message: "message"},
        };
        verifyAuth.mockReturnValue({authorized: true, cause:"cause"});
    });

    test('should update the category and related transactions successfully', async () => {
        const existingCategory = { type: 'OldCategoryType', color: 'OldCategoryColor' };
        categories.findOne = jest.fn().mockResolvedValueOnce(existingCategory);
        categories.updateOne = jest.fn().mockResolvedValueOnce({});
        const modifiedCount = 5;
        transactions.updateMany.mockResolvedValue({ modifiedCount });

        await updateCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            data: { count: modifiedCount, message: 'Successfully updated' },
            message: "message",
        });
    });

    test('should return an error if user is not authorized', async () => {
        const unauthorizedError = 'Unauthorized Error';
        verifyAuth.mockReturnValue({authorized: false, cause: unauthorizedError});

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

    test('should return an error if invalid type or color', async () => {
        req.body.type = 123;
        req.body.color = true;

        await updateCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid type or color' });
    });

    test('should return an error if the category does not exist', async () => {
        categories.findOne.mockResolvedValueOnce(null);

        await updateCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'The category does not exist' });
    });

    test('should return a server error if an exception occurs', async () => {
        const errorMessage = 'Internal Server Error';
        categories.findOne = jest.fn().mockRejectedValueOnce(new Error(errorMessage));

        await updateCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
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
