import { User } from "../models/User.js";

/**
 * @param {string[]} emails
 * @returns {Promise.<string[]>}
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

/**
 *
 * @param {typeof User.schema.obj} user
 * @returns {{username: string, email:string, role:string}}
 */
export const userSchemaMapper = (user) => ({
  username: user.username,
  email: user.email,
  role: user.role,
});