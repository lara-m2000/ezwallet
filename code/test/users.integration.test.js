import request from "supertest";
import { app } from "../app";
import { User, Group, UserSchema } from "../models/User.js";
import { transactions, categories } from "../models/model";
import mongoose, { Model } from "mongoose";
import dotenv from "dotenv";
import { groupSchemaMapper } from "../controllers/group.utils";

/**
 * Necessary setup in order to create a new database for testing purposes before starting the execution of test cases.
 * Each test suite has its own database in order to avoid different tests accessing the same database at the same time and expecting different data.
 */
dotenv.config();
beforeAll(async () => {
  const dbName = "testingDatabaseUsers";
  const url = `${process.env.MONGO_URI}/${dbName}`;

  mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

/**
 * After all test cases have been executed the database is deleted.
 * This is done so that subsequent executions of the test suite start with an empty database.
 */
afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
});

describe("Users", () => {
  const newUser = (user) => ({
    username: user,
    email: `${user}@${user}.it`,
    role: "Regular",
  });

  const dbUser = (user) => ({
    ...newUser(user),
    password: user,
  });

  const userTransactions = (user) => [
    { username: user, type: "boh" },
    { username: user, type: "test" },
    { username: user, type: "cabodi" },
  ];

  describe("getUsers", () => {
    /**
     * Database is cleared before each test case, in order to allow insertion of data tailored for each specific test case.
     */
    beforeEach(async () => {
      await User.deleteMany({});
    });

    test("should return empty list if there are no users", async () => {
      const response = await request(app).get("/api/users");

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
    });

    test("should retrieve list of all users", async () => {
      await User.create(dbUser("bre"));

      const response = await request(app).get("/api/users");

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([newUser("bre")]);
    });
  });

  describe("getUser", () => {
    beforeEach(async () => {
      await User.deleteMany({});
    });

    const sendRequest = async (username) => {
      return await request(app)
        .get(`/api/users/${username}`)
        .set("Content-Type", "application/json")
        .send();
    };

    test("should return a user", async () => {
      await User.create(dbUser("bre"));

      const res = await sendRequest(newUser("bre").username);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(newUser("bre"));
    });

    test("should return error if user does not exist", async () => {
      const res = await sendRequest(newUser("bre").username);

      expect(res.status).toBe(401);
    });
  });

  describe("deleteUser", () => {
    beforeEach(async () => {
      await User.deleteMany({});
      await transactions.deleteMany({});
    });

    const sendRequest = async (email) => {
      return await request(app)
        .delete("/api/users")
        .set("Content-Type", "application/json")
        .send({ email: email });
    };

    test("should return deleted user", async () => {
      await User.create(dbUser("bre"));

      const res = await sendRequest(newUser("bre").email);

      expect(res.status).toBe(200);
      expect(res.body.data.deletedTransactions).toBe(0);
      expect(res.body.data.deletedFromGroup).toBe(false);
    });

    test("should return error if user doesn't exist", async () => {
      const res = await sendRequest(newUser("bre").email);

      expect(res.status).toBe(401);
    });

    test("should return removed transactions", async () => {
      await User.create(dbUser("bre"));
      await transactions.create(userTransactions("bre"));

      const res = await sendRequest(newUser("bre").email);

      expect(res.status).toBe(200);
      expect(res.body.data.deletedTransactions).toBe(
        userTransactions("bre").length
      );
      expect(res.body.data.deletedFromGroup).toBe(false);
    });

    test("should return removed transactions and removed group", async () => {
      await User.create(dbUser("bre"));
      await transactions.create(userTransactions("bre"));
      await Group.create({
        name: "test",
        members: [
          { email: newUser("bre").email },
          { email: newUser("test").email },
        ],
      });

      const res = await sendRequest(newUser("bre").email);

      expect(res.status).toBe(200);
      expect(res.body.data.deletedTransactions).toBe(
        userTransactions("bre").length
      );
      expect(res.body.data.deletedFromGroup).toBe(true);
    });
  });
});

describe("Groups", () => {
  const newUser = (user) => ({
    username: user,
    email: `${user}@${user}.it`,
    password: user,
  });

  describe("createGroup", () => {
    const groupStub = () => ({
      name: "test",
      memberEmails: ["bre@bre.it", "fra@fra.it"],
    });

    const sendRequest = async (body) => {
      return await request(app)
        .post("/api/groups")
        .set("Content-Type", "application/json")
        .send(body);
    };

    beforeEach(async () => {
      await Promise.all([User.deleteMany({}), Group.deleteMany({})]);
    });

    test("should create a new group", async () => {
      await User.create([newUser("bre"), newUser("fra")]);

      const res = await sendRequest(groupStub());

      expect(res.status).toBe(200);
      expect(res.body.data.group.name).toBe(groupStub().name);
      expect(res.body.data.group.members).toEqual(groupStub().memberEmails);
      expect(res.body.data.alreadyInGroup).toEqual([]);
      expect(res.body.data.membersNotFound).toEqual([]);
    });

    test("should return error if group already exists", async () => {
      await Group.create({ name: groupStub().name });

      const res = await sendRequest(groupStub());

      expect(res.status).toBe(401);
    });

    test("should return non exising users", async () => {
      await User.create(newUser("fra"));

      const res = await sendRequest(groupStub());

      expect(res.status).toBe(200);
      expect(res.body.data.group.members).toEqual([newUser("fra").email]);
      expect(res.body.data.membersNotFound).toEqual([newUser("bre").email]);
    });

    test("should return non exising users in a group", async () => {
      await User.create([newUser("bre"), newUser("fra")]);
      await Group.create({
        name: "pippo",
        members: [{ email: newUser("fra").email }],
      });

      const res = await sendRequest(groupStub());

      expect(res.status).toBe(200);
      expect(res.body.data.alreadyInGroup).toEqual([newUser("fra").email]);
      expect(res.body.data.group.members).toEqual([newUser("bre").email]);
    });

    test("should return error if users do not exist or belog to a group", async () => {
      await User.create([newUser("fra")]);
      await Group.create({
        name: "pippo",
        members: [{ email: newUser("fra").email }],
      });

      const res = await sendRequest(groupStub());

      expect(res.status).toBe(401);
    });
  });

  describe("getGroups", () => {
    const sendRequest = async (body) => {
      return await request(app)
        .get("/api/groups")
        .set("Content-Type", "application/json")
        .send(body);
    };

    beforeEach(async () => {
      await Group.deleteMany({});
    });

    const newGroup = (name) => ({
      name: name,
      members: [{ email: "bre@bre.it" }],
    });

    test("should return list of groups", async () => {
      await Group.create(newGroup("test"));

      const res = await sendRequest({});

      expect(res.status).toBe(200);
      expect(res.body.data.groups).toEqual([
        groupSchemaMapper(newGroup("test")),
      ]);
    });

    test("should return empty list", async () => {
      const res = await sendRequest({});

      expect(res.status).toBe(200);
      expect(res.body.data.groups).toEqual([]);
    });
  });

  describe("getGroup", () => {
    const sendRequest = async (name, body) => {
      return await request(app)
        .get(`/api/groups/${name}`)
        .set("Content-Type", "application/json")
        .send(body);
    };

    beforeEach(async () => {
      await Group.deleteMany({});
    });

    const newGroup = (name) => ({
      name: name,
      members: [{ email: "bre@bre.it" }, { email: "fra@fra.it" }],
    });

    test("should return a group", async () => {
      await Group.create(newGroup("test"));

      const res = await sendRequest("test", {});

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(groupSchemaMapper(newGroup("test")));
    });

    test("should return error if groups does not exist", async () => {
      const res = await sendRequest("test", {});

      expect(res.status).toBe(401);
    });
  });

  describe("addToGroup", () => {
    const sendRequest = async (name, body) => {
      return await request(app)
        .patch(`/api/groups/${name}/add`)
        .set("Content-Type", "application/json")
        .send(body);
    };

    const usersToAdd = [newUser("lar").email, newUser("mat").email];

    const groupStub = () => ({
      name: "test",
      members: [
        { email: newUser("bre").email },
        { email: newUser("fra").email },
      ],
    });

    beforeEach(async () => {
      await Promise.all([User.deleteMany({}), Group.deleteMany({})]);
    });

    test("should add new users to a group", async () => {
      const updatedGroup = groupStub();
      updatedGroup.members.push(...usersToAdd.map((u) => ({ email: u })));
      await User.create([
        newUser("bre"),
        newUser("fra"),
        newUser("lar"),
        newUser("mat"),
      ]);
      await Group.create(groupStub());

      const res = await sendRequest(groupStub().name, usersToAdd);

      expect(res.status).toBe(200);
      expect(res.body.data.group).toEqual(groupSchemaMapper(updatedGroup));
      expect(res.body.data.alreadyInGroup).toEqual([]);
      expect(res.body.data.membersNotFound).toEqual([]);
    });

    test("should return error if group doesn't exist", async () => {
      await Group.create(groupStub());

      const res = await sendRequest(groupStub().name, usersToAdd);

      expect(res.status).toBe(401);
    });

    test("should return non exising users", async () => {
      const addedUsers = (() => {
        const u = groupStub().members;
        u.push(newUser("lar").email);
        return u;
      })();

      const updatedGroup = groupStub();
      updatedGroup.members.push({ email: newUser("lar").email });

      await User.create([newUser("bre"), newUser("fra"), newUser("lar")]);
      await Group.create(groupStub());

      const res = await sendRequest(groupStub().name, usersToAdd);

      expect(res.status).toBe(200);
      expect(res.body.data.membersNotFound).toEqual([newUser("mat").email]);
      expect(res.body.data.group).toEqual(groupSchemaMapper(updatedGroup));
    });

    test("should return users in a group", async () => {
      await User.create([
        newUser("bre"),
        newUser("fra"),
        newUser("lar"),
        newUser("mat"),
      ]);
      await Group.create(groupStub());
      await Group.create({
        name: "pippo",
        members: [{ email: newUser("mat").email }],
      });

      const updatedGroup = groupStub();
      updatedGroup.members.push({ email: newUser("lar").email });

      const res = await sendRequest(groupStub().name, usersToAdd);

      expect(res.status).toBe(200);
      expect(res.body.data.alreadyInGroup).toEqual([newUser("mat").email]);
      expect(res.body.data.group).toEqual(groupSchemaMapper(updatedGroup));
    });

    test("should return error if users do not exist or belog to a group", async () => {
      await User.create([newUser("bre"), newUser("fra"), newUser("mat")]);
      await Group.create(groupStub());
      await Group.create({
        name: "pippo",
        members: [{ email: newUser("mat").email }],
      });

      const res = await sendRequest(groupStub().name, usersToAdd);

      expect(res.status).toBe(401);
    });
  });

  describe("removeFromGroup", () => {
    const sendRequest = async (name, body) => {
      return await request(app)
        .patch(`/api/groups/${name}/remove`)
        .set("Content-Type", "application/json")
        .send(body);
    };

    const usersToRemove = [newUser("bre").email, newUser("fra").email];

    const groupStub = () => ({
      name: "test",
      members: usersToRemove.map((u) => ({ email: u })),
    });

    beforeEach(async () => {
      await Promise.all([User.deleteMany({}), Group.deleteMany({})]);
    });

    test("should remove users from a group", async () => {
      const updatedGroup = groupStub();
      updatedGroup.members = [];
      await User.create([newUser("bre"), newUser("fra")]);
      await Group.create(groupStub());

      const res = await sendRequest(groupStub().name, usersToRemove);

      expect(res.status).toBe(200);
      expect(res.body.data.group).toEqual(groupSchemaMapper(updatedGroup));
      expect(res.body.data.notInGroup).toEqual([]);
      expect(res.body.data.membersNotFound).toEqual([]);
    });

    test("should return error if group doesn't exist", async () => {
      await Group.create(groupStub());

      const res = await sendRequest(groupStub().name, usersToRemove);

      expect(res.status).toBe(401);
    });

    test("should return non existing users", async () => {
      const userNotExist = "lar@lar.it";
      const usersToRemove = [groupStub().members[0].email, userNotExist];
      const updatedGroup = groupStub();
      updatedGroup.members.splice(0, 1);

      await User.create([newUser("bre"), newUser("fra")]);
      await Group.create(groupStub());

      const res = await sendRequest(groupStub().name, usersToRemove);

      expect(res.status).toBe(200);
      expect(res.body.data.membersNotFound).toEqual([userNotExist]);
      expect(res.body.data.group).toEqual(groupSchemaMapper(updatedGroup));
    });

    test("should return users not in a group", async () => {
      const userNotInGroup = "lar@lar.it";
      const usersToRemove = [groupStub().members[0].email, userNotInGroup];
      const updatedGroup = groupStub();
      updatedGroup.members.splice(0, 1);

      await User.create([newUser("bre"), newUser("fra"), newUser("lar")]);
      await Group.create(groupStub());

      const res = await sendRequest(groupStub().name, usersToRemove);

      expect(res.status).toBe(200);
      expect(res.body.data.notInGroup).toEqual([userNotInGroup]);
      expect(res.body.data.group).toEqual(groupSchemaMapper(updatedGroup));
    });

    test("should return error if users don't exist or don't belog to a group", async () => {
      const userNotExist = "lar@lar.it";
      const userNotInGroup = "mat@mat.it";
      const usersToRemove = [userNotExist, userNotInGroup];

      await User.create(newUser("mat"));
      await Group.create(groupStub());

      const res = await sendRequest(groupStub().name, usersToRemove);

      expect(res.status).toBe(401);
    });
  });

  describe("deleteGroup", () => {
    const sendRequest = async (body) => {
      return await request(app)
        .delete("/api/groups/")
        .set("Content-Type", "application/json")
        .send(body);
    };

    const usersToRemove = [newUser("bre").email, newUser("fra").email];

    const groupStub = () => ({
      name: "test",
      members: usersToRemove.map((u) => ({ email: u })),
    });

    beforeEach(async () => {
      await Promise.all([User.deleteMany({}), Group.deleteMany({})]);
    });

    test("group should be removed", async () => {
      await Group.create({ name: "test" });

      const res = await sendRequest({ name: "test" });

      expect(res.status).toBe(200);
    });

    test("should return error if group does not exist", async () => {
      const res = await sendRequest({ name: "test" });

      expect(res.status).toBe(401);
    });
  });
});
