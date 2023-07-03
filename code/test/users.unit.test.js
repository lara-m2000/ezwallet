import request from "supertest";
import { app } from "../app";
import { Group, GroupSchema, User } from "../models/User.js";
import {
  addToGroup,
  createGroup,
  deleteGroup,
  deleteUser,
  getGroup,
  getGroups,
  getUser,
  getUsers,
  removeFromGroup,
} from "../controllers/users";
import groupStub from "./stubs/group.stub";
import { Document } from "mongoose";
import { groupSchemaMapper } from "../controllers/group.utils";
import { transactions } from "../models/model";

/**
 * In order to correctly mock the calls to external modules it is necessary to mock them using the following line.
 * Without this operation, it is not possible to replace the actual implementation of the external functions with the one
 * needed for the test cases.
 * `jest.mock()` must be called for every external module that is called in the functions under test.
 */
jest.mock("../models/User.js");
jest.mock("../controllers/group.utils.js", () => {
  const originalModule = jest.requireActual("../controllers/group.utils.js");
  return {
    __esModule: true,
    ...originalModule,
    getUserFromToken: jest.fn(),
  };
});
jest.mock("../controllers/utils.js");

import { getUserFromToken } from "../controllers/group.utils";
import { verifyAdmin, verifyUserOrAdmin } from "../controllers/utils";

/**
 * Defines code to be executed before each test case is launched
 * In this case the mock implementation of `User.find()` is cleared, allowing the definition of a new mock implementation.
 * Not doing this `mockClear()` means that test cases may use a mock implementation intended for other test cases.
 */
beforeEach(() => {
  jest.clearAllMocks();
  //additional `mockClear()` must be placed here
});

/**
 * 
 * @param {"Regular"|"Admin"} role 
 * @returns 
 */
const userStub = (role = "Regular") => ({
  username: "bre",
  email: "bre@bre.it",
  role: "Regular",
});

describe("User", () => {
  const mockRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    locals: {
      refreshedTokenMessage: "token"
    }
  });

  describe("getUsers", () => {
    beforeEach(async () => {
      jest.clearAllMocks();
    });

    const verifiedResult = () => ({
      flag: true,
      isAdmin: true,
      currUser: userStub("bre"),
    });

    /*******************************************/

    test("should retrieve list of all users", async () => {
      const mockReq = {};
      const retrievedUsers = [
        {
          username: "test1",
          email: "test1@example.com",
          role: "Regular",
        },
        {
          username: "test2",
          email: "test2@example.com",
          role: "Regular",
        },
      ];

      verifyAdmin.mockResolvedValue(verifiedResult());
      jest.spyOn(User, "find").mockResolvedValue(retrievedUsers);

      const res = mockRes();
      await getUsers(mockReq, res);

      expect(User.find).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: retrievedUsers,
        refreshedTokenMessage: res.locals.refreshedTokenMessage,
      });
    });

    test("should return error 500 if exception is thrown", async () => {
      const mockReq = {};
      const res = mockRes();
      verifyAdmin.mockRejectedValue(Object.assign({}, {message: "error"}));

      await getUsers(mockReq, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({error: "error"});
    });
  });

  describe("getUser", () => {
    beforeEach(async () => {
      jest.clearAllMocks();
    });

    const mockReq = () => ({
      params: { username: "bre" },
    });

    const verifiedResult = () => ({
      flag: true,
      isAdmin: true,
      currUser: userStub("bre"),
    });

    test("should return a user", async () => {
      verifyUserOrAdmin.mockResolvedValue(verifiedResult());
      jest.spyOn(User, "findOne").mockResolvedValue(userStub());

      const res = mockRes();
      await getUser(mockReq(), res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: userStub(),
        refreshedTokenMessage: res.locals.refreshedTokenMessage,
      });
    });

    test("should return error if user doesn't exist", async () => {
      verifyUserOrAdmin.mockResolvedValue(verifiedResult());
      jest.spyOn(User, "findOne").mockResolvedValue();

      const res = mockRes();
      await getUser(mockReq(), res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("should return error 500 if exception is thrown", async () => {
      const mockReq = {};
      const res = mockRes();
      verifyUserOrAdmin.mockRejectedValue(Object.assign({}, {message: "error"}));

      await getUser(mockReq, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({error: "error"});
    }
  );
  });

  describe("deleteUser", () => {
    beforeEach(async () => {
      jest.clearAllMocks();
    });

    const verifiedResult = () => ({
      flag: true,
      isAdmin: true,
      currUser: userStub("bre"),
    });

    const mockReq = () => ({
      body: { email: "bre@bre.it" },
    });

    const userStub = () => ({
      username: "bre",
      email: "bre@bre.it",
      role: "Regular",
    });

    test("should delete a user", async () => {
      verifyAdmin.mockResolvedValue(verifiedResult());
      jest.spyOn(User, "findOneAndDelete").mockResolvedValue(userStub());
      jest.spyOn(User, "aggregate").mockResolvedValue([]);
      jest
        .spyOn(transactions, "deleteMany")
        .mockResolvedValue({ deletedCount: 0 });

      const res = mockRes();
      await deleteUser(mockReq(), res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: {
          deletedTransactions: 0,
          deletedFromGroup: false,
        },
        refreshedTokenMessage: res.locals.refreshedTokenMessage,
      });
    });
  });
});

describe("Group", () => {
  const mockRes = () => {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      locals: {
        refreshedTokenMessage: "rToken",
      },
    };
  };

  /**
   *
   * @param {string} name
   * @returns
   */
  const userStub = (name) => ({
    name: name,
    email: `${name}@${name}.it`,
  });

  // TODO: substitu aggregate calls with the ones in `group.utils.js`

  /**
   * Get all groups
   */
  const GroupFind = jest.spyOn(Group, "find");
  /**
   * Find the group
   */
  const GroupFindOne = jest.spyOn(Group, "findOne");
  /**
   * Find users that belongs to a group
   */
  const GroupAggregate = jest.spyOn(Group, "aggregate");
  /**
   * Insert a group
   */
  const GroupCreate = jest.spyOn(Group, "create");
  /**
   * Update a group
   */
  const GroupFindOneAndUpdate = jest.spyOn(Group, "findOneAndUpdate");
  /**
   * Delete a group
   */
  const GroupFindOneAndDelete = jest.spyOn(Group, "findOneAndDelete");
  /**
   * Find the existing users or get the user reference
   */
  const UserAggregate = jest.spyOn(User, "aggregate");

  describe("createGroup", () => {
    const reqStub = () => {
      return {
        body: {
          name: groupStub().name,
          memberEmails: groupStub().members.map((m) => m.email),
        },
      };
    };

    const userCallingStub = () => ({
      name: "bre",
      email: "bre@bre.it",
      refreshToken: "rToken",
    });

    const verifiedResult = () => ({
      flag: true,
      currUser: userStub("bre"),
    });

    beforeEach(async () => {
      jest.resetAllMocks();
    });

    test("result status should be 200", async () => {
      verifyUserOrAdmin.mockResolvedValue(verifiedResult());
      GroupFindOne.mockResolvedValueOnce();
      UserAggregate.mockResolvedValueOnce(
        groupStub().members.map((m) => ({ email: m.email }))
      );
      GroupAggregate.mockResolvedValueOnce([]);
      UserAggregate.mockResolvedValueOnce(groupStub().members);
      GroupCreate.mockResolvedValueOnce([groupStub()]);

      const res = mockRes();
      await createGroup(reqStub(), res);

      expect(GroupFindOne).toHaveBeenCalledWith({ name: groupStub().name });
      expect(GroupCreate).toHaveBeenCalledWith([groupStub()]);
      expect(res.json).toBeCalledWith({
        data: {
          group: groupSchemaMapper(groupStub()),
          alreadyInGroup: [],
          membersNotFound: [],
        },
        refreshedTokenMessage: mockRes().locals.refreshedTokenMessage,
      });
      expect(res.status).toBeCalledWith(200);
    });

    test("result status should be 400 when group already exists", async () => {
      verifyUserOrAdmin.mockResolvedValue(verifiedResult());
      GroupFindOne.mockResolvedValue(groupStub());
      const res = mockRes();
      await createGroup(reqStub(), res);

      expect(GroupFindOne).toHaveBeenCalled();
      expect(res.status).toBeCalledWith(400);
      expect(res.json).toBeCalled();
    });

    test("result status should be 400 when all users don't exists", async () => {
      verifyUserOrAdmin.mockResolvedValue(verifiedResult());
      GroupFindOne.mockResolvedValue();
      UserAggregate.mockResolvedValue([]);
      GroupAggregate.mockResolvedValue([]);

      const res = mockRes();
      await createGroup(reqStub(), res);

      expect(GroupFindOne).toHaveBeenCalled();
      expect(UserAggregate).toHaveBeenCalled();
      expect(GroupAggregate).toHaveBeenCalled();

      expect(res.status).toBeCalledWith(400);
    });

    test("result status should be 400 when all user belong to a group or don't exist", async () => {
      verifyUserOrAdmin.mockResolvedValue(verifiedResult());
      GroupFindOne.mockResolvedValue();
      UserAggregate.mockResolvedValueOnce([
        groupStub().members.map((u) => ({ email: u.email }))[0],
      ]);
      GroupAggregate.mockResolvedValue([
        groupStub().members.map((u) => ({ _id: u.email }))[0],
      ]);

      const res = mockRes();
      await createGroup(reqStub(), res);

      expect(GroupFindOne).toHaveBeenCalled();
      expect(UserAggregate).toHaveBeenCalled();
      expect(GroupAggregate).toHaveBeenCalled();

      expect(res.status).toBeCalledWith(400);
    });

    test("result should get non-exising users and already in a group", async () => {
      let userNotExist = "lar@lar.it";
      let userInGroup = "mat@mat.it";

      getUserFromToken.mockResolvedValue({
        name: "mat",
        email: userInGroup,
        refreshToken: "rToken",
      });
      GroupFindOne.mockResolvedValueOnce();
      const existingUsers = groupStub().members.map((m) => {
        return { email: m.email };
      });
      existingUsers.push({ email: userInGroup });

      verifyUserOrAdmin.mockResolvedValue(verifiedResult());
      UserAggregate.mockResolvedValueOnce(existingUsers);
      GroupAggregate.mockResolvedValueOnce([{ _id: userInGroup }]);
      UserAggregate.mockResolvedValueOnce(groupStub().members);
      GroupCreate.mockResolvedValueOnce([groupStub()]);

      let req = reqStub();
      req.body.memberEmails.push(userNotExist, userInGroup);
      const res = mockRes();
      await createGroup(req, res);

      expect(res.status).toBeCalledWith(200);
      expect(res.json).toBeCalledWith({
        data: {
          group: groupSchemaMapper(groupStub()),
          alreadyInGroup: [userInGroup],
          membersNotFound: [userNotExist],
        },
        refreshedTokenMessage: mockRes().locals.refreshedTokenMessage,
      });
    });
  });

  describe("getGroups", () => {
    const verifiedResult = () => ({
      flag: true,
      currUser: userStub("bre"),
    });

    beforeEach(async () => {
      jest.clearAllMocks();
    });

    test("should return a list of all groups", async () => {
      verifyAdmin.mockResolvedValue(verifiedResult());
      GroupFind.mockResolvedValue([groupStub()]);

      const res = mockRes();
      await getGroups({}, res);

      expect(GroupFind).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: [groupSchemaMapper(groupStub())],
        refreshedTokenMessage: mockRes().locals.refreshedTokenMessage,
      });
    });

    test("should return an empty list", async () => {
      verifyAdmin.mockResolvedValue(verifiedResult());
      GroupFind.mockResolvedValue([]);

      const res = mockRes();
      await getGroups({}, res);

      expect(GroupFind).toBeCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: [],
        refreshedTokenMessage: mockRes().locals.refreshedTokenMessage,
      });
    });
  });

  describe("getGroup", () => {
    beforeEach(async () => {
      jest.clearAllMocks();
    });

    const reqStub = () => ({
      params: { name: groupStub().name },
    });

    const verifiedResult = () => ({
      flag: true,
      isAdmin: false,
      currUser: userStub("bre"),
    });

    test("should return a group", async () => {
      verifyUserOrAdmin.mockResolvedValue(verifiedResult());
      GroupFindOne.mockResolvedValue(groupStub());

      const res = mockRes();
      await getGroup(reqStub(), res);

      expect(GroupFindOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: groupSchemaMapper(groupStub()),
        refreshedTokenMessage: mockRes().locals.refreshedTokenMessage,
      });
    });

    test("should return 400 when the group does not exist", async () => {
      verifyUserOrAdmin.mockResolvedValue(verifiedResult());
      GroupFindOne.mockResolvedValue();

      const res = mockRes();
      await getGroup(reqStub(), res);

      expect(GroupFindOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("addToGroup", () => {
    beforeEach(async () => {
      jest.clearAllMocks();
    });

    const emailsToAdd = ["lar@lar.it", "mat@mat.it"];
    const group = groupStub();
    let id = 3;
    const members = emailsToAdd.map((e) => ({ email: e, user: id++ }));
    const updatedGroup = (() => {
      const g = groupStub();
      g.members.push(...members);
      return g;
    })();

    const reqStub = (admin = false) => ({
      body: { emails: emailsToAdd },
      params: { name: group.name },
      path: admin ? "/insert" : "/add",
    });

    const verifiedResult = () => ({
      flag: true,
      isAdmin: false,
      currUser: userStub("bre"),
    });

    const verifiedResultAdmin = () => ({
      flag: true,
      isAdmin: true,
      currUser: userStub("bre"),
    });

    /**********************************************/

    test("should return the updated group", async () => {
      const res = mockRes();

      verifyUserOrAdmin.mockResolvedValue(verifiedResult());
      verifyAdmin.mockResolvedValue(verifiedResultAdmin());
      GroupFindOne.mockResolvedValueOnce(groupStub());
      UserAggregate.mockResolvedValueOnce(
        emailsToAdd.map((e) => ({ email: e }))
      );
      GroupAggregate.mockResolvedValueOnce([]);
      UserAggregate.mockResolvedValueOnce(members);
      GroupFindOneAndUpdate.mockResolvedValueOnce(updatedGroup);

      await addToGroup(reqStub(), res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: {
          group: groupSchemaMapper(updatedGroup),
          alreadyInGroup: [],
          membersNotFound: [],
        },
        refreshedTokenMessage: mockRes().locals.refreshedTokenMessage,
      });
    });

    test("sould return 400 if group does not exist", async () => {
      verifyUserOrAdmin.mockResolvedValue(verifiedResult());
      verifyAdmin.mockResolvedValue(verifiedResultAdmin());
      GroupFindOne.mockResolvedValue();

      const res = mockRes();
      await addToGroup(reqStub(), res);

      expect(GroupFindOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("result status should be 400 when all users don't exists", async () => {
      verifyUserOrAdmin.mockResolvedValue(verifiedResult());
      verifyAdmin.mockResolvedValue(verifiedResultAdmin());
      GroupFindOne.mockResolvedValueOnce(groupStub());
      UserAggregate.mockResolvedValueOnce([]);
      GroupAggregate.mockResolvedValueOnce([]);

      const res = mockRes();
      await addToGroup(reqStub(), res);

      expect(GroupFindOne).toHaveBeenCalled();
      expect(UserAggregate).toHaveBeenCalled();
      expect(GroupAggregate).toHaveBeenCalled();

      expect(res.status).toBeCalledWith(400);
    });

    test("result status should be 400 when all user belong to a group or don't exist", async () => {
      verifyUserOrAdmin.mockResolvedValue(verifiedResult());
      verifyAdmin.mockResolvedValue(verifiedResultAdmin());
      GroupFindOne.mockResolvedValueOnce(groupStub());
      UserAggregate.mockResolvedValueOnce([{ email: emailsToAdd[0] }]);
      GroupAggregate.mockResolvedValue([{ _id: emailsToAdd[0] }]);

      const res = mockRes();
      await addToGroup(reqStub(), res);

      expect(GroupFindOne).toHaveBeenCalled();
      expect(UserAggregate).toHaveBeenCalled();
      expect(GroupAggregate).toHaveBeenCalled();

      expect(res.status).toBeCalledWith(400);
    });

    test("result should get non-exising users and already in a group", async () => {
      let userNotExist = "lar@lar.it";
      let userInGroup = "mat@mat.it";

      verifyUserOrAdmin.mockResolvedValue(verifiedResult());
      verifyAdmin.mockResolvedValue(verifiedResultAdmin());
      GroupFindOne.mockResolvedValueOnce(groupStub());
      const existingUsers = (() => {
        const g = groupStub().members.map((m) => {
          return { email: m.email };
        });
        g.push({ email: userInGroup });
        return g;
      })();
      UserAggregate.mockResolvedValueOnce(existingUsers);
      GroupAggregate.mockResolvedValueOnce([{ _id: userInGroup }]);
      UserAggregate.mockResolvedValueOnce(groupStub().members);
      GroupFindOneAndUpdate.mockResolvedValueOnce(groupStub());

      const req = reqStub();
      req.body.emails.push(...groupStub().members.map((m) => m.email));
      const res = mockRes();
      await addToGroup(req, res);

      expect(res.status).toBeCalledWith(200);
      expect(res.json).toBeCalledWith({
        data: {
          group: groupSchemaMapper(groupStub()),
          alreadyInGroup: [userInGroup],
          membersNotFound: [userNotExist],
        },
        refreshedTokenMessage: mockRes().locals.refreshedTokenMessage,
      });
    });
  });

  describe("removeFromGroup", () => {
    beforeEach(async () => {
      jest.clearAllMocks();
    });

    const emailsToRemove = groupStub().members.map((m) => m.email);
    const group = groupStub();
    let id = 3;
    const emailsToRemoveReference = emailsToRemove.map((e) => ({
      email: e,
      user: id++,
    }));
    const updatedGroup = (() => {
      const g = groupStub();
      g.members = [];
      return g;
    })();

    const reqStub = (admin = false) => ({
      body: {
        emails: emailsToRemove,
      },
      params: { name: group.name },
      path: admin ? "/pull" : "/remove",
    });

    const verifiedResult = () => ({
      flag: true,
      isAdmin: false,
      currUser: userStub("bre"),
    });

    const verifiedResultAdmin = () => ({
      flag: true,
      isAdmin: true,
      currUser: userStub("bre"),
    });

    test("should return the updated group", async () => {
      const res = mockRes();

      verifyUserOrAdmin.mockResolvedValue(verifiedResult());
      verifyAdmin.mockResolvedValue(verifiedResultAdmin());
      GroupFindOne.mockResolvedValueOnce(groupStub());
      UserAggregate.mockResolvedValueOnce(
        emailsToRemove.map((e) => ({ email: e }))
      );
      GroupAggregate.mockResolvedValueOnce(
        emailsToRemove.map((e) => ({ _id: e }))
      );
      UserAggregate.mockResolvedValueOnce(emailsToRemoveReference);
      GroupFindOneAndUpdate.mockResolvedValueOnce(updatedGroup);

      await removeFromGroup(reqStub(), res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: {
          group: groupSchemaMapper(updatedGroup),
          notInGroup: [],
          membersNotFound: [],
        },
        refreshedTokenMessage: mockRes().locals.refreshedTokenMessage,
      });
    });

    test("sould return 400 if group does not exist", async () => {
      verifyUserOrAdmin.mockResolvedValue(verifiedResult());
      verifyAdmin.mockResolvedValue(verifiedResultAdmin());
      GroupFindOne.mockResolvedValue();

      const res = mockRes();
      await removeFromGroup(reqStub(), res);

      expect(GroupFindOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("result status should be 400 when all users don't exists", async () => {
      verifyUserOrAdmin.mockResolvedValue(verifiedResult());
      verifyAdmin.mockResolvedValue(verifiedResultAdmin());
      GroupFindOne.mockResolvedValueOnce(groupStub());
      UserAggregate.mockResolvedValueOnce([]);
      GroupAggregate.mockResolvedValueOnce([]);

      const res = mockRes();
      await removeFromGroup(reqStub(), res);

      expect(GroupFindOne).toHaveBeenCalled();
      expect(UserAggregate).toHaveBeenCalled();
      expect(GroupAggregate).toHaveBeenCalled();

      expect(res.status).toBeCalledWith(400);
    });

    test("result status should be 400 when all users don't belong to a group or don't exist", async () => {
      verifyUserOrAdmin.mockResolvedValue(verifiedResult());
      verifyAdmin.mockResolvedValue(verifiedResultAdmin());
      GroupFindOne.mockResolvedValueOnce(groupStub());
      UserAggregate.mockResolvedValueOnce([{ email: emailsToRemove[0] }]);
      GroupAggregate.mockResolvedValue([{ _id: emailsToRemove[1] }]);

      const res = mockRes();
      await removeFromGroup(reqStub(), res);

      expect(GroupFindOne).toHaveBeenCalled();
      expect(UserAggregate).toHaveBeenCalled();
      expect(GroupAggregate).toHaveBeenCalled();

      expect(res.status).toBeCalledWith(400);
    });

    test("result should get non-exising users and not in a group", async () => {
      const userNotExist = "lar@lar.it";
      const userNotInGroup = "mat@mat.it";
      const existingUsers = (() => {
        const g = groupStub().members.map((m) => {
          return { email: m.email };
        });
        g.push({ email: userNotInGroup });
        return g;
      })();

      verifyUserOrAdmin.mockResolvedValue(verifiedResult());
      verifyAdmin.mockResolvedValue(verifiedResultAdmin());
      GroupFindOne.mockResolvedValueOnce(groupStub());
      UserAggregate.mockResolvedValueOnce(existingUsers);
      GroupAggregate.mockResolvedValueOnce(
        emailsToRemove.map((e) => ({ _id: e }))
      );
      UserAggregate.mockResolvedValueOnce(groupStub().members);
      GroupFindOneAndUpdate.mockResolvedValueOnce(updatedGroup);

      const req = reqStub();
      req.body.emails.push(userNotExist, userNotInGroup);
      const res = mockRes();
      await removeFromGroup(req, res);

      expect(res.status).toBeCalledWith(200);
      expect(res.json).toBeCalledWith({
        data: {
          group: groupSchemaMapper(updatedGroup),
          notInGroup: [userNotInGroup],
          membersNotFound: [userNotExist],
        },
        refreshedTokenMessage: mockRes().locals.refreshedTokenMessage,
      });
    });
  });

  describe("deleteGroup", () => {
    beforeEach(async () => {
      jest.clearAllMocks();
    });

    const groupToRemove = groupStub().name;
    const reqStub = () => ({
      body: { name: groupToRemove },
    });

    const verifiedResultAdmin = () => ({
      flag: true,
      isAdmin: true,
      currUser: userStub("bre"),
    });

    test("gruop should be removed", async () => {
      verifyAdmin.mockResolvedValue(verifiedResultAdmin());
      GroupFindOneAndDelete.mockResolvedValueOnce(groupStub());

      const res = mockRes();
      await deleteGroup(reqStub(), res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("shold return error if group does not exist", async () => {
      verifyAdmin.mockResolvedValue(verifiedResultAdmin());
      GroupFindOneAndDelete.mockResolvedValueOnce();

      const res = mockRes();
      await deleteGroup(reqStub(), res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
