import { handleDateFilterParams, verifyAuth, handleAmountFilterParams } from '../controllers/utils';
import jwt from 'jsonwebtoken';
jest.mock('jsonwebtoken');

describe("handleDateFilterParams", () => {
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
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
        expect(result.authorized).toBe(true);
        expect(result.cause).toBe("Authorized");
    });

    test('Should return false for missing token in req', () => {
        const info = { authType: 'Simple' };
        req.cookies.accessToken = undefined;
        req.cookies.refreshToken = undefined;
        //Mock jwt.verify to return a non valid decodedToken
        jwt.verify.mockReturnValue({ email: "test@email", role: "Regular" })

        const result = verifyAuth(req, res, info);

        expect(result.authorized).toBe(false);
        expect(result.cause).toBe("Unauthorized");
    });

    test('Should return false for non valid simple authentication with accessToken missing information (authType=Simple)', () => {
        const info = { authType: 'Simple' };
        //Mock jwt.verify to return a non valid decodedToken
        //AccessToken is missing information
        jwt.verify.mockReturnValue({ email: "test@email", role: "Regular" })

        const result = verifyAuth(req, res, info);

        expect(result.authorized).toBe(false);
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

        expect(result.authorized).toBe(false);
        expect(result.cause).toBe("Token is missing information");
    });

    test('Should return false for non valid simple authentication with mismatch of information in the tokens (authType=Simple)', () => {
        const info = { authType: 'Simple' };
        //Mock jwt.verify to return mismatched decodedTokens
        jwt.verify.mockReturnValueOnce({ username: "testuser1", email: "test@email1", role: "Regular" }).mockReturnValueOnce({ username: "testuser2", email: "test@email2", role: "Regular" })

        const result = verifyAuth(req, res, info);

        expect(result.authorized).toBe(false);
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
        expect(result.authorized).toBe(true);
        expect(result.cause).toBe("Authorized");
        expect(res.cookie).toHaveBeenCalledWith('accessToken', 'newAccessToken', { httpOnly: true, path: '/api', maxAge: 60 * 60 * 1000, sameSite: 'none', secure: true });
        expect(res.locals.message).toBe('Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls');
    });

    test('Should return false when refreshToken expired and accessToken expired (authType=Simple)', () => {
        const info = { authType: 'Simple' };
        //Mock jwt.verify to throw TokenExpiredError
        jwt.verify.mockImplementation(() => {
            throw Object.assign(new Error('TokenExpiredError'), { name: 'TokenExpiredError' });
        })

        const result = verifyAuth(req, res, info);

        //Check if the appropriate functions were called
        expect(result.authorized).toBe(false);
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

        expect(result.authorized).toBe(false);
        expect(result.cause).toBe("DecodeError");
    });

    test('Should return false when error occurs in jwt.verify (authType=Simple)', () => {
        const info = { authType: 'Simple' };
        //Mock jwt.verify to throw TokenExpiredError
        jwt.verify.mockImplementation(() => {
            throw Object.assign(new Error('DecodeError'), { name: 'DecodeError' });
        })
        const result = verifyAuth(req, res, info);

        expect(result.authorized).toBe(false);
        expect(result.cause).toBe("DecodeError");
    });
    //AuthType=Admin
    test('Should return true for valid Admin authentication when role == Admin (authType=Admin)', () => {
        const info = { authType: 'Admin' };
        //Mock jwt.verify to return a valid decodedToken
        jwt.verify.mockReturnValue({ username: "testname", email: "test@email", role: "Admin" })

        const result = verifyAuth(req, res, info);

        expect(result.authorized).toBe(true);
        expect(result.cause).toBe("Authorized");
    });

    test('Should return false for non valid admin authentication with role!=Admin (authType=Admin)', () => {
        const info = { authType: 'Admin' };
        //Mock jwt.verify to return a non valid decodedToken
        jwt.verify.mockReturnValue({ username: "testuser", email: "test@email", role: "Regular" })

        const result = verifyAuth(req, res, info);

        expect(result.authorized).toBe(false);
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
        expect(result.authorized).toBe(true);
        expect(result.cause).toBe("Authorized");
        expect(res.cookie).toHaveBeenCalledWith('accessToken', 'newAccessToken', { httpOnly: true, path: '/api', maxAge: 60 * 60 * 1000, sameSite: 'none', secure: true });
        expect(res.locals.message).toBe('Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls');
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

        expect(result.authorized).toBe(false);
        expect(result.cause).toBe("You need to be admin to perform this action");
    });
    //AuthType=User
    test('Should return true for valid User authentication when req.params.username == refreshToken.username == acessToken.username (authType=User)', () => {
        const info = { authType: 'User', username: 'testname' };
        //Mock jwt.verify to return a valid decodedToken
        jwt.verify.mockReturnValue({ username: "testname", email: "test@email", role: "Regular" })

        const result = verifyAuth(req, res, info);

        //Check if the appropriate functions were called
        expect(result.authorized).toBe(true);
        expect(result.cause).toBe("Authorized");
    });

    test('Should return false for non valid user authentication when req.params.username != refreshToken.username or != acessToken.username(authType=User)', () => {
        const info = { authType: 'User', username: 'different_testname'};
        //Mock jwt.verify to return a valid decodedToken
        jwt.verify.mockReturnValue({ username: "testname", email: "test@email", role: "Regular" })

        const result = verifyAuth(req, res, info);

        //Check if the appropriate functions were called
        expect(result.authorized).toBe(false);
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
        expect(result.authorized).toBe(true);
        expect(result.cause).toBe("Authorized");
        expect(res.cookie).toHaveBeenCalledWith('accessToken', 'newAccessToken', { httpOnly: true, path: '/api', maxAge: 60 * 60 * 1000, sameSite: 'none', secure: true });
        expect(res.locals.message).toBe('Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls');
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

        expect(result.authorized).toBe(false);
        expect(result.cause).toBe("You cannot request info about another user");
    });
    //AuthType=Group
    test('Should return true for valid Group authentication when accessToken and refreshToken have a `email` which is in the requested group (authType=Group)', () => {
        const info = { authType: 'Group', emails:["test@email", "test2@email", "test3@email"] };
        //Mock jwt.verify to return a valid decodedToken
        jwt.verify.mockReturnValue({ username: "testname", email: "test@email", role: "Regular" })

        const result = verifyAuth(req, res, info);

        expect(result.authorized).toBe(true);
        expect(result.cause).toBe("Authorized");
    });

    test('Should return false for non valid user authentication when accessToken and refreshToken have a `email` which is not the requested group(authType=Group)', () => {
        const info = { authType: 'Group', emails:["test@email", "test2@email", "test3@email"] };
        //Mock jwt.verify to return a valid decodedToken
        jwt.verify.mockReturnValue({ username: "testname", email: "test@email4", role: "Regular" })

        const result = verifyAuth(req, res, info);

        expect(result.authorized).toBe(false);
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
        expect(result.authorized).toBe(true);
        expect(result.cause).toBe("Authorized");
        expect(res.cookie).toHaveBeenCalledWith('accessToken', 'newAccessToken', { httpOnly: true, path: '/api', maxAge: 60 * 60 * 1000, sameSite: 'none', secure: true });
        expect(res.locals.message).toBe('Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls');
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

        expect(result.authorized).toBe(false);
        expect(result.cause).toBe("You cannot request info about a group you don't belong to");
    });
})

describe("handleAmountFilterParams", () => {
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})
