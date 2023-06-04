import { handleDateFilterParams, verifyAuth, handleAmountFilterParams } from '../controllers/utils';
import jwt from 'jsonwebtoken';
jest.mock('jsonwebtoken');

describe("handleDateFilterParams", () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Expect to return an empty object without query params", () => {
        const req={query:{}};
        const result=handleDateFilterParams(req);
        expect(result).toEqual({});
    });
    test("Expect to return an object with 'from' query",()=>{
        const req={query:{from: "2023-04-30"}};

        const result=handleDateFilterParams(req);
        
        expect(result.date.$gte).toEqual(new Date("2023-04-30T00:00:00.000Z"));
    });
    test("Expect to return an object with 'upTo' query",()=>{
        const req={query:{upTo: "2023-04-30"}};

        const result=handleDateFilterParams(req);
        
        expect(result.date.$lte).toEqual(new Date("2023-04-30T23:59:59.999Z"));
    });
    test("Expect to return an object with 'from' and 'upTo' query",()=>{
        const req={query:{from: "2023-04-30", upTo:"2023-05-10"}};

        const result=handleDateFilterParams(req);
        
        expect(result.date.$gte).toEqual(new Date("2023-04-30T00:00:00.000Z"));
        expect(result.date.$lte).toEqual(new Date("2023-05-10T23:59:59.999Z"));
    });
    test("Expect to return an object with 'date' query",()=>{
        const req={query:{date: "2023-05-10"}};

        const result=handleDateFilterParams(req);
        
        expect(result).toEqual({date: {
            $gte:new Date("2023-05-10T00:00:00.000Z"), 
            $lte:new Date("2023-05-10T23:59:59.999Z")}
        });
    });
    test("Expect to throw an error if 'date' and 'from' are present",()=>{
        const req={query:{from:"2023-04-30", date: "2023-05-10"}};
        
        expect(()=>handleDateFilterParams(req)).toThrowError();
    });
    test("Expect to throw an error if 'date' and 'upTo' are present",()=>{
        const req={query:{upTo:"2023-04-30", date: "2023-05-10"}};
        
        expect(()=>handleDateFilterParams(req)).toThrowError();
    });
    test("Expect to throw an error if 'date' in wrong format",()=>{
        const req={query:{date: "AA2023-05-10"}};
        
        expect(()=>handleDateFilterParams(req)).toThrowError();
    });
    test("Expect to throw an error if 'from' in wrong format",()=>{
        const req={query:{from: "22023-05-10"}};
        
        expect(()=>handleDateFilterParams(req)).toThrowError();
    });
    test("Expect to throw an error if 'upTo' in wrong format",()=>{
        const req={query:{upTo: "10-05-2023"}};
        
        expect(()=>handleDateFilterParams(req)).toThrowError();
    });
})

describe("verifyAuth", () => {
    let req = {};
    let res;
    beforeEach(() => {
        jest.resetAllMocks();
        req = { cookies: { accessToken: "acessToken", refreshToken: "refreshToken" } }
        res = {
            cookie: jest.fn(),
            locals: {},
        }
    })
    test('Should return true for valid simple authentication (authType=Simple)', () => {
        const info = { authType: 'Simple' };
        //Mock jwt.verify to return a valid decodedToken
        jwt.verify.mockReturnValue({ username: "testname", email: "test@email", role: "Regular" })

        const result = verifyAuth(req, res, info);

        //Check if the appropriate results are returned
        expect(result.flag).toBe(true);
        expect(result.cause).toBe("Authorized");
    });

    test('Should return false for missing token in req', () => {
        const info = { authType: 'Simple' };
        req.cookies.accessToken = undefined;
        req.cookies.refreshToken = undefined;
        //Mock jwt.verify to return a non valid decodedToken
        jwt.verify.mockReturnValue({ email: "test@email", role: "Regular" })

        const result = verifyAuth(req, res, info);

        expect(result.flag).toBe(false);
        expect(result.cause).toBe("Unauthorized");
    });

    test('Should return false for non valid simple authentication with accessToken missing information (authType=Simple)', () => {
        const info = { authType: 'Simple' };
        //Mock jwt.verify to return a non valid decodedToken
        //AccessToken is missing information
        jwt.verify.mockReturnValue({ email: "test@email", role: "Regular" })

        const result = verifyAuth(req, res, info);

        expect(result.flag).toBe(false);
        expect(result.cause).toBe("Token is missing information");
    });

    test('Should return false for non valid simple authentication with refreshToken missing information (authType=Simple)', () => {
        const info = { authType: 'Simple' };
        let counter = 0;
        //Mock jwt.verify to return a non valid decodedToken
        jwt.verify.mockImplementation(() => {
            //AccessToken has correct information
            if (counter === 0) {
                counter++;
                return { username: "testname", email: "test@email", role: "Regular" }
            }
            //RefreshToken is missing information
            else {
                return { email: "test@email", role: "Regular" };
            }
        })

        const result = verifyAuth(req, res, info);

        expect(result.flag).toBe(false);
        expect(result.cause).toBe("Token is missing information");
    });

    test('Should return false for non valid simple authentication with mismatch of information in the tokens (authType=Simple)', () => {
        const info = { authType: 'Simple' };
        //Mock jwt.verify to return mismatched decodedTokens
        jwt.verify.mockReturnValueOnce({ username: "testuser1", email: "test@email1", role: "Regular" }).mockReturnValueOnce({ username: "testuser2", email: "test@email2", role: "Regular" })

        const result = verifyAuth(req, res, info);

        expect(result.flag).toBe(false);
        expect(result.cause).toBe("Mismatched users");
    });

    test('Should return true when refreshToken not expired and accessToken expired (authType=Simple)', () => {
        const info = { authType: 'Simple' };
        let counter = 0;
        //Mock jwt.verify to throw TokenExpiredError the first time it's called
        jwt.verify.mockImplementation(() => {
            if (counter == 0) {
                counter++;
                throw Object.assign(new Error('TokenExpiredError'), { name: 'TokenExpiredError' });
            }
            else
                return {username:"testname", email:"test_email", role:"Regular"};
        })
        //Mock jwt.sign to return the new accessToken
        jwt.sign.mockReturnValue("newAccessToken");

        const result = verifyAuth(req, res, info);

        //Check if the appropriate functions were called
        expect(result.flag).toBe(true);
        expect(result.cause).toBe("Authorized");
        expect(res.cookie).toHaveBeenCalledWith('accessToken', 'newAccessToken', { httpOnly: true, path: '/api', maxAge: 60 * 60 * 1000, sameSite: 'none', secure: true });
        expect(res.locals.refreshedTokenMessage).toBe('Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls');
    });

    test('Should return false when refreshToken expired and accessToken expired (authType=Simple)', () => {
        const info = { authType: 'Simple' };
        //Mock jwt.verify to throw TokenExpiredError
        jwt.verify.mockImplementation(() => {
            throw Object.assign(new Error('TokenExpiredError'), { name: 'TokenExpiredError' });
        })

        const result = verifyAuth(req, res, info);

        //Check if the appropriate functions were called
        expect(result.flag).toBe(false);
        expect(result.cause).toBe("Perform login again");
    });

    test('Should return false when refreshToken not valid and accessToken expired (authType=Simple)', () => {
        const info = { authType: 'Simple' };
        //Mock jwt.verify to throw TokenExpiredError
        let counter = 0;
        jwt.verify.mockImplementation(() => {
            if (counter === 0) {
                counter++;
                throw Object.assign(new Error('TokenExpiredError'), { name: 'TokenExpiredError' });
            }
            else {
                throw Object.assign(new Error('DecodeError'), { name: 'DecodeError' });
            }
        })

        const result = verifyAuth(req, res, info);

        expect(result.flag).toBe(false);
        expect(result.cause).toBe("DecodeError");
    });

    test('Should return false when error occurs in jwt.verify (authType=Simple)', () => {
        const info = { authType: 'Simple' };
        //Mock jwt.verify to throw TokenExpiredError
        jwt.verify.mockImplementation(() => {
            throw Object.assign(new Error('DecodeError'), { name: 'DecodeError' });
        })
        const result = verifyAuth(req, res, info);

        expect(result.flag).toBe(false);
        expect(result.cause).toBe("DecodeError");
    });
    //AuthType=Admin
    test('Should return true for valid Admin authentication when role == Admin (authType=Admin)', () => {
        const info = { authType: 'Admin' };
        //Mock jwt.verify to return a valid decodedToken
        jwt.verify.mockReturnValue({ username: "testname", email: "test@email", role: "Admin" })

        const result = verifyAuth(req, res, info);

        expect(result.flag).toBe(true);
        expect(result.cause).toBe("Authorized");
    });

    test('Should return false for non valid admin authentication with role!=Admin (authType=Admin)', () => {
        const info = { authType: 'Admin' };
        //Mock jwt.verify to return a non valid decodedToken
        jwt.verify.mockReturnValue({ username: "testuser", email: "test@email", role: "Regular" })

        const result = verifyAuth(req, res, info);

        expect(result.flag).toBe(false);
        expect(result.cause).toBe("You need to be admin to perform this action");
    });

    test('Should return true when refreshToken not expired and accessToken expired and role == Admin (authType=Admin)', () => {
        const info = { authType: 'Admin' };
        let counter = 0;
        //Mock jwt.verify to throw TokenExpiredError the first time it's called
        jwt.verify.mockImplementation(() => {
            if (counter == 0) {
                counter++;
                throw Object.assign(new Error('TokenExpiredError'), { name: 'TokenExpiredError' });
            }
            else
                return { username: "testname", email: "test@email", role: "Admin" };
        })
        //Mock jwt.sign to return the new accessToken
        jwt.sign.mockReturnValue("newAccessToken");

        const result = verifyAuth(req, res, info);

        //Check if the appropriate functions were called
        expect(result.flag).toBe(true);
        expect(result.cause).toBe("Authorized");
        expect(res.cookie).toHaveBeenCalledWith('accessToken', 'newAccessToken', { httpOnly: true, path: '/api', maxAge: 60 * 60 * 1000, sameSite: 'none', secure: true });
        expect(res.locals.refreshedTokenMessage).toBe('Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls');
    });

    test('Should return false when refreshToken not expired and accessToken expired and role != Admin (authType=Admin)', () => {
        const info = { authType: 'Admin' };
        let counter = 0;
        //Mock jwt.verify to throw TokenExpiredError the first time it's called
        jwt.verify.mockImplementation(() => {
            if (counter == 0) {
                counter++;
                throw Object.assign(new Error('TokenExpiredError'), { name: 'TokenExpiredError' });
            }
            else
                return { username: "testname", email: "test@email", role: "Regular" };
        })

        const result = verifyAuth(req, res, info);

        expect(result.flag).toBe(false);
        expect(result.cause).toBe("You need to be admin to perform this action");
    });
    //AuthType=User
    test('Should return true for valid User authentication when req.params.username == refreshToken.username == acessToken.username (authType=User)', () => {
        const info = { authType: 'User', username: 'testname' };
        //Mock jwt.verify to return a valid decodedToken
        jwt.verify.mockReturnValue({ username: "testname", email: "test@email", role: "Regular" })

        const result = verifyAuth(req, res, info);

        //Check if the appropriate functions were called
        expect(result.flag).toBe(true);
        expect(result.cause).toBe("Authorized");
    });

    test('Should return false for non valid user authentication when req.params.username != refreshToken.username or != acessToken.username(authType=User)', () => {
        const info = { authType: 'User', username: 'different_testname'};
        //Mock jwt.verify to return a valid decodedToken
        jwt.verify.mockReturnValue({ username: "testname", email: "test@email", role: "Regular" })

        const result = verifyAuth(req, res, info);

        //Check if the appropriate functions were called
        expect(result.flag).toBe(false);
        expect(result.cause).toBe("You cannot request info about another user");
    });

    test('Should return true when refreshToken not expired and accessToken expired and req.params.username == refreshToken.username (authType=User)', () => {
        const info = { authType: 'User', username: 'testname'};
        req.params = { username: 'testname' };
        let counter = 0;
        //Mock jwt.verify to throw TokenExpiredError the first time it's called
        jwt.verify.mockImplementation(() => {
            if (counter == 0) {
                counter++;
                throw Object.assign(new Error('TokenExpiredError'), { name: 'TokenExpiredError' });
            }
            else
                return { username: "testname", email: "test@email", role: "Regular" };
        })
        //Mock jwt.sign to return the new accessToken
        jwt.sign.mockReturnValue("newAccessToken");

        const result = verifyAuth(req, res, info);

        //Check if the appropriate functions were called
        expect(result.flag).toBe(true);
        expect(result.cause).toBe("Authorized");
        expect(res.cookie).toHaveBeenCalledWith('accessToken', 'newAccessToken', { httpOnly: true, path: '/api', maxAge: 60 * 60 * 1000, sameSite: 'none', secure: true });
        expect(res.locals.refreshedTokenMessage).toBe('Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls');
    });

    test('Should return false when refreshToken not expired and accessToken expired and req.params.username != refreshToken.username (authType=User)', () => {
        const info = { authType: 'User', username: 'different_testname' };
        let counter = 0;
        //Mock jwt.verify to throw TokenExpiredError the first time it's called
        jwt.verify.mockImplementation(() => {
            if (counter == 0) {
                counter++;
                throw Object.assign(new Error('TokenExpiredError'), { name: 'TokenExpiredError' });
            }
            else
                return { username: "testname", email: "test@email", role: "Regular" };
        })

        const result = verifyAuth(req, res, info);

        expect(result.flag).toBe(false);
        expect(result.cause).toBe("You cannot request info about another user");
    });
    //AuthType=Group
    test('Should return true for valid Group authentication when accessToken and refreshToken have a `email` which is in the requested group (authType=Group)', () => {
        const info = { authType: 'Group', emails:["test@email", "test2@email", "test3@email"] };
        //Mock jwt.verify to return a valid decodedToken
        jwt.verify.mockReturnValue({ username: "testname", email: "test@email", role: "Regular" })

        const result = verifyAuth(req, res, info);

        expect(result.flag).toBe(true);
        expect(result.cause).toBe("Authorized");
    });

    test('Should return false for non valid user authentication when accessToken and refreshToken have a `email` which is not the requested group(authType=Group)', () => {
        const info = { authType: 'Group', emails:["test@email", "test2@email", "test3@email"] };
        //Mock jwt.verify to return a valid decodedToken
        jwt.verify.mockReturnValue({ username: "testname", email: "test@email4", role: "Regular" })

        const result = verifyAuth(req, res, info);

        expect(result.flag).toBe(false);
        expect(result.cause).toBe("You cannot request info about a group you don't belong to");
    });

    test('Should return true when refreshToken not expired and accessToken expired and req.params.username == refreshToken.username (authType=User)', () => {
        const info = { authType: 'Group', emails:["test@email", "test2@email", "test3@email"] };
        let counter = 0;
        //Mock jwt.verify to throw TokenExpiredError the first time it's called
        jwt.verify.mockImplementation(() => {
            if (counter == 0) {
                counter++;
                throw Object.assign(new Error('TokenExpiredError'), { name: 'TokenExpiredError' });
            }
            else
                return { username: "testname", email: "test@email", role: "Regular" };
        })
        //Mock jwt.sign to return the new accessToken
        jwt.sign.mockReturnValue("newAccessToken");

        const result = verifyAuth(req, res, info);

        //Check if the appropriate functions were called
        expect(result.flag).toBe(true);
        expect(result.cause).toBe("Authorized");
        expect(res.cookie).toHaveBeenCalledWith('accessToken', 'newAccessToken', { httpOnly: true, path: '/api', maxAge: 60 * 60 * 1000, sameSite: 'none', secure: true });
        expect(res.locals.refreshedTokenMessage).toBe('Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls');
    });

    test('Should return false when refreshToken not expired and accessToken expired and req.params.username != refreshToken.username (authType=User)', () => {
        const info = { authType: 'Group', emails:["test@email", "test2@email", "test3@email"] };
        let counter = 0;
        //Mock jwt.verify to throw TokenExpiredError the first time it's called
        jwt.verify.mockImplementation(() => {
            if (counter == 0) {
                counter++;
                throw Object.assign(new Error('TokenExpiredError'), { name: 'TokenExpiredError' });
            }
            else
                return { username: "testname", email: "test@email4", role: "Regular" };
        })

        const result = verifyAuth(req, res, info);

        expect(result.flag).toBe(false);
        expect(result.cause).toBe("You cannot request info about a group you don't belong to");
    });
})

describe("handleAmountFilterParams", () => { 
    test('Expect empty object if no query params', () => {
        const req={query:{}};

        const result=handleAmountFilterParams(req);
        
        expect(result).toEqual({});
    });
    test("Expect to return an object with 'min' query", ()=>{
        const req={query:{min:"10"}};
        const result=handleAmountFilterParams(req);
        expect(result.amount.$gte).toEqual(10)
    })
    test("Expect to return an object with 'max' query", ()=>{
        const req={query:{max:"50"}};
        const result=handleAmountFilterParams(req);
        expect(result.amount.$lte).toEqual(50)
    })
    test("Expect to return an object with 'min' and 'max' query", ()=>{
        const req={query:{min:"10", max:"50"}};
        const result=handleAmountFilterParams(req);
        expect(result.amount.$gte).toEqual(10);
        expect(result.amount.$lte).toEqual(50);
    })
    test("Expect to throw an error if wrong amount format",()=>{
        const req={query:{min:"A10"}};

        expect(()=>handleAmountFilterParams(req)).toThrowError();
    })
})
