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
            locals: {refreshedTokenMessage: "RefreshToken"},
        };
        verifyAuth.mockReturnValue({ flag: true, cause: "cause" });
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
            },
        refreshedTokenMessage: "RefreshToken"});
    });

    test('should return an error if user is not authorized', async () => {
        const unauthorizedError = 'Unauthorized Error';
        verifyAuth.mockReturnValue({ flag: false, cause: unauthorizedError });

        await createCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: unauthorizedError });
    });

    test('should return an error if type or color is not a string', async () => {
        const invalidType = 123;
        const invalidColor = true;
        req.body.type = invalidType;
        req.body.color = invalidColor;

        await createCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid attribute' });
    });

    test('should return an error if type or color is empty', async () => {
        const invalidType = "   ";
        const invalidColor = "";
        req.body.type = invalidType;
        req.body.color = invalidColor;

        await createCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid attribute' });
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
            locals: {refreshedTokenMessage: "RefreshToken"},
        };
        verifyAuth.mockReturnValue({flag: true, cause:"cause"});
    });

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
        req.params.type = ' ';

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
});    
    
describe("deleteCategory", () => {
    // Mock request and response objects
    let req;
    let res;
    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            body: {
                types: ['category1','category2'],
            },
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "RefreshToken"
            }
        };
        verifyAuth.mockReturnValue({flag: true, cause:'cause'});
    })

    test('Should return an error if user is not authorized', async () => {
        const unauthorizedError = 'Unauthorized Error';
        verifyAuth.mockReturnValueOnce({flag: false, cause: unauthorizedError});

        await deleteCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: unauthorizedError });
    });

    test('Should return an error if types is not an array', async () => {
        req.body.types = 123;

        await deleteCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Types must be a non-void array' });
    });

    test('Should return an error if types is a void array', async () => {
        req.body.types = [];

        await deleteCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Types must be a non-void array' });
    });

    test('Should return an error if types contains void strings', async () => {
        req.body.types = ['category1','   '];

        await deleteCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Types must be an array of non-void strings' });
    });

    test('Should return an error if types contains non string elements', async () => {
        req.body.types = ['category1',123];

        await deleteCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Types must be an array of non-void strings' });
    });


    test('Should return error 400 if the number of existing categories is <=1', async () => {
        categories.countDocuments.mockResolvedValueOnce(1)
        
        await deleteCategory(req, res);
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Not enough categories to perform a deletion',
        });
    });

    test('Should return error 400 if one of the passed categories does not exist', async () => {
        categories.countDocuments.mockResolvedValueOnce(() => 4)
        categories.find.mockResolvedValueOnce(['category1'])
        
        
        await deleteCategory(req, res);
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'All categories must exist',
        });
    });

    test('Should delete categories and update transactions when #passed_categories=#db_categories', async () => {
        const sortMock = jest.fn();
        const limitMock = jest.fn();
        // Returns number of documents in the db
        categories.countDocuments.mockResolvedValueOnce(req.body.types.length)
        // Returns categories in the db that match the passed ones
        categories.find.mockResolvedValueOnce(req.body.types)
        // Returns the oldest category in the db
        categories.find.mockReturnValueOnce({sort: sortMock});
        sortMock.mockReturnValueOnce({limit: limitMock});
        limitMock.mockResolvedValueOnce([req.body.types[0]]);
        const deletedCategories = {modifiedCount: 1};
        // Update the transactions type and return the number of modified transactions
        transactions.updateMany.mockResolvedValueOnce(deletedCategories)

        await deleteCategory(req, res);
        
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            data: {message: "Categories deleted", count: deletedCategories.modifiedCount}, 
            refreshedTokenMessage: res.locals.refreshedTokenMessage});
    });

    test('Should delete categories and update transactions when #passed_categories<#db_categories', async () => {
        const sortMock = jest.fn();
        const limitMock = jest.fn();
        categories.countDocuments.mockResolvedValueOnce(req.body.types.length+1)
        categories.find.mockResolvedValueOnce(req.body.types)
        // Oldest category not deleted has to be retrieved from the db
        const oldestCategory = {type: 'category3'}
        categories.find.mockReturnValueOnce({sort: sortMock});
        sortMock.mockReturnValueOnce({limit: limitMock});
        limitMock.mockResolvedValueOnce([oldestCategory]);
        const deletedCategories = {modifiedCount: 2};
        transactions.updateMany.mockResolvedValueOnce(deletedCategories)

        await deleteCategory(req, res);
        
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            data: {message: "Categories deleted", count: deletedCategories.modifiedCount}, 
            refreshedTokenMessage: res.locals.refreshedTokenMessage});
    });

    test('should return a server error if an exception occurs', async () => {
        const errorMessage = 'Internal Server Error';
        categories.countDocuments.mockRejectedValueOnce(new Error(errorMessage));

        await deleteCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
});
    
describe("getCategories", () => {
    // Mock request and response objects
    let req;
    let res;
    beforeEach(() => {
        jest.clearAllMocks();
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "RefreshToken"
            }
        };
        verifyAuth.mockReturnValue({flag: true, cause:'cause'});
    });


    test('Should return an error if user is not authorized', async () => {
        const unauthorizedError = 'Unauthorized Error';
        verifyAuth.mockReturnValueOnce({flag: false, cause: unauthorizedError});

        await getCategories(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: unauthorizedError });
    });


    test('should return all categories', async () => {
        // Mock the categories.find function to return some data
        categories.find.mockResolvedValueOnce([
            { type: 'category1', color: 'red' },
            { type: 'category2', color: 'blue' },
        ]);

        await getCategories(req, res);
        // Verify the response
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            data: [
                { type: 'category1', color: 'red' },
                { type: 'category2', color: 'blue' },
            ], 
            refreshedTokenMessage: res.locals.refreshedTokenMessage
        });
    });

    test('should return an empty array if there are no categories', async () => {
        // Mock the categories.find function to return an empty array
        categories.find.mockResolvedValueOnce([]);
        await getCategories(req, res);
        // Verify the response
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ data: [], refreshedTokenMessage: res.locals.refreshedTokenMessage });
    });

    test('should handle and return error 500', async () => {
        // Mock the categories.find function to throw an error
        categories.find.mockRejectedValueOnce(new Error('Database error'));
        await getCategories(req, res);
        // Verify the response
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
    });
});

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
