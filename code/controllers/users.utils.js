import {User} from "../models/User.js";

/**
 * @param {string[]} emails
 * @returns {string[]}
 */
export const getUsernameFromEmail = async (emails) => {
    return (
        await User.aggregate([
            {
                $match: {email: {$in: emails}}
            },
            {
                $project: {username: "$username"}
            }
        ])
    ).map((u) => u.username);
}