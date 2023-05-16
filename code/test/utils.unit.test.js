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
        jest.clearAllMocks();
        req = { cookies: { accessToken: "acessToken", refreshToken: "refreshToken" } }
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            cookie: jest.fn(),
            locals: {},
        }
    })
    test('Should return true for valid simple authentication (authType=Simple)', () => {
        const info = { authType: 'Simple' };
        //Mock jwt.verify to return a valid decodedToken
        jwt.verify.mockReturnValue({ username: "testname", email: "test@email", role: "Regular" })

        const result = verifyAuth(req, res, info);

        //Check if the appropriate functions were called
        expect(result).toBe(true);
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });

    test('Should return false for missing token in req', () => {
        const info = { authType: 'Simple' };
        req.cookies.accessToken = undefined;
        req.cookies.refreshToken = undefined;
        //Mock jwt.verify to return a non valid decodedToken
        jwt.verify.mockReturnValue({ email: "test@email", role: "Regular" })

        const result = verifyAuth(req, res, info);

        //Check if the appropriate functions were called
        expect(result).toBe(false);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    });

    test('Should return false for non valid simple authentication with token missing information (authType=Simple)', () => {
        const info = { authType: 'Simple' };
        //Mock jwt.verify to return a non valid decodedToken
        jwt.verify.mockReturnValue({ email: "test@email", role: "Regular" })

        const result = verifyAuth(req, res, info);

        //Check if the appropriate functions were called
        expect(result).toBe(false);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Token is missing information" });
    });

    test('Should return false for non valid simple authentication with mismatch of information in the tokens (authType=Simple)', () => {
        const info = { authType: 'Simple' };
        //Mock jwt.verify to return mismatched decodedTokens
        jwt.verify.mockReturnValueOnce({ username: "testuser1", email: "test@email1", role: "Regular" }).mockReturnValueOnce({ username: "testuser2", email: "test@email2", role: "Regular" })

        const result = verifyAuth(req, res, info);

        //Check if the appropriate functions were called
        expect(result).toBe(false);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Mismatched users" });
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
                return {};
        })
        //Mock jwt.sign to return the new accessToken
        jwt.sign.mockReturnValue("newAccessToken");

        const result = verifyAuth(req, res, info);

        //Check if the appropriate functions were called
        expect(result).toBe(true);
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
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
        expect(result).toBe(false);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Perform login again" });
    });

    test('Should return false when refreshToken not valid and accessToken expired (authType=Simple)', () => {
        const info = { authType: 'Simple' };
        //Mock jwt.verify to throw TokenExpiredError
        jwt.verify.mockImplementation(() => {
            throw Object.assign(new Error('DecodeError'), { name: 'DecodeError' });
        })

        const result = verifyAuth(req, res, info);

        //Check if the appropriate functions were called
        expect(result).toBe(false);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "DecodeError" });
    });

})

describe("handleAmountFilterParams", () => {
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})
