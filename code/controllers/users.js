import { Group, User } from "../models/User.js";
import { transactions } from "../models/model.js";
import { verifyAuth } from "./utils.js";

/**
 * Return all the users
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `email` and `role`
  - Optional behavior:
    - empty array is returned if there are no users
 */
export const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json(error.message);
  }
};

/**
 * Return information of a specific user
  - Request Body Content: None
  - Response `data` Content: An object having attributes `username`, `email` and `role`.
  - Optional behavior:
    - error 401 is returned if the user is not found in the system
 */
export const getUser = async (req, res) => {
  try {
    const cookie = req.cookies;
    if (!cookie.accessToken || !cookie.refreshToken) {
      return res.status(401).json({ message: "Unauthorized" }); // unauthorized
    }
    const username = req.params.username;
    const user = await User.findOne({ refreshToken: cookie.refreshToken });
    if (!user) return res.status(401).json({ message: "User not found" });
    if (user.username !== username)
      return res.status(401).json({ message: "Unauthorized" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json(error.message);
  }
};

/**
 * Create a new group
  - Request Body Content: An object having a string attribute for the `name` of the group and an array that lists all the `memberEmails`
  - Response `data` Content: An object having an attribute `group` (this object must have a string attribute for the `name`
    of the created group and an array for the `members` of the group), an array that lists the `alreadyInGroup` members
    (members whose email is already present in a group) and an array that lists the `membersNotFound` (members whose email
    +does not appear in the system)
  - Optional behavior:
    - error 401 is returned if there is already an existing group with the same name
    - error 401 is returned if all the `memberEmails` either do not exist or are already in a group
 */
export const createGroup = async (req, res) => {
  try {
    // TODO: check for auth
    // ...

    const { name, membersEmails } = req.body;

    // bad formatting
    if (!name || !membersEmails) {
      return res.status(401).json({ message: "Bad formatting" });
    }

    // check for existing group
    const group = await Group.findOne({ name: name });
    if (group) {
      return res.status(401).json({ message: "Group already exists" });
    }

    debugger;
    // find existing users
    const [membersFound, membersNotFound] = await findExistingUsers(
      membersEmails
    );

    // find users in a group
    const [membersNotInGroup, membersInGroup] = await findUsersGroup(
      membersFound
    );

    // check if every user is non-existing or if is part of a group
    if (membersFound.length === membersInGroup.length) {
      return res.status(401).json({
        data: { alreadyInGroup: membersInGroup, notInGroup: membersNotInGroup },
        message: "Users don't exist or already in a group",
      });
    }

    const members = await getUserReference(membersNotInGroup);
    const savedGroup = await Group.insertMany([
      { name: name, members: members },
    ]);

    res.status(200).json({
      data: {
        group: {
          name: name,
          members: savedGroup.members.map((m) => m.email),
          alreadyInGroup: membersInGroup,
          membersNotFound: membersNotFound,
        },
      },
      message: "Group added successfully",
    });
  } catch (err) {
    res.status(500).json(err.message);
  }
};

/**
 * Return all the groups
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having a string attribute for the `name` of the group
    and an array for the `members` of the group
  - Optional behavior:
    - empty array is returned if there are no groups
 */
export const getGroups = async (req, res) => {
  try {
    // TODO: check for admin auth
    // ...

    const groups = await Group.aggregate([
      {
        $project: {
          _id: 0,
          name: "$name",
          members: {
            $map: {
              input: "$members.email",
              as: "email",
              in: "$$email",
            },
          },
        },
      },
    ]);

    if (!groups) {
      groups = [];
    }

    res.status(200).json({
      data: { groups: groups },
      message: "All groups information",
    });
  } catch (err) {
    res.status(500).json(err.message);
  }
};

/**
 * Return information of a specific group
  - Request Body Content: None
  - Response `data` Content: An object having a string attribute for the `name` of the group and an array for the 
    `members` of the group
  - Optional behavior:
    - error 401 is returned if the group does not exist
 */
export const getGroup = async (req, res) => {
  try {
    // TODO: check for auth
    // ...

    const name = req.params.name;
    const group = await Group.findOne({ name: name });

    if (!group) {
      return res.status(401).json({ message: "Group does not exists" });
    }

    const members = group.members.map((m) => m.email);

    res.status(200).json({
      data: { name: name, members: members },
      message: "Group information",
    });
  } catch (err) {
    res.status(500).json(err.message);
  }
};

/**
 * Add new members to a group
  - Request Body Content: An array of strings containing the emails of the members to add to the group
  - Response `data` Content: An object having an attribute `group` (this object must have a string attribute for the `name` of the
    created group and an array for the `members` of the group, this array must include the new members as well as the old ones), 
    an array that lists the `alreadyInGroup` members (members whose email is already present in a group) and an array that lists 
    the `membersNotFound` (members whose email does not appear in the system)
  - Optional behavior:
    - error 401 is returned if the group does not exist
    - error 401 is returned if all the `memberEmails` either do not exist or are already in a group
 */
export const addToGroup = async (req, res) => {
  try {
    // TOOD: add auth

    const emails = req.body;

    if (!emails) {
      return res.status(401).json({ message: "Bad formatting" });
    }

    if (emails.length === 0) {
      return res.status(401).json({ message: "List is empty" });
    }

    const name = req.params.name;
    const group = await Group.findOne({ name: name });

    // check if group exists
    if (!group) {
      return res.status(401).json({ message: "Group does not exist" });
    }

    // find existing users
    const [membersFound, membersNotFound] = await findExistingUsers(emails);

    // find users in a group
    const [membersNotInGroup, membersInGroup] = await findUsersGroup(
      membersFound
    );

    // check if every user is non-existing or if is part of a group
    if (membersFound.length === membersInGroup.length) {
      return res
        .status(401)
        .json({ message: "Users don't exist or already in a group" });
    }

    const members = getUserReference(membersNotInGroup);
    const updatedGroup = await Group.findOneAndUpdate(
      { name: name },
      { $push: { members: { $each: members } } }
    );

    res.status(200).json({
      data: {
        group: {
          name: name,
          members: updatedGroup.members.map((m) => m.email),
          alreadyInGroup: membersInGroup,
          membersNotFound: membersNotFound,
        },
      },
      message: "Users added successfully to a group",
    });
  } catch (err) {
    res.status(500).json(err.message);
  }
};

/**
 * Remove members from a group
  - Request Body Content: An object having an attribute `group` (this object must have a string attribute for the `name` of the
    created group and an array for the `members` of the group, this array must include only the remaining members),
    an array that lists the `notInGroup` members (members whose email is not in the group) and an array that lists 
    the `membersNotFound` (members whose email does not appear in the system)
  - Optional behavior:
    - error 401 is returned if the group does not exist
    - error 401 is returned if all the `memberEmails` either do not exist or are not in the group
 */
export const removeFromGroup = async (req, res) => {
  try {
    // TODO: auth

    const emails = req.body;

    if (!emails) {
      return res.status(401).json({ message: "Bad formatting" });
    }

    if (emails.length === 0) {
      return res.status(401).json({ message: "List is empty" });
    }

    const name = req.params.name;
    const group = await Group.findOne({ name: name });

    // check if group exists
    if (!group) {
      return res.status(401).json({ message: "Group does not exist" });
    }

    // find existing users
    const [membersFound, membersNotFound] = await findExistingUsers(emails);

    // find users in a group
    const [membersNotInGroup, membersInGroup] = await findUsersGroup(
      membersFound
    );

    // check if at least one user exist or is not part of a group
    if (membersFound.length === membersNotInGroup.length) {
      return res
        .status(401)
        .json({ message: "Users don't exist or not in a group" });
    }

    // find members to remove
    const membersToRemove = arrayIntersection(
      membersInGroup,
      group.members.map((m) => m.email)
    );

    const updatedGroup = await Group.findOneAndUpdate(
      { name: name },
      { $pull: { members: { email: { $in: membersToRemove } } } }
    );

    res.status(200).json({
      data: {
        group: {
          name: name,
          members: updatedGroup.members.map((m) => m.email),
          notInGroup: membersNotInGroup,
          membersNotFound: membersNotFound,
        },
      },
      message: "Users removed successfully from a group",
    });
  } catch (err) {
    res.status(500).json(err.message);
  }
};

/**
 * Delete a user
  - Request Parameters: None
  - Request Body Content: A string equal to the `email` of the user to be deleted
  - Response `data` Content: An object having an attribute that lists the number of `deletedTransactions` and a boolean attribute that
    specifies whether the user was also `deletedFromGroup` or not.
  - Optional behavior:
    - error 401 is returned if the user does not exist 
 */
export const deleteUser = async (req, res) => {
  try {
  } catch (err) {
    res.status(500).json(err.message);
  }
};

/**
 * Delete a group
  - Request Body Content: A string equal to the `name` of the group to be deleted
  - Response `data` Content: A message confirming successful deletion
  - Optional behavior:
    - error 401 is returned if the group does not exist
 */
export const deleteGroup = async (req, res) => {
  try {
    // TODO: auth

    const { name } = req.body;

    const group = await Group.findOneAndDelete({ name: name });

    // check if group exists
    if (!group) {
      return res.status(401).json({ message: "Group does not exists" });
    }

    res.status(200).json({ message: "Group successfully deleted" });
  } catch (err) {
    res.status(500).json(err.message);
  }
};

/**
 *
 * @param {string[]} emails find if email belongs to a group
 * @returns {Promise.<string[][]>} returns `[usersNotInGroups, usersInGroups]` partitioning of `emails`
 */
const findUsersGroup = async (emails) => {
  debugger;
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

  // usersInGroups = usersInGroups.map((u) => u._id);

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
const getUserReference = async (emails) => {
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
const findExistingUsers = async (emails) => {
  debugger;
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
const arrayDifference = (a, b) => {
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
const arrayIntersection = (a, b) => {
  return a.filter((x) => b.includes(x));
};
