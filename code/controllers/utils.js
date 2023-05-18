import jwt from 'jsonwebtoken'
import { Group, User } from "../models/User.js"

/**
 * Handle possible date filtering options in the query parameters for getTransactionsByUser when called by a Regular user.
 * @param req the request object that can contain query parameters
 * @returns an object that can be used for filtering MongoDB queries according to the `date` parameter.
 *  The returned object must handle all possible combination of date filtering parameters, including the case where none are present.
 *  Example: {date: {$gte: "2023-04-30T00:00:00.000Z"}} returns all transactions whose `date` parameter indicates a date from 30/04/2023 (included) onwards
 * @throws an error if the query parameters include `date` together with at least one of `from` or `upTo`
 */
export const handleDateFilterParams = (req) => {
}

/**
 * Handle possible authentication modes depending on `authType`
 * @param req the request object that contains cookie information
 * @param res the result object of the request
 * @param info an object that specifies the `authType` and that contains additional information.
 *

 *      AuthTypes:
 *          -authType === "Simple":
 *              -it covers basic authentication requirements
 *              -accessToken and refreshToken are undefined properties of req.cookies => 
 *          - authType === "User":
 *              - either the accessToken or the refreshToken have a `username` different from the requested one => error 401
 *              - the accessToken is expired and the refreshToken has a `username` different from the requested one => error 401
 *              - both the accessToken and the refreshToken have a `username` equal to the requested one => success
 *              - the accessToken is expired and the refreshToken has a `username` equal to the requested one => success
 *          - authType === "Admin":
 *              - either the accessToken or the refreshToken have a `role` which is not Admin => error 401
 *              - the accessToken is expired and the refreshToken has a `role` which is not Admin => error 401
 *              - both the accessToken and the refreshToken have a `role` which is equal to Admin => success
 *              - the accessToken is expired and the refreshToken has a `role` which is equal to Admin => success
 *          - authType === "Group":
 *              - either the accessToken or the refreshToken have a `email` which is not in the requested group => error 401
 *              - the accessToken is expired and the refreshToken has a `email` which is not in the requested group => error 401
 *              - both the accessToken and the refreshToken have a `email` which is in the requested group => success
 *              - the accessToken is expired and the refreshToken has a `email` which is in the requested group => success
 * @returns true if the user satisfies all the conditions of the specified `authType` and false if at least one condition is not satisfied
 *  Refreshes the accessToken if it has expired and the refreshToken is still valid
 */
export const verifyAuth = (req, res, info) => {
    const cookie = req.cookies
    if (!cookie.accessToken || !cookie.refreshToken) {
        return {authorized:false, cause:"Unauthorized"};
    }
    try {
        const decodedAccessToken = jwt.verify(cookie.accessToken, process.env.ACCESS_KEY);
        const decodedRefreshToken = jwt.verify(cookie.refreshToken, process.env.ACCESS_KEY);
        if (info.authType === "Admin") {
            if (decodedAccessToken.role !== "Admin" || decodedRefreshToken.role !== "Admin") {
                return {authorized:false, cause:"You need to be admin to perform this action"};
            }
        }
        if (info.authType === "User") {
            const username = info.username;
            if (decodedAccessToken.username !== username || decodedRefreshToken.username !== username) {
                return {authorized:false, cause:"You cannot request info about another user"};
            }
        }
        if (info.authType === "Group") {
            const email = info.emails.find(e => e === decodedAccessToken.email) && info.emails.find(e => e === decodedRefreshToken.email);
            if (!email) {
                return {authorized:false, cause:"You cannot request info about a group you don't belong to"};
            }
        }
        if (!decodedAccessToken.username || !decodedAccessToken.email || !decodedAccessToken.role) {
            return {authorized:false, cause:"Token is missing information"};
        }
        if (!decodedRefreshToken.username || !decodedRefreshToken.email || !decodedRefreshToken.role) {
            return {authorized:false, cause:"Token is missing information"};
        }
        if (decodedAccessToken.username !== decodedRefreshToken.username || decodedAccessToken.email !== decodedRefreshToken.email || decodedAccessToken.role !== decodedRefreshToken.role) {
            return {authorized:false, cause:"Mismatched users"};
        }
        return {authorized:true, cause:"Authorized"};
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            try {
                const refreshToken = jwt.verify(cookie.refreshToken, process.env.ACCESS_KEY)
                if (info.authType === "Admin") {
                    if (refreshToken.role !== "Admin") {
                        return {authorized:false, cause:"You need to be admin to perform this action"};
                    }
                }
                if (info.authType === "User") {
                    const username = info.username;
                    if (refreshToken.username !== username) {
                        return {authorized:false, cause:"You cannot request info about another user"};
                    }
                }
                if (info.authType === "Group") {
                    const email = info.emails.find(e => e === refreshToken.email);
                    if (!email) {
                        return {authorized:false, cause:"You cannot request info about a group you don't belong to"};
                    }
                }
                const newAccessToken = jwt.sign({
                    username: refreshToken.username,
                    email: refreshToken.email,
                    id: refreshToken.id,
                    role: refreshToken.role
                }, process.env.ACCESS_KEY, { expiresIn: '1h' })
                res.cookie('accessToken', newAccessToken, { httpOnly: true, path: '/api', maxAge: 60 * 60 * 1000, sameSite: 'none', secure: true })
                res.locals.message = 'Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls'
                return {authorized:true, cause:"Authorized"};
            } catch (err) {
                if (err.name === "TokenExpiredError") {
                    return {authorized:false, cause:"Perform login again"};
                } else {
                    return {authorized:false, cause:err.name};
                }
            }
        } else {
            return {authorized:false, cause:err.name};
        }
    }
}

/**
 * Handle possible amount filtering options in the query parameters for getTransactionsByUser when called by a Regular user.
 * @param req the request object that can contain query parameters
 * @returns an object that can be used for filtering MongoDB queries according to the `amount` parameter.
 *  The returned object must handle all possible combination of amount filtering parameters, including the case where none are present.
 *  Example: {amount: {$gte: 100}} returns all transactions whose `amount` parameter is greater or equal than 100
 */
export const handleAmountFilterParams = (req) => {
}