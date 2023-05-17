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

/**
 * Defines code to be executed before each test case is launched
 * In this case the mock implementation of `User.find()` is cleared, allowing the definition of a new mock implementation.
 * Not doing this `mockClear()` means that test cases may use a mock implementation intended for other test cases.
 */
beforeEach(() => {
  jest.clearAllMocks();
  //additional `mockClear()` must be placed here
});

describe("User", () => {
  const mockRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    locals: {
      message: "",
    },
  });

  describe("getUsers", () => {
    beforeEach(async () => {
      jest.clearAllMocks();
    });

    test("should return empty list if there are no users", async () => {
      //any time the `User.find()` method is called jest will replace its actual implementation with the one defined below
      const mockReq = {};
      jest.spyOn(User, "find").mockResolvedValue([]);

      const res = mockRes();
      await getUsers(mockReq, res);

      expect(User.find).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: [],
        message: "",
      });
    });

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
      jest.spyOn(User, "find").mockResolvedValue(retrievedUsers);

      const res = mockRes();
      await getUsers(mockReq, res);

      expect(User.find).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: retrievedUsers,
        message: "",
      });
    });
  });

  describe("getUser", () => {
    beforeEach(async () => {
      jest.clearAllMocks();
    });

    const mockReq = () => ({
      params: { username: "bre" },
    });

    const userStub = () => ({
      username: "bre",
      email: "bre@bre.it",
      role: "Regular",
    });

    test("should return a user", async () => {
      jest.spyOn(User, "findOne").mockResolvedValue(userStub());

      const res = mockRes();
      await getUser(mockReq(), res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: userStub(),
        message: "",
      });
    });

    test("should return error", async () => {
      jest.spyOn(User, "findOne").mockResolvedValue();

      const res = mockRes();
      await getUser(mockReq(), res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("deleteUser", () => {
    beforeEach(async () => {
      jest.clearAllMocks();
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
        message: "",
      });
    });
  });
});

describe("Group", () => {
  const mockRes = () => {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  };

  // TODO: substitu aggregate calls with the ones in `group.utils.js`

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

    beforeEach(async () => {
      jest.resetAllMocks();
    });

    test("result status should be 200", async () => {
      GroupFindOne.mockResolvedValueOnce();
      UserAggregate.mockResolvedValueOnce(
        groupStub().members.map((m) => ({ email: m.email }))
      );
      GroupAggregate.mockResolvedValueOnce([]);
      UserAggregate.mockResolvedValueOnce(groupStub().members);
      GroupCreate.mockResolvedValueOnce([groupStub()]);

      const res = mockRes();
      await createGroup(reqStub(), res);

      expect(res.status).toBeCalledWith(200);
      expect(res.json).toBeCalledWith({
        data: {
          group: groupSchemaMapper(groupStub()),
          alreadyInGroup: [],
          membersNotFound: [],
        },
        message: "Group added successfully",
      });
      expect(GroupFindOne).toHaveBeenCalledWith({ name: groupStub().name });
      expect(GroupCreate).toHaveBeenCalledWith([groupStub()]);
    });

    test("result status should be 401 when group already exists", async () => {
      GroupFindOne.mockResolvedValue(groupStub());
      const res = mockRes();
      await createGroup(reqStub(), res);

      expect(GroupFindOne).toHaveBeenCalled();
      expect(res.status).toBeCalledWith(401);
      expect(res.json).toBeCalled();
    });

    test("result status should be 401 when all users don't exists", async () => {
      GroupFindOne.mockResolvedValue();
      UserAggregate.mockResolvedValue([]);
      GroupAggregate.mockResolvedValue([]);

      const res = mockRes();
      await createGroup(reqStub(), res);

      expect(GroupFindOne).toHaveBeenCalled();
      expect(UserAggregate).toHaveBeenCalled();
      expect(GroupAggregate).toHaveBeenCalled();

      expect(res.status).toBeCalledWith(401);
    });

    test("result status should be 401 when all user belong to a group or don't exist", async () => {
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

      expect(res.status).toBeCalledWith(401);
    });

    test("result should get non-exising users and already in a group", async () => {
      let userNotExist = "lar@lar.it";
      let userInGroup = "mat@mat.it";

      GroupFindOne.mockResolvedValueOnce();
      const existingUsers = groupStub().members.map((m) => {
        return { email: m.email };
      });
      existingUsers.push({ email: userInGroup });
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
        message: "Group added successfully",
      });
    });
  });

  describe("getGroups", () => {
    beforeEach(async () => {
      jest.clearAllMocks();
    });

    test("should return a list of all groups", async () => {
      GroupAggregate.mockResolvedValue([groupSchemaMapper(groupStub())]);

      const res = mockRes();
      await getGroups({}, res);

      expect(GroupAggregate).toBeCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: { groups: [groupSchemaMapper(groupStub())] },
        message: "All groups information",
      });
    });

    test("should return an empty list", async () => {
      GroupAggregate.mockResolvedValue([]);

      const res = mockRes();
      await getGroups({}, res);

      expect(GroupAggregate).toBeCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: { groups: [] },
        message: "All groups information",
      });
    });
  });

  describe("getGroup", () => {
    const reqStub = () => ({
      params: { name: groupStub().name },
    });

    beforeEach(async () => {
      jest.clearAllMocks();
    });

    test("should return a group", async () => {
      GroupFindOne.mockResolvedValue(groupStub());

      const res = mockRes();
      await getGroup(reqStub(), res);

      expect(GroupFindOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: groupSchemaMapper(groupStub()),
        message: "Group information",
      });
    });

    test("should return 401 because the group does not exist", async () => {
      GroupFindOne.mockResolvedValue();

      const res = mockRes();
      await getGroup(reqStub(), res);

      expect(GroupFindOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
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

    const reqStub = () => ({ body: emailsToAdd, params: { name: group.name } });

    test("should return the updated group", async () => {
      const res = mockRes();

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
        message: "Users added successfully to a group",
      });
    });

    test("sould return 401 if group does not exist", async () => {
      GroupFindOne.mockResolvedValue();

      const res = mockRes();
      await addToGroup(reqStub(), res);

      expect(GroupFindOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test("result status should be 401 when all users don't exists", async () => {
      GroupFindOne.mockResolvedValueOnce(groupStub());
      UserAggregate.mockResolvedValueOnce([]);
      GroupAggregate.mockResolvedValueOnce([]);

      const res = mockRes();
      await addToGroup(reqStub(), res);

      expect(GroupFindOne).toHaveBeenCalled();
      expect(UserAggregate).toHaveBeenCalled();
      expect(GroupAggregate).toHaveBeenCalled();

      expect(res.status).toBeCalledWith(401);
    });

    test("result status should be 401 when all user belong to a group or don't exist", async () => {
      GroupFindOne.mockResolvedValueOnce(groupStub());
      UserAggregate.mockResolvedValueOnce([{ email: emailsToAdd[0] }]);
      GroupAggregate.mockResolvedValue([{ _id: emailsToAdd[0] }]);

      const res = mockRes();
      await addToGroup(reqStub(), res);

      expect(GroupFindOne).toHaveBeenCalled();
      expect(UserAggregate).toHaveBeenCalled();
      expect(GroupAggregate).toHaveBeenCalled();

      expect(res.status).toBeCalledWith(401);
    });

    test("result should get non-exising users and already in a group", async () => {
      let userNotExist = "lar@lar.it";
      let userInGroup = "mat@mat.it";

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
      req.body.push(...groupStub().members.map((m) => m.email));
      const res = mockRes();
      await addToGroup(req, res);

      expect(res.status).toBeCalledWith(200);
      expect(res.json).toBeCalledWith({
        data: {
          group: groupSchemaMapper(groupStub()),
          alreadyInGroup: [userInGroup],
          membersNotFound: [userNotExist],
        },
        message: "Users added successfully to a group",
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

    const reqStub = () => ({
      body: emailsToRemove,
      params: { name: group.name },
    });

    test("should return the updated group", async () => {
      const res = mockRes();

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
        message: "Users removed successfully from a group",
      });
    });

    test("sould return 401 if group does not exist", async () => {
      GroupFindOne.mockResolvedValue();

      const res = mockRes();
      await removeFromGroup(reqStub(), res);

      expect(GroupFindOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test("result status should be 401 when all users don't exists", async () => {
      GroupFindOne.mockResolvedValueOnce(groupStub());
      UserAggregate.mockResolvedValueOnce([]);
      GroupAggregate.mockResolvedValueOnce([]);

      const res = mockRes();
      await removeFromGroup(reqStub(), res);

      expect(GroupFindOne).toHaveBeenCalled();
      expect(UserAggregate).toHaveBeenCalled();
      expect(GroupAggregate).toHaveBeenCalled();

      expect(res.status).toBeCalledWith(401);
    });

    test("result status should be 401 when all users don't belong to a group or don't exist", async () => {
      GroupFindOne.mockResolvedValueOnce(groupStub());
      UserAggregate.mockResolvedValueOnce([{ email: emailsToRemove[0] }]);
      GroupAggregate.mockResolvedValue([{ _id: emailsToRemove[1] }]);

      const res = mockRes();
      await removeFromGroup(reqStub(), res);

      expect(GroupFindOne).toHaveBeenCalled();
      expect(UserAggregate).toHaveBeenCalled();
      expect(GroupAggregate).toHaveBeenCalled();

      expect(res.status).toBeCalledWith(401);
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

      GroupFindOne.mockResolvedValueOnce(groupStub());
      UserAggregate.mockResolvedValueOnce(existingUsers);
      GroupAggregate.mockResolvedValueOnce(
        emailsToRemove.map((e) => ({ _id: e }))
      );
      UserAggregate.mockResolvedValueOnce(groupStub().members);
      GroupFindOneAndUpdate.mockResolvedValueOnce(updatedGroup);

      const req = reqStub();
      req.body.push(userNotExist, userNotInGroup);
      const res = mockRes();
      await removeFromGroup(req, res);

      expect(res.status).toBeCalledWith(200);
      expect(res.json).toBeCalledWith({
        data: {
          group: groupSchemaMapper(updatedGroup),
          notInGroup: [userNotInGroup],
          membersNotFound: [userNotExist],
        },
        message: "Users removed successfully from a group",
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

    test("gruop should be removed", async () => {
      GroupFindOneAndDelete.mockResolvedValueOnce(groupStub());

      const res = mockRes();
      await deleteGroup(reqStub(), res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("shold return error if group does not exist", async () => {
      GroupFindOneAndDelete.mockResolvedValueOnce();

      const res = mockRes();
      await deleteGroup(reqStub(), res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
