import { Group, User } from "../models/User";

/**
 *
 * @param {string[]} emails find if email belongs to a group
 * @returns {Promise.<string[][]>} returns `[usersNotInGroups, usersInGroups]` partitioning of `emails`
 */
export const findUsersGroup = async (emails) => {
  let usersNotInGroups = emails;
  let usersInGroups = await Group.aggregate([
    {
      $project: { members: 1 },
    },
    {
      $unwind: {
        path: "$members",
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $project: { _id: "$email" },
    },
    {
      $match: { _id: { $in: emails } },
    },
  ]);

  usersInGroups = usersInGroups.map((u) => u._id);

  if (usersInGroups.length !== 0) {
    usersNotInGroups = arrayDifference(usersNotInGroups, usersInGroups);
  }

  return [usersNotInGroups, usersInGroups];
};

/**
 *
 * @param {string[]} emails
 * @returns {Promise.<{email: string, user: string}[]>}
 */
export const getUserReference = async (emails) => {
  return await User.aggregate([
    {
      $match: { email: { $in: emails } },
    },
    {
      $project: { _id: 0, email: "$email", user: "$_id" },
    },
  ]);
};

/**
 *
 * @param {string[]} emails emails to find in the db
 * @returns returns a tuple with [foundUsers, notFoundUser]
 */
export const findExistingUsers = async (emails) => {
  let membersNotFound = [];
  let existingMembers = await User.aggregate([
    {
      $match: { email: { $in: emails } },
    },
    {
      $project: { _id: 0, email: "$email" },
    },
  ]);

  existingMembers = existingMembers.map((m) => m.email);

  if (existingMembers.length !== emails.length) {
    membersNotFound = arrayDifference(emails, existingMembers);
  }

  return [existingMembers, membersNotFound];
};

/**
 * Computes the difference between two arrays
 * ```
 * const a = [1, 2, 3];
 * const b = [3, 4, 5];
 * arrayDifference(a, b); // [1, 2]
 * arrayDifference(b, a); // [4, 5]
 * ```
 *
 * @param {*[]} a
 * @param {*[]} b
 * @returns {*[]}
 */
export const arrayDifference = (a, b) => {
  return a.filter((x) => !b.includes(x));
};

/**
 * Computes the intersection between two arrays
 * ```
 * const a = [1, 2, 3];
 * const b = [3, 4, 5];
 * arrayIntersection(a, b); // [3]
 * ```
 *
 * @param {*[]} a
 * @param {*[]} b
 * @returns {*[]}
 */
export const arrayIntersection = (a, b) => {
  return a.filter((x) => b.includes(x));
};