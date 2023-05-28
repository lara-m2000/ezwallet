import { Group, User } from "../models/User.js";
import { transactions } from "../models/model.js";
import { arrayIntersection } from "./array.utils.js";
import {
  addEmail,
  findExistingUsers,
  findUsersGroup,
  getUserFromToken,
  getUserReference,
  groupSchemaMapper,
} from "./group.utils.js";
import {
  verifyAdmin,
  verifyAuth,
  verifyUser,
  verifyUserOrAdmin,
} from "./utils.js";
import * as yup from "yup";
import { validateRequest } from "./validate.js";

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
    // Check if request user exist
    const { flag, cause, currUser, isAdmin } = await verifyUserOrAdmin(
      req,
      res
    );
    if (!flag) {
      return res.status(401).json({ error: cause });
    }

    // validate params
    const schema = yup.object({
      name: yup.string().required(),
      memberEmails: yup.array(yup.string().email().required()).required(),
    });

    const { body, errorMessage, isValidationOk } = validateRequest(
      req,
      null,
      schema,
      null
    );
    if (!isValidationOk) {
      return res.state(400).json({ error: errorMessage });
    }

    const { name, memberEmails } = body;

    // add currUser to memberEmails if not inside
    if (!memberEmails.includes(currUser.email)) {
      memberEmails.push(currUser.email);
    }

    // check for existing group
    const group = await Group.findOne({ name: name });
    if (group) {
      return res.status(400).json({ error: "Group already exists" });
    }

    // find existing users
    const [membersFound, membersNotFound] = await findExistingUsers(
      memberEmails
    );

    // find users in a group
    const [membersNotInGroup, membersInGroup] = await findUsersGroup(
      membersFound
    );

    // check if every user is non-existing or if is part of a group
    if (membersFound.length === membersInGroup.length) {
      return res
        .status(400)
        .json({ error: "User don't exit or already in a group" });
    }

    const members = await getUserReference(membersNotInGroup);
    const savedGroup = await Group.create([{ name: name, members: members }]);

    res.status(200).json({
      data: {
        group: groupSchemaMapper(savedGroup[0]),
        alreadyInGroup: membersInGroup,
        membersNotFound: membersNotFound,
      },
      refreshedTokenMessage: res.locals.refreshedTokenMessage,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
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
    // Check if request user exist
    const { flag, cause } = await verifyAdmin(req, res);
    if (!flag) {
      return res.status(401).json({ error: cause });
    }

    const groups = await Group.find();

    res.status(200).json({
      data: { groups: groups.map(groupSchemaMapper) },
      refreshedTokenMessage: res.locals.refreshedTokenMessage,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
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
    // Check if request user exist
    const { flag, cause, currUser, isAdmin } = await verifyUserOrAdmin(
      req,
      res
    );
    if (!flag) {
      return res.status(401).json({ error: cause });
    }

    // validate params
    const schema = yup.object({
      name: yup.string().required(),
    });

    const { params, errorMessage, isValidationOk } = validateRequest(
      req,
      schema
    );
    if (!isValidationOk) {
      return res.state(400).json({ error: errorMessage });
    }

    const { name } = params;

    // check if group exist
    const group = await Group.findOne({ name: name });

    if (!group) {
      return res.status(400).json({ error: "Group does not exists" });
    }

    // Can only get a group if user is inside,
    // admin can get any group.
    if (!isAdmin) {
      const userInGroup = group.members
        .map((m) => m.email)
        .includes(currUser.email);

      if (!userInGroup)
        return res.status(401).json({ error: "Not part of a group" });
    }

    res.status(200).json({
      data: groupSchemaMapper(group),
      refreshedTokenMessage: res.locals.refreshedTokenMessage,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
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
    /** @type {typeof User.schema.obj} */
    let currUser;
    let isAdmin = false;
    // Can be called by user
    if (req.path.endsWith("/add")) {
      const { flag, cause, currUser: user } = await verifyUserOrAdmin(req, res);
      if (!flag) return res.status(401).json({ error: cause });

      currUser = user;
    }
    // Can only be called by admin
    else if (req.path.endsWith("/insert")) {
      const { flag, cause, currUser: user } = await verifyAdmin(req, res);
      if (!flag) return res.status(401).json({ error: cause });

      currUser = user;
      isAdmin = true;
    } else {
      throw Error(`Wrong req.path: ${req.path}`);
    }

    // Validation
    const schemaBody = yup.object({
      emails: yup.array(yup.string().email().required()).required(),
    });

    const schemaParams = yup.object({
      name: yup.string().required(),
    });

    const { body, params, errorMessage, isValidationOk } = validateRequest(
      req,
      schemaParams,
      schemaBody
    );
    if (!isValidationOk) {
      return res.status(400).json({ error: errorMessage });
    }

    const { emails } = body;
    const { name } = params;

    if (emails.length === 0) {
      return res.status(400).json({ error: "List is empty" });
    }

    const group = await Group.findOne({ name: name });

    // check if group exists
    if (!group) {
      return res.status(400).json({ error: "Group does not exist" });
    }

    // If user request can only add to group where he belongs
    if (!isAdmin) {
      const userInGroup = group.members
        .map((m) => m.email)
        .includes(currUser.email);

      if (!userInGroup)
        return res.status(401).json({ error: "User not in group" });
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
        .status(400)
        .json({ error: "Users don't exist or already in a group" });
    }

    const members = await getUserReference(membersNotInGroup);
    const updatedGroup = await Group.findOneAndUpdate(
      { name: name },
      { $push: { members: { $each: members } } },
      { new: true }
    );

    res.status(200).json({
      data: {
        group: groupSchemaMapper(updatedGroup),
        alreadyInGroup: membersInGroup,
        membersNotFound: membersNotFound,
      },
      refreshedTokenMessage: res.locals.refreshedTokenMessage,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
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
    let currUser;
    let isAdmin = false;

    if (req.path.endsWith("/remove")) {
      const { flag, cause, currUser: user } = await verifyUserOrAdmin(req, res);
      if (!flag) return res.status(401).json({ error: cause });

      currUser = user;
    } else if (req.path.endsWith("/pull")) {
      const { flag, cause, currUser: user } = await verifyAdmin(req, res);
      if (!flag) return res.status(401).json({ error: cause });

      currUser = user;
      isAdmin = true;
    }

    const bodySchema = yup.object({
      emails: yup.array(yup.string().email().required()).required(),
    });

    const paramsSchema = yup.object({
      name: yup.string().required(),
    });

    const { isValidationOk, body, params, errorMessage } = validateRequest(
      req,
      paramsSchema,
      bodySchema
    );
    if (!isValidationOk) {
      return res.status(400).json({ error: errorMessage });
    }

    const { emails } = body;
    const { name } = params;

    if (emails.length === 0) {
      return res.status(400).json({ error: "List is empty" });
    }

    const group = await Group.findOne({ name: name });

    // check if group exists
    if (!group) {
      return res.status(400).json({ error: "Group does not exist" });
    }

    // check if user is in group
    if (!isAdmin) {
      const userInGroup = group.members
        .map((m) => m.email)
        .includes(currUser.email);

      if (!userInGroup)
        return res.status(401).json({ error: "User not in group" });
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
        .status(400)
        .json({ error: "Users don't exist or not in a group" });
    }

    // find members to remove
    const membersToRemove = arrayIntersection(
      membersInGroup,
      group.members.map((m) => m.email)
    );

    // It's not possible to delete all members from a group
    const leaveOneMember = membersToRemove.length === group.members.length;

    const updatedGroup = await Group.findOneAndUpdate(
      { name: name },
      leaveOneMember
        ? {
            $push: {
              members: { $each: [], $slice: 1 },
            },
          }
        : {
            $pull: {
              members: {
                email: { $in: membersToRemove },
              },
            },
          },
      { new: true }
    );

    res.status(200).json({
      data: {
        group: groupSchemaMapper(updatedGroup),
        notInGroup: membersNotInGroup,
        membersNotFound: membersNotFound,
      },
      refreshedTokenMessage: res.locals.refreshedTokenMessage,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
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
    const { flag, cause } = await verifyAdmin(req, res);
    if (!flag) {
      return res.status(401).json({ error: cause });
    }

    const bodySchema = yup.object({
      name: yup.string().required(),
    });

    const { isValidationOk, body, errorMessage } = validateRequest(
      req,
      null,
      bodySchema
    );
    if (!isValidationOk) {
      return res.status(400).json({ error: errorMessage });
    }
    const { name } = body;

    const group = await Group.findOneAndDelete({ name: name });

    // check if group exists
    if (!group) {
      return res.status(400).json({ error: "Group does not exists" });
    }

    res.status(200).json({
      data: { message: "Group delete successfully" },
      refreshedTokenMessage: res.locals.refreshedTokenMessage,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};
