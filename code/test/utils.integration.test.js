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
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
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
        expect(result.authorized).toBe(true);
        expect(result.cause).toBe("Authorized");
    });

    test('Should return false for missing token in req', () => {
        const info = { authType: 'Simple' };
        req.cookies.accessToken = undefined;
        req.cookies.refreshToken = undefined;

        const result = verifyAuth(req, res, info);

        expect(result.authorized).toBe(false);
        expect(result.cause).toBe("Unauthorized");
    });

    //Combination of missing information in accessToken
    test('Should return false for non valid simple authentication with accessToken missing username information (authType=Simple)', () => {
        const info = { authType: 'Simple' };
        req.cookies.accessToken = generateToken({email:'test@email.com', role: 'Regular', password: 'test_password'});
        req.cookies.refreshToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'});

        const result = verifyAuth(req, res, info);

        expect(result.authorized).toBe(false);
        expect(result.cause).toBe("Token is missing information");
    });
    test('Should return false for non valid simple authentication with accessToken missing email information (authType=Simple)', () => {
        const info = { authType: 'Simple' };
        req.cookies.accessToken = generateToken({username:'test_user', role: 'Regular', password: 'test_password'});
        req.cookies.refreshToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'});

        const result = verifyAuth(req, res, info);

        expect(result.authorized).toBe(false);
        expect(result.cause).toBe("Token is missing information");
    });
    test('Should return false for non valid simple authentication with accessToken missing role information (authType=Simple)', () => {
        const info = { authType: 'Simple' };
        req.cookies.accessToken = generateToken({username:'test_user', email:'test@email.com', password: 'test_password'});
        req.cookies.refreshToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'});

        const result = verifyAuth(req, res, info);

        expect(result.authorized).toBe(false);
        expect(result.cause).toBe("Token is missing information");
    });

    //Combination of missing information in refreshToken
    test('Should return false for non valid simple authentication with refreshToken missing username information (authType=Simple)', () => {
        const info = { authType: 'Simple' };
        req.cookies.accessToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'});
        req.cookies.refreshToken = generateToken({email:'test@email.com', role: 'Regular', password: 'test_password'});

        const result = verifyAuth(req, res, info);

        expect(result.authorized).toBe(false);
        expect(result.cause).toBe("Token is missing information");
    });
    test('Should return false for non valid simple authentication with refreshToken missing email information (authType=Simple)', () => {
        const info = { authType: 'Simple' };
        req.cookies.accessToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'});
        req.cookies.refreshToken = generateToken({username:'test_user', role: 'Regular', password: 'test_password'});

        const result = verifyAuth(req, res, info);

        expect(result.authorized).toBe(false);
        expect(result.cause).toBe("Token is missing information");
    });
    test('Should return false for non valid simple authentication with refreshToken missing role information (authType=Simple)', () => {
        const info = { authType: 'Simple' };
        req.cookies.accessToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'});
        req.cookies.refreshToken = generateToken({username:'test_user', email:'test@email.com', password: 'test_password'});

        const result = verifyAuth(req, res, info);

        expect(result.authorized).toBe(false);
        expect(result.cause).toBe("Token is missing information");
    });

    //Combination of information mismatched
    test('Should return false for non valid simple authentication with mismatch of username in the tokens (authType=Simple)', () => {
        const info = {authType: 'Simple'};
        req.cookies.accessToken = generateToken({username:'test_user1', email:'test@email.com', role: 'Regular', password: 'test_password'});
        req.cookies.refreshToken = generateToken({username:'test_user2', email:'test@email.com', role: 'Regular', password: 'test_password'});
        const result = verifyAuth(req, res, info);

        expect(result.authorized).toBe(false);
        expect(result.cause).toBe("Mismatched users");
    });
    test('Should return false for non valid simple authentication with mismatch of email in the tokens (authType=Simple)', () => {
        const info = {authType: 'Simple'};
        req.cookies.accessToken = generateToken({username:'test_user', email:'test1@email.com', role: 'Regular', password: 'test_password'});
        req.cookies.refreshToken = generateToken({username:'test_user', email:'test2@email.com', role: 'Regular', password: 'test_password'});
        const result = verifyAuth(req, res, info);

        expect(result.authorized).toBe(false);
        expect(result.cause).toBe("Mismatched users");
    });
    test('Should return false for non valid simple authentication with mismatch of role in the tokens (authType=Simple)', () => {
        const info = {authType: 'Simple'};
        req.cookies.accessToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'});
        req.cookies.refreshToken = generateToken({username:'test_user', email:'test@email.com', role: 'Admin', password: 'test_password'});
        const result = verifyAuth(req, res, info);

        expect(result.authorized).toBe(false);
        expect(result.cause).toBe("Mismatched users");
    });

    test('Should return true when refreshToken not expired and accessToken expired (authType=Simple)', () => {
        const info = {authType: 'Simple'};
        res.cookie = jest.fn(); //res.cookie is called inside the tested function
        req.cookies.accessToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'}, '0');
        req.cookies.refreshToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'});

        const result = verifyAuth(req, res, info);

        expect(result.authorized).toBe(true);
        expect(result.cause).toBe("Authorized");
        expect(res.locals.message).toBe('Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls');
    });

    test('Should return false when refreshToken expired and accessToken expired (authType=Simple)', () => {
        const info = { authType: 'Simple' };
        req.cookies.accessToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'}, '0');
        req.cookies.refreshToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'}, '0');

        const result = verifyAuth(req, res, info);

        expect(result.authorized).toBe(false);
        expect(result.cause).toBe("Perform login again");
    });

    //Combination of missing information when accessToken expired
    test('Should return false when refreshToken is missing username information and accessToken expired (authType=Simple)', () => {
        const info = { authType: 'Simple' };
        res.cookie = jest.fn();
        req.cookies.accessToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'}, '0');
        req.cookies.refreshToken = generateToken({ email:'test@email.com', role: 'Regular', password: 'test_password'});

        const result = verifyAuth(req, res, info);

        expect(result.authorized).toBe(false);
        expect(result.cause).toBe("Token is missing information");
    });
    test('Should return false when refreshToken is missing email information and accessToken expired (authType=Simple)', () => {
        const info = { authType: 'Simple' };
        res.cookie = jest.fn();
        req.cookies.accessToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'}, '0');
        req.cookies.refreshToken = generateToken({username:'test_user', role: 'Regular', password: 'test_password'});

        const result = verifyAuth(req, res, info);

        expect(result.authorized).toBe(false);
        expect(result.cause).toBe("Token is missing information");
    });
    test('Should return false when refreshToken is missing role information and accessToken expired (authType=Simple)', () => {
        const info = { authType: 'Simple' };
        res.cookie = jest.fn();
        req.cookies.accessToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'}, '0');
        req.cookies.refreshToken = generateToken({username:'test_user', email:'test@email.com', password: 'test_password'});

        const result = verifyAuth(req, res, info);

        expect(result.authorized).toBe(false);
        expect(result.cause).toBe("Token is missing information");
    });

    test('Should return false when accessToken expired and error occurs in jwt.verify (authType=Simple)', () => {
        const info = { authType: 'Simple' };
        req.cookies.accessToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'}, '0');
        req.cookies.refreshToken = 'dummy'
        const result = verifyAuth(req, res, info);

        expect(result.authorized).toBe(false);
        expect(result.cause).toBe("JsonWebTokenError");
    });

    test('Should return false when error occurs in jwt.verify (authType=Simple)', () => {
        const info = { authType: 'Simple' };
        req.cookies.accessToken = 'dummy'
        req.cookies.refreshToken = 'dummy'
        const result = verifyAuth(req, res, info);

        expect(result.authorized).toBe(false);
        expect(result.cause).toBe("JsonWebTokenError");
    });

    //AuthType=Admin
    test('Should return true for valid Admin authentication when role == Admin (authType=Admin)', () => {
        const info = { authType: 'Admin' };
        req.cookies.accessToken = generateToken({username:'test_admin', email:'test@email.com', role: 'Admin', password: 'test_password'});
        req.cookies.refreshToken = generateToken({username:'test_admin', email:'test@email.com', role: 'Admin', password: 'test_password'});

        const result = verifyAuth(req, res, info);

        expect(result.authorized).toBe(true);
        expect(result.cause).toBe("Authorized");
    });

    test('Should return false for non valid admin authentication with role!=Admin (authType=Admin)', () => {
        const info = { authType: 'Admin' };
        req.cookies.accessToken = generateToken({username:'test_admin', email:'test@email.com', role: 'Regular', password: 'test_password'});
        req.cookies.refreshToken = generateToken({username:'test_admin', email:'test@email.com', role: 'Regular', password: 'test_password'});

        const result = verifyAuth(req, res, info);

        expect(result.authorized).toBe(false);
        expect(result.cause).toBe("You need to be admin to perform this action");
    });

    test('Should return true when refreshToken not expired and accessToken expired and role == Admin (authType=Admin)', () => {
        const info = { authType: 'Admin' };
        res.cookie = jest.fn()
        req.cookies.accessToken = generateToken({username:'test_admin', email:'test@email.com', role: 'Admin', password: 'test_password'}, '0');
        req.cookies.refreshToken = generateToken({username:'test_admin', email:'test@email.com', role: 'Admin', password: 'test_password'});

        const result = verifyAuth(req, res, info);

        //Check if the appropriate functions were called
        expect(result.authorized).toBe(true);
        expect(result.cause).toBe("Authorized");
        expect(res.locals.message).toBe('Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls');
    });

    test('Should return false when refreshToken not expired and accessToken expired and role != Admin (authType=Admin)', () => {
        const info = { authType: 'Admin' };
        res.cookie = jest.fn();
        req.cookies.accessToken = generateToken({username:'test_admin', email:'test@email.com', role: 'Admin', password: 'test_password'}, '0');
        req.cookies.refreshToken = generateToken({username:'test_admin', email:'test@email.com', role: 'Regular', password: 'test_password'});

        const result = verifyAuth(req, res, info);

        expect(result.authorized).toBe(false);
        expect(result.cause).toBe("You need to be admin to perform this action");
    });

    //AuthType=User
    test('Should return true for valid User authentication when req.params.username == refreshToken.username == acessToken.username (authType=User)', () => {
        const info = { authType: 'User', username: 'test_user' };
        req.cookies.accessToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'});
        req.cookies.refreshToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'});

        const result = verifyAuth(req, res, info);

        expect(result.authorized).toBe(true);
        expect(result.cause).toBe("Authorized");
    });

    test('Should return false for non valid user authentication when req.params.username != refreshToken.username or != acessToken.username(authType=User)', () => {
        const info = { authType: 'User', username: 'test_user' };
        req.cookies.accessToken = generateToken({username:'different_test_user', email:'test@email.com', role: 'Regular', password: 'test_password'});
        req.cookies.refreshToken = generateToken({username:'different_test_user', email:'test@email.com', role: 'Regular', password: 'test_password'});

        const result = verifyAuth(req, res, info);

        expect(result.authorized).toBe(false);
        expect(result.cause).toBe("You cannot request info about another user");
    });

    test('Should return true when refreshToken not expired and accessToken expired and req.params.username == refreshToken.username (authType=User)', () => {
        const info = { authType: 'User', username: 'test_user' };
        res.cookie = jest.fn();
        req.cookies.accessToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'}, 0);
        req.cookies.refreshToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'});

        const result = verifyAuth(req, res, info);

        expect(result.authorized).toBe(true);
        expect(result.cause).toBe("Authorized");
        expect(res.locals.message).toBe('Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls');
    });

    test('Should return false when refreshToken not expired and accessToken expired and req.params.username != refreshToken.username (authType=User)', () => {
        const info = { authType: 'User', username: 'test_user' };
        res.cookie = jest.fn();
        req.cookies.accessToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'}, 0);
        req.cookies.refreshToken = generateToken({username:'different_test_user', email:'test@email.com', role: 'Regular', password: 'test_password'});

        const result = verifyAuth(req, res, info);

        expect(result.authorized).toBe(false);
        expect(result.cause).toBe("You cannot request info about another user");
    });

    //AuthType=Group
    test('Should return true for valid Group authentication when accessToken and refreshToken have a `email` which is in the requested group (authType=Group)', () => {
        const info = { authType: 'Group', emails:["test@email.com", "test2@email.com", "test3@email.com"] };
        req.cookies.accessToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'});
        req.cookies.refreshToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'});

        const result = verifyAuth(req, res, info);

        expect(result.authorized).toBe(true);
        expect(result.cause).toBe("Authorized");
    });

    test('Should return false for non valid user authentication when accessToken and refreshToken have a `email` which is not the requested group(authType=Group)', () => {
        const info = { authType: 'Group', emails:["test@email.com", "test2@email.com", "test3@email.com"] };
        req.cookies.accessToken = generateToken({username:'test_user', email:'test4@email.com', role: 'Regular', password: 'test_password'});
        req.cookies.refreshToken = generateToken({username:'test_user', email:'test4@email.com', role: 'Regular', password: 'test_password'});

        const result = verifyAuth(req, res, info);

        expect(result.authorized).toBe(false);
        expect(result.cause).toBe("You cannot request info about a group you don't belong to");
    });

    test('Should return true when refreshToken not expired and accessToken expired and refreshToken has an email which is in the requested group (authType=Group)', () => {
        const info = { authType: 'Group', emails:["test@email.com", "test2@email.com", "test3@email.com"] };
        res.cookie = jest.fn();
        req.cookies.accessToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'}, '0');
        req.cookies.refreshToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'});

        const result = verifyAuth(req, res, info);

        //Check if the appropriate functions were called
        expect(result.authorized).toBe(true);
        expect(result.cause).toBe("Authorized");
        expect(res.locals.message).toBe('Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls');
    });

    test('Should return false when refreshToken not expired and accessToken expired and refreshToken has an email which is not in the requested group (authType=Group)', () => {
        const info = { authType: 'Group', emails:["test@email.com", "test2@email.com", "test3@email.com"] };
        res.cookie = jest.fn();
        req.cookies.accessToken = generateToken({username:'test_user', email:'test@email.com', role: 'Regular', password: 'test_password'}, '0');
        req.cookies.refreshToken = generateToken({username:'test_user', email:'test4@email.com', role: 'Regular', password: 'test_password'});

        const result = verifyAuth(req, res, info);

        expect(result.authorized).toBe(false);
        expect(result.cause).toBe("You cannot request info about a group you don't belong to");
    });

});


describe("handleAmountFilterParams", () => {
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})
