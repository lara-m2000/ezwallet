import { Group, User } from "../models/User";
import { arrayDifference } from "./array.utils";

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
 *
 * @param {*} group
 * @returns {{ name: string, members: string[]}}
 */
export const groupSchemaMapper = (group) => {
  return {
    name: group.name,
    members: group.members.map((m) => m.email),
  };
};
