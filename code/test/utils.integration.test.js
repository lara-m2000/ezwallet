import { handleDateFilterParams, verifyAuth, handleAmountFilterParams } from '../controllers/utils';
import request from 'supertest';
import { app } from '../app';
import { User } from '../models/User.js';
import jwt from 'jsonwebtoken';
const bcrypt = require("bcryptjs")
import mongoose, { Model } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

beforeAll(async () => {
    const dbName = "testingDatabaseAuth";
    const url = `${process.env.MONGO_URI}/${dbName}`;
    /*They have {
      username: "test_username",
      email: "test@email.com"
      role: "Admin or Regular"
      password: "test_password"
    }*/
    
    await mongoose.connect(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

});

afterAll(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
});

describe("handleDateFilterParams", () => {
    let req;
    beforeEach(() => {
        req={query:{}};
    });

    test("Expect to return an empty object when called without query params", () => {
        const result=handleDateFilterParams(req);
        expect(result).toEqual({});
    });
    test("Expect to return a `date` attribute with `$gte` attribute from `from` query",()=>{
        req.query={from: "2023-04-30"};
        const result=handleDateFilterParams(req);
        expect(result.date.$gte).toEqual(new Date("2023-04-30T00:00:00.000Z"));
        expect(result.date.$lte).toBeUndefined();
    });
    test("Expect to return a `date` attribute with `$lte` attribute from 'upTo' query",()=>{
        req.query={upTo: "2023-04-30"};
        const result=handleDateFilterParams(req);
        expect(result.date.$lte).toEqual(new Date("2023-04-30T23:59:59.999Z"));
        expect(result.date.$gte).toBeUndefined();
    });
    test("Expect to return a `date` attribute with `$lte` and `$gte` from 'from' and 'upTo' query",()=>{
        req.query={from: "2023-04-30", upTo:"2023-05-10"};
        const result=handleDateFilterParams(req);
        expect(result.date.$gte).toEqual(new Date("2023-04-30T00:00:00.000Z"));
        expect(result.date.$lte).toEqual(new Date("2023-05-10T23:59:59.999Z"));
    });
    test("Expect to return a `date` attribute with `$lte` and `$gte` from 'date' query",()=>{
        req.query={date: "2023-05-10"};
        const result=handleDateFilterParams(req);
        expect(result).toEqual({date: {
            $gte:new Date("2023-05-10T00:00:00.000Z"), 
            $lte:new Date("2023-05-10T23:59:59.999Z")}
        });
    });
    test("Expect to throw an error if `date` id present with another attribute",()=>{
        const reqs=[
            {query:{from:"2023-04-30", date: "2023-05-10"}},
            {query:{upTo:"2023-04-30", date: "2023-05-10"}}
        ];
        for (req of reqs){
            expect(()=>handleDateFilterParams(req)).toThrowError();
        }
    });

    test("Expect to throw an error if a query param is in the wrong format",()=>{
        const reqs=[
            {query:{date: "AA2023-05-10"}},
            {query:{from: "22023-05-10"}},
            {query:{upTo: "10-05-2023"}},
            {query:{from: "2023-05-10", upTo:" "}}
        ];
        for (req of reqs)
            expect(()=>handleDateFilterParams(req)).toThrowError();
    });
})


// Generate an access token with a specific payload
const generateToken = (payload, expirationTime = '1h') => {
    return jwt.sign(payload, 'EZWALLET', { expiresIn: expirationTime });
};

describe('verifyAuth', () => {
    let req, res;

    beforeEach(() => {
        req = {
            cookies: {},
        };

        res = {
            cookies: {},
            locals: {},
        };
    })

    test('Should return true for valid simple authentication (authType=Simple)', () => {
        const info = { authType: 'Simple' };
        req.cookies.accessToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'});
        req.cookies.refreshToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'});

        const result = verifyAuth(req, res, info);

        //Check if the appropriate results are returned
        expect(result.flag).toBe(true);
        expect(result.cause).toBe("Authorized");
    });

    test('Should return false for missing token in req', () => {
        const info = { authType: 'Simple' };
        req.cookies.accessToken = undefined;
        req.cookies.refreshToken = undefined;

        const result = verifyAuth(req, res, info);

        expect(result.flag).toBe(false);
        expect(result.cause).toBe("Unauthorized");
    });

    //Combination of missing information in accessToken
    test('Should return false for non valid simple authentication with accessToken missing username information (authType=Simple)', () => {
        const info = { authType: 'Simple' };
        req.cookies.accessToken = generateToken({email:'test@email.com', role: 'Regular', password: 'test_password'});
        req.cookies.refreshToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'});

        const result = verifyAuth(req, res, info);

        expect(result.flag).toBe(false);
        expect(result.cause).toBe("Token is missing information");
    });
    test('Should return false for non valid simple authentication with accessToken missing email information (authType=Simple)', () => {
        const info = { authType: 'Simple' };
        req.cookies.accessToken = generateToken({username:'test_user', role: 'Regular', password: 'test_password'});
        req.cookies.refreshToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'});

        const result = verifyAuth(req, res, info);

        expect(result.flag).toBe(false);
        expect(result.cause).toBe("Token is missing information");
    });
    test('Should return false for non valid simple authentication with accessToken missing role information (authType=Simple)', () => {
        const info = { authType: 'Simple' };
        req.cookies.accessToken = generateToken({username:'test_user', email:'test@email.com', password: 'test_password'});
        req.cookies.refreshToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'});

        const result = verifyAuth(req, res, info);

        expect(result.flag).toBe(false);
        expect(result.cause).toBe("Token is missing information");
    });

    //Combination of missing information in refreshToken
    test('Should return false for non valid simple authentication with refreshToken missing username information (authType=Simple)', () => {
        const info = { authType: 'Simple' };
        req.cookies.accessToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'});
        req.cookies.refreshToken = generateToken({email:'test@email.com', role: 'Regular', password: 'test_password'});

        const result = verifyAuth(req, res, info);

        expect(result.flag).toBe(false);
        expect(result.cause).toBe("Token is missing information");
    });
    test('Should return false for non valid simple authentication with refreshToken missing email information (authType=Simple)', () => {
        const info = { authType: 'Simple' };
        req.cookies.accessToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'});
        req.cookies.refreshToken = generateToken({username:'test_user', role: 'Regular', password: 'test_password'});

        const result = verifyAuth(req, res, info);

        expect(result.flag).toBe(false);
        expect(result.cause).toBe("Token is missing information");
    });
    test('Should return false for non valid simple authentication with refreshToken missing role information (authType=Simple)', () => {
        const info = { authType: 'Simple' };
        req.cookies.accessToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'});
        req.cookies.refreshToken = generateToken({username:'test_user', email:'test@email.com', password: 'test_password'});

        const result = verifyAuth(req, res, info);

        expect(result.flag).toBe(false);
        expect(result.cause).toBe("Token is missing information");
    });

    //Combination of information mismatched
    test('Should return false for non valid simple authentication with mismatch of username in the tokens (authType=Simple)', () => {
        const info = {authType: 'Simple'};
        req.cookies.accessToken = generateToken({username:'test_user1', email:'test@email.com', role: 'Regular', password: 'test_password'});
        req.cookies.refreshToken = generateToken({username:'test_user2', email:'test@email.com', role: 'Regular', password: 'test_password'});
        const result = verifyAuth(req, res, info);

        expect(result.flag).toBe(false);
        expect(result.cause).toBe("Mismatched users");
    });
    test('Should return false for non valid simple authentication with mismatch of email in the tokens (authType=Simple)', () => {
        const info = {authType: 'Simple'};
        req.cookies.accessToken = generateToken({username:'test_user', email:'test1@email.com', role: 'Regular', password: 'test_password'});
        req.cookies.refreshToken = generateToken({username:'test_user', email:'test2@email.com', role: 'Regular', password: 'test_password'});
        const result = verifyAuth(req, res, info);

        expect(result.flag).toBe(false);
        expect(result.cause).toBe("Mismatched users");
    });
    test('Should return false for non valid simple authentication with mismatch of role in the tokens (authType=Simple)', () => {
        const info = {authType: 'Simple'};
        req.cookies.accessToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'});
        req.cookies.refreshToken = generateToken({username:'test_user', email:'test@email.com', role: 'Admin', password: 'test_password'});
        const result = verifyAuth(req, res, info);

        expect(result.flag).toBe(false);
        expect(result.cause).toBe("Mismatched users");
    });

    test('Should return true when refreshToken not expired and accessToken expired (authType=Simple)', () => {
        const info = {authType: 'Simple'};
        res.cookie = jest.fn(); //res.cookie is called inside the tested function
        req.cookies.accessToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'}, '0');
        req.cookies.refreshToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'});

        const result = verifyAuth(req, res, info);

        expect(result.flag).toBe(true);
        expect(result.cause).toBe("Authorized");
        expect(res.locals.refreshedTokenMessage).toBe('Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls');
    });

    test('Should return false when refreshToken expired and accessToken expired (authType=Simple)', () => {
        const info = { authType: 'Simple' };
        req.cookies.accessToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'}, '0');
        req.cookies.refreshToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'}, '0');

        const result = verifyAuth(req, res, info);

        expect(result.flag).toBe(false);
        expect(result.cause).toBe("Perform login again");
    });

    //Combination of missing information when accessToken expired
    test('Should return false when refreshToken is missing username information and accessToken expired (authType=Simple)', () => {
        const info = { authType: 'Simple' };
        res.cookie = jest.fn();
        req.cookies.accessToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'}, '0');
        req.cookies.refreshToken = generateToken({ email:'test@email.com', role: 'Regular', password: 'test_password'});

        const result = verifyAuth(req, res, info);

        expect(result.flag).toBe(false);
        expect(result.cause).toBe("Token is missing information");
    });
    test('Should return false when refreshToken is missing email information and accessToken expired (authType=Simple)', () => {
        const info = { authType: 'Simple' };
        res.cookie = jest.fn();
        req.cookies.accessToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'}, '0');
        req.cookies.refreshToken = generateToken({username:'test_user', role: 'Regular', password: 'test_password'});

        const result = verifyAuth(req, res, info);

        expect(result.flag).toBe(false);
        expect(result.cause).toBe("Token is missing information");
    });
    test('Should return false when refreshToken is missing role information and accessToken expired (authType=Simple)', () => {
        const info = { authType: 'Simple' };
        res.cookie = jest.fn();
        req.cookies.accessToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'}, '0');
        req.cookies.refreshToken = generateToken({username:'test_user', email:'test@email.com', password: 'test_password'});

        const result = verifyAuth(req, res, info);

        expect(result.flag).toBe(false);
        expect(result.cause).toBe("Token is missing information");
    });

    test('Should return false when accessToken expired and error occurs in jwt.verify (authType=Simple)', () => {
        const info = { authType: 'Simple' };
        req.cookies.accessToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'}, '0');
        req.cookies.refreshToken = 'dummy'
        const result = verifyAuth(req, res, info);

        expect(result.flag).toBe(false);
        expect(result.cause).toBe("JsonWebTokenError");
    });

    test('Should return false when error occurs in jwt.verify (authType=Simple)', () => {
        const info = { authType: 'Simple' };
        req.cookies.accessToken = 'dummy'
        req.cookies.refreshToken = 'dummy'
        const result = verifyAuth(req, res, info);

        expect(result.flag).toBe(false);
        expect(result.cause).toBe("JsonWebTokenError");
    });

    //AuthType=Admin
    test('Should return true for valid Admin authentication when role == Admin (authType=Admin)', () => {
        const info = { authType: 'Admin' };
        req.cookies.accessToken = generateToken({username:'test_admin', email:'test@email.com', role: 'Admin', password: 'test_password'});
        req.cookies.refreshToken = generateToken({username:'test_admin', email:'test@email.com', role: 'Admin', password: 'test_password'});

        const result = verifyAuth(req, res, info);

        expect(result.flag).toBe(true);
        expect(result.cause).toBe("Authorized");
    });

    test('Should return false for non valid admin authentication with role!=Admin (authType=Admin)', () => {
        const info = { authType: 'Admin' };
        req.cookies.accessToken = generateToken({username:'test_admin', email:'test@email.com', role: 'Regular', password: 'test_password'});
        req.cookies.refreshToken = generateToken({username:'test_admin', email:'test@email.com', role: 'Regular', password: 'test_password'});

        const result = verifyAuth(req, res, info);

        expect(result.flag).toBe(false);
        expect(result.cause).toBe("You need to be admin to perform this action");
    });

    test('Should return true when refreshToken not expired and accessToken expired and role == Admin (authType=Admin)', () => {
        const info = { authType: 'Admin' };
        res.cookie = jest.fn()
        req.cookies.accessToken = generateToken({username:'test_admin', email:'test@email.com', role: 'Admin', password: 'test_password'}, '0');
        req.cookies.refreshToken = generateToken({username:'test_admin', email:'test@email.com', role: 'Admin', password: 'test_password'});

        const result = verifyAuth(req, res, info);

        //Check if the appropriate functions were called
        expect(result.flag).toBe(true);
        expect(result.cause).toBe("Authorized");
        expect(res.locals.refreshedTokenMessage).toBe('Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls');
    });

    test('Should return false when refreshToken not expired and accessToken expired and role != Admin (authType=Admin)', () => {
        const info = { authType: 'Admin' };
        res.cookie = jest.fn();
        req.cookies.accessToken = generateToken({username:'test_admin', email:'test@email.com', role: 'Admin', password: 'test_password'}, '0');
        req.cookies.refreshToken = generateToken({username:'test_admin', email:'test@email.com', role: 'Regular', password: 'test_password'});

        const result = verifyAuth(req, res, info);

        expect(result.flag).toBe(false);
        expect(result.cause).toBe("You need to be admin to perform this action");
    });

    //AuthType=User
    test('Should return true for valid User authentication when req.params.username == refreshToken.username == acessToken.username (authType=User)', () => {
        const info = { authType: 'User', username: 'test_user' };
        req.cookies.accessToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'});
        req.cookies.refreshToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'});

        const result = verifyAuth(req, res, info);

        expect(result.flag).toBe(true);
        expect(result.cause).toBe("Authorized");
    });

    test('Should return false for non valid user authentication when req.params.username != refreshToken.username or != acessToken.username(authType=User)', () => {
        const info = { authType: 'User', username: 'test_user' };
        req.cookies.accessToken = generateToken({username:'different_test_user', email:'test@email.com', role: 'Regular', password: 'test_password'});
        req.cookies.refreshToken = generateToken({username:'different_test_user', email:'test@email.com', role: 'Regular', password: 'test_password'});

        const result = verifyAuth(req, res, info);

        expect(result.flag).toBe(false);
        expect(result.cause).toBe("You cannot request info about another user");
    });

    test('Should return true when refreshToken not expired and accessToken expired and req.params.username == refreshToken.username (authType=User)', () => {
        const info = { authType: 'User', username: 'test_user' };
        res.cookie = jest.fn();
        req.cookies.accessToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'}, 0);
        req.cookies.refreshToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'});

        const result = verifyAuth(req, res, info);

        expect(result.flag).toBe(true);
        expect(result.cause).toBe("Authorized");
        expect(res.locals.refreshedTokenMessage).toBe('Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls');
    });

    test('Should return false when refreshToken not expired and accessToken expired and req.params.username != refreshToken.username (authType=User)', () => {
        const info = { authType: 'User', username: 'test_user' };
        res.cookie = jest.fn();
        req.cookies.accessToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'}, 0);
        req.cookies.refreshToken = generateToken({username:'different_test_user', email:'test@email.com', role: 'Regular', password: 'test_password'});

        const result = verifyAuth(req, res, info);

        expect(result.flag).toBe(false);
        expect(result.cause).toBe("You cannot request info about another user");
    });

    //AuthType=Group
    test('Should return true for valid Group authentication when accessToken and refreshToken have a `email` which is in the requested group (authType=Group)', () => {
        const info = { authType: 'Group', emails:["test@email.com", "test2@email.com", "test3@email.com"] };
        req.cookies.accessToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'});
        req.cookies.refreshToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'});

        const result = verifyAuth(req, res, info);

        expect(result.flag).toBe(true);
        expect(result.cause).toBe("Authorized");
    });

    test('Should return false for non valid user authentication when accessToken and refreshToken have a `email` which is not the requested group(authType=Group)', () => {
        const info = { authType: 'Group', emails:["test@email.com", "test2@email.com", "test3@email.com"] };
        req.cookies.accessToken = generateToken({username:'test_user', email:'test4@email.com', role: 'Regular', password: 'test_password'});
        req.cookies.refreshToken = generateToken({username:'test_user', email:'test4@email.com', role: 'Regular', password: 'test_password'});

        const result = verifyAuth(req, res, info);

        expect(result.flag).toBe(false);
        expect(result.cause).toBe("You cannot request info about a group you don't belong to");
    });

    test('Should return true when refreshToken not expired and accessToken expired and refreshToken has an email which is in the requested group (authType=Group)', () => {
        const info = { authType: 'Group', emails:["test@email.com", "test2@email.com", "test3@email.com"] };
        res.cookie = jest.fn();
        req.cookies.accessToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'}, '0');
        req.cookies.refreshToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'});

        const result = verifyAuth(req, res, info);

        //Check if the appropriate functions were called
        expect(result.flag).toBe(true);
        expect(result.cause).toBe("Authorized");
        expect(res.locals.refreshedTokenMessage).toBe('Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls');
    });

    test('Should return false when refreshToken not expired and accessToken expired and refreshToken has an email which is not in the requested group (authType=Group)', () => {
        const info = { authType: 'Group', emails:["test@email.com", "test2@email.com", "test3@email.com"] };
        res.cookie = jest.fn();
        req.cookies.accessToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'}, '0');
        req.cookies.refreshToken = generateToken({username:'test_user', email:'test4@email.com', role: 'Regular', password: 'test_password'});

        const result = verifyAuth(req, res, info);

        expect(result.flag).toBe(false);
        expect(result.cause).toBe("You cannot request info about a group you don't belong to");
    });

});


describe("handleAmountFilterParams", () => {
    let req;
    beforeEach(() => {
        req={query:{}};
    });
    test('Expect to return empty object if no query params are passed', () => {
        const result=handleAmountFilterParams(req);
        expect(result).toEqual({});
    });
    test("Expect to return an `amount` attribute with `$gte` from `min` query", ()=>{
        req.query={min:"10"};
        const result=handleAmountFilterParams(req);
        expect(result.amount.$gte).toEqual(10)
    })
    test("Expect to return an `amount` attribute with `$lte` from `max` query", ()=>{
        req.query={max:"50"};
        const result=handleAmountFilterParams(req);
        expect(result.amount.$lte).toEqual(50)
    })
    test("Expect to return an `amount` attribute with `$gte` and `$lte` from `min` and `max` query", ()=>{
        req.query={min:"10", max:"50"};
        const result=handleAmountFilterParams(req);
        expect(result.amount.$gte).toEqual(10);
        expect(result.amount.$lte).toEqual(50);
    })
    test("Expect to throw an error if amount is in the wrong format",()=>{
        const reqs=[
            {query:{min:"A10"}},
            {query:{min:"10", max: " "}},
        ];
        for (const req of reqs) {
            expect(()=>handleAmountFilterParams(req)).toThrowError();
        }
    })

})
