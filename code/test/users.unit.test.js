import request from "supertest";
import { app } from "../app";
import { Group, GroupSchema, User } from "../models/User.js";
import { createGroup } from "../controllers/users";
import groupStub from "./stubs/group.stub";
import { Document } from "mongoose";

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
  User.find.mockClear();
  //additional `mockClear()` must be placed here
});

describe("getUsers", () => {
  test("should return empty list if there are no users", async () => {
    //any time the `User.find()` method is called jest will replace its actual implementation with the one defined below
    jest.spyOn(User, "find").mockImplementation(() => []);
    const response = await request(app).get("/api/users");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  test("should retrieve list of all users", async () => {
    const retrievedUsers = [
      {
        username: "test1",
        email: "test1@example.com",
        password: "hashedPassword1",
      },
      {
        username: "test2",
        email: "test2@example.com",
        password: "hashedPassword2",
      },
    ];
    jest.spyOn(User, "find").mockImplementation(() => retrievedUsers);
    const response = await request(app).get("/api/users");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(retrievedUsers);
  });
});

describe("getUser", () => {});

describe("Groups", () => {
  const mockRes = () => {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  };

  const membersEmails = [
    "bre@bre.it",
    "fra@fra.it",
    "mat@mat.it",
    "lar@lar.it",
  ];

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe("createGroup", () => {
    describe("when calling createGroup", () => {
      let res;

      beforeEach(async () => {
        jest.spyOn(Group, "findOne").mockResolvedValueOnce();
        jest.spyOn(User, "aggregate").mockResolvedValueOnce(
          groupStub().members.map((m) => {
            return { email: m.email };
          })
        );
        jest.spyOn(Group, "aggregate").mockResolvedValueOnce([]);
        jest
          .spyOn(User, "aggregate")
          .mockResolvedValueOnce(groupStub().members);
        jest.spyOn(Group, "insertMany").mockResolvedValueOnce(groupStub());
        res = mockRes();

        await createGroup(
          {
            body: {
              name: groupStub().name,
              membersEmails: groupStub().members.map((m) => m.email),
            },
          },
          res
        );
      });

      afterEach(async () => {
        Group.findOne.mockClear();
        Group.aggregate.mockClear();
        Group.insertMany.mockClear();
        User.aggregate.mockClear();
      });

      test("then it sould return a data", async () => {
        expect(res.json).toBeCalledWith({
          data: {
            group: {
              name: groupStub().name,
              members: groupStub().members.map((m) => m.email),
              alreadyInGroup: [],
              membersNotFound: [],
            },
          },
          message: "Group added successfully",
        });
      });

      test("then Group.findOne should return nothing", async () => {
        expect(Group.findOne).toHaveBeenCalledWith({ name: groupStub().name });
      });

      test("then the new group should be inserted", async () => {
        expect(Group.insertMany).toHaveBeenCalledWith([groupStub()]);
      });

      test("then it sould return status 200", async () => {
        expect(res.status).toBeCalledWith(200);
      });
    });
  });

  describe("getGroups", () => {});

  describe("getGroup", () => {});

  describe("addToGroup", () => {});

  describe("removeFromGroup", () => {});

  describe("deleteGroup", () => {});
});

describe("deleteUser", () => {});
