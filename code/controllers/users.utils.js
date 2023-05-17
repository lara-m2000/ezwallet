import { User } from "../models/User.js";

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
