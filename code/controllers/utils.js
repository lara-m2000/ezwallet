import jwt from 'jsonwebtoken'
import { Group, User } from "../models/User.js"
import { getUserFromToken } from './group.utils.js'

/**
 * Handle possible date filtering options in the query parameters for getTransactionsByUser when called by a Regular user.
 * @param req the request object that can contain query parameters
 * @returns an object that can be used for filtering MongoDB queries according to the `date` parameter.
 *  The returned object must handle all possible combination of date filtering parameters, including the case where none are present.
 *  Example: {date: {$gte: "2023-04-30T00:00:00.000Z"}} returns all transactions whose `date` parameter indicates a date from 30/04/2023 (included) onwards
 * @throws an error if the query parameters include `date` together with at least one of `from` or `upTo`
 */
export const handleDateFilterParams = (req) => {
    const { date, from, upTo } = req.query;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (date && (from || upTo))
        throw new Error("Cannot set a 'date' filter with a 'from' or 'upTo' filter");
    if (!(date || from || upTo))
        return {};
    let matchObj = { date: {} };
    const dayEnd = "T23:59:59.999Z";
    if (date) {
        if (!dateRegex.test(date)) {
            throw new Error("Wrong date format")
        }
        // selects transactions with this specific date
        matchObj.date = {
            $gte: new Date(date),
            $lte: new Date(date + dayEnd)
        };
        return matchObj;
    }
    if (from) {
        if (!dateRegex.test(from)) {
            throw new Error("Wrong date format")
        }
        matchObj.date.$gte = new Date(from);
    }
    if (upTo) {
        if (!dateRegex.test(upTo)) {
            throw new Error("Wrong date format")
        }
        matchObj.date.$lte = new Date(upTo + dayEnd);
    }
    return matchObj;
}

/**
 * Handle possible authentication modes depending on `authType`
 * @param req the request object that contains cookie information
 * @param res the result object of the request
 * @param {{authType:"User", username:string}|
 * {authType:"Group", emails:string[]}|
 * {authType:"Simple"}|
 * {authType:"Admin"}
 * } info an object that specifies the `authType` and that contains additional information (see examples at the end of docs)
 *
 *      AuthTypes:
 *          -authType === "Simple":
 *              -it covers basic authentication requirements (the requirements needed for action with no other particular request of rights)
 *          All these other authTypes cover the requirements of authType === "Simple" plus additional criteria:
 *          - authType === "User":
 *              - either the accessToken or the refreshToken have a `username` different from the requested one => {flag: false, cause:"<cause>"}
 *              - the accessToken is expired and the refreshToken has a `username` different from the requested one => {flag: false, cause:"<cause>"}
 *              - both the accessToken and the refreshToken have a `username` equal to the requested one => {flag: true, cause:"flag"}
 *              - the accessToken is expired and the refreshToken has a `username` equal to the requested one => {flag: true, cause:"flag"}
 *          - authType === "Admin":
 *              - either the accessToken or the refreshToken have a `role` which is not Admin => {flag: false, cause:"<cause>"}
 *              - the accessToken is expired and the refreshToken has a `role` which is not Admin => {flag: false, cause:"<cause>"}
 *              - both the accessToken and the refreshToken have a `role` which is equal to Admin => {flag: true, cause:"flag"}
 *              - the accessToken is expired and the refreshToken has a `role` which is equal to Admin => {flag: true, cause:"flag"}
 *          - authType === "Group":
 *              - either the accessToken or the refreshToken have a `email` which is not in the requested group => {authorized: false, cause:"<cause>"}
 *              - the accessToken is expired and the refreshToken has a `email` which is not in the requested group => {authorized: false, cause:"<cause>"}
 *              - both the accessToken and the refreshToken have a `email` which is in the requested group => {authorized: true, cause:"Authorized"}
 *              - the accessToken is expired and the refreshToken has a `email` which is in the requested group => {authorized: true, cause:"Authorized"}
 * @returns an object {authorized: <bool>, cause:<string>} authorized is true if the user satisfies all the conditions of the specified `authType` and false if at least one condition is not satisfied
 * 
 *  Refreshes the accessToken if it has expired and the refreshToken is still valid
 * 
 * Examples of different auths:
 * 
 * -const simpleAuth = verifyAuth(req, res, {authType: "Simple"})
 * 
 * -const userAuth = verifyAuth(req, res, {authType: "User", username: req.params.username})
 * 
 * -const adminAuth = verifyAuth(req, res, {authType: "Admin"})
 * 
 * -const groupAuth = verifyAuth(req, res, {authType: "Group", emails: <array of emails>})
 * 
 **/
export const verifyAuth = (req, res, info) => {
    const cookie = req.cookies
    if (!cookie.accessToken || !cookie.refreshToken) {
        return {flag:false, cause:"Unauthorized"};
    }
    try {
        const decodedAccessToken = jwt.verify(cookie.accessToken, process.env.ACCESS_KEY);
        const decodedRefreshToken = jwt.verify(cookie.refreshToken, process.env.ACCESS_KEY);
        if (!decodedAccessToken.username || !decodedAccessToken.email || !decodedAccessToken.role) {
            return {flag:false, cause:"Token is missing information"};
        }
        if (!decodedRefreshToken.username || !decodedRefreshToken.email || !decodedRefreshToken.role) {
            return {flag:false, cause:"Token is missing information"};
        }
        if (decodedAccessToken.username !== decodedRefreshToken.username || decodedAccessToken.email !== decodedRefreshToken.email || decodedAccessToken.role !== decodedRefreshToken.role) {
            return {flag:false, cause:"Mismatched users"};
        }
        if (info.authType === "Admin") {
            if (decodedAccessToken.role !== "Admin" || decodedRefreshToken.role !== "Admin") {
                return {flag:false, cause:"You need to be admin to perform this action"};
            }
        }
        if (info.authType === "User") {
            const username = info.username;
            if (decodedAccessToken.username !== username || decodedRefreshToken.username !== username) {
                return {flag:false, cause:"You cannot request info about another user"};
            }
        }
        if (info.authType === "Group") {
            const email = info.emails.find(e => e === decodedAccessToken.email) && info.emails.find(e => e === decodedRefreshToken.email);
            if (!email) {
                return {flag:false, cause:"You cannot request info about a group you don't belong to"};
            }
        }
        return {flag:true, cause:"Authorized"};
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            try {
                const refreshToken = jwt.verify(cookie.refreshToken, process.env.ACCESS_KEY);

                if (!refreshToken.username || !refreshToken.email || !refreshToken.role) {
                    return {flag:false, cause:"Token is missing information"};
                }                
                if (info.authType === "Admin") {
                    if (refreshToken.role !== "Admin") {
                        return {flag:false, cause:"You need to be admin to perform this action"};
                    }
                }
                if (info.authType === "User") {
                    const username = info.username;
                    if (refreshToken.username !== username) {
                        return {flag:false, cause:"You cannot request info about another user"};
                    }
                }
                if (info.authType === "Group") {
                    const email = info.emails.find(e => e === refreshToken.email);
                    if (!email) {
                        return {flag:false, cause:"You cannot request info about a group you don't belong to"};
                    }
                }
                const newAccessToken = jwt.sign({
                    username: refreshToken.username,
                    email: refreshToken.email,
                    id: refreshToken.id,
                    role: refreshToken.role
                }, process.env.ACCESS_KEY, { expiresIn: '1h' })
                res.cookie('accessToken', newAccessToken, { httpOnly: true, path: '/api', maxAge: 60 * 60 * 1000, sameSite: 'none', secure: true })
                res.locals.refreshedTokenMessage = 'Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls'
                return {flag:true, cause:"Authorized"};
            } catch (err) {
                if (err.name === "TokenExpiredError") {
                    return {flag:false, cause:"Perform login again"};
                } else {
                    return {flag:false, cause:err.name};
                }
            }
        } else {
            return {flag:false, cause:err.name};
        }
    }

}

/**
 * Check from req.cookies if user requesting is Admin
 * @param {*} req
 * @param {*} res
 * @returns 
 */
export const verifyAdmin = async (req, res) => {
    const currUser = await getUserFromToken(req.cookies.refreshToken);

    return { ...verifyAuth(req, res, { authType: "Admin" }), currUser };
}

/**
 * Check from req.cookies if user requesting is User
 * @param {*} req
 * @param {*} res
 * @returns 
 */
export const verifyUser = async (req, res) => {
    const currUser = await getUserFromToken(req.cookies.refreshToken);

    return { ...verifyAuth(req, res, { authType: "User", username: currUser.username }), currUser };
}

/**
 * Checks if requesting User is either a User or Admin
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
export const verifyUserOrAdmin = async (req, res) => {
    const currUser = await getUserFromToken(req.cookies.refreshToken);

    let isAdmin = false;
    let isFlag = false;
    let { flag, cause } = verifyAuth(req, res, {
        authType: "User",
        username: currUser.username,
    });
    isFlag |= flag;

    ({ flag, cause } = verifyAuth(req, res, { authType: "Admin" }));
    isFlag |= flag;
    isAdmin = flag;

    return { flag: isFlag, cause: cause, currUser: currUser, isAdmin: isAdmin };
}

/**
 * Handle possible amount filtering options in the query parameters for getTransactionsByUser when called by a Regular user.
 * @param req the request object that can contain query parameters
 * @returns an object that can be used for filtering MongoDB queries according to the `amount` parameter.
 *  The returned object must handle all possible combination of amount filtering parameters, including the case where none are present.
 *  Example: {amount: {$gte: 100}} returns all transactions whose `amount` parameter is greater or equal than 100
 */
export const handleAmountFilterParams = (req) => {
    const { min, max } = req.query;
    if (!max && !min)
        return {};
    if ((max && (isNaN(Number(max))||max==" ")) || (min && (isNaN(Number(min))||min==" ")))
        throw new Error("Query parameters badly formatted");
    /*if ((min && max) && Number(min) > Number(max)) {
        throw new Error("Min amount cannot be greater than max amount");
    }*/
    let matchObj = { amount: {} };
    if (min) {
        matchObj.amount.$gte = Number(min);
    }
    if (max) {
        matchObj.amount.$lte = Number(max);
    }
    return matchObj
}