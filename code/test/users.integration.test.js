import request from "supertest";
import { app } from "../app";
import { User, Group, UserSchema } from "../models/User.js";
import { transactions, categories } from "../models/model";
import mongoose, { Model } from "mongoose";
import dotenv from "dotenv";
import { groupSchemaMapper } from "../controllers/group.utils";
import jwt from "jsonwebtoken";
import { userSchemaMapper } from "../controllers/users.utils";

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

const newUser = (user) => ({
  username: user,
  email: `${user}@${user}.it`,
  id: user,
  password: user,
});

/**
 *
 * @param {*} user
 * @param {"Regular"|"Admin"} role
 * @returns
 */
const newDbUser = (user, role = "Regular") => ({
  ...newUser(user),
  role: role,
  refreshToken: jwt.sign(
    { ...newUser(user), password: undefined, role: role },
    process.env.ACCESS_KEY,
    { expiresIn: "300d" }
  ),
  accessToken: jwt.sign(
    { ...newUser(user), password: undefined, role: role },
    process.env.ACCESS_KEY,
    { expiresIn: "300d" }
  ),
});

describe("Users", () => {
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

    const breAdmin = newDbUser("breAdmin", "Admin");
    const bre = newDbUser("bre");

    const users = [breAdmin, bre];

    const sendRequest = async (refreshToken = breAdmin.refreshToken) => {
      return await request(app)
        .get("/api/users")
        .set("Content-Type", "application/json")
        .set("Cookie", [
          `refreshToken=${refreshToken}`,
          `accessToken=${refreshToken}`,
        ])
        .send();
    };

    /***********************************************/

    test("should retrieve list of all users", async () => {
      await User.create(users);

      const res = await sendRequest();

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(users.length);
    });

    test("should return error if user requesting is not Admin", async () => {
      await User.create(users);

      const res = await sendRequest(bre.refreshToken);

      expect(res.status).toBe(401);
    });
  });

  describe("getUser", () => {
    beforeEach(async () => {
      await User.deleteMany({});
    });

    const bre = newDbUser("bre");
    const fra = newDbUser("fra");
    const breAdmin = newDbUser("breAdmin", "Admin");

    const users = [bre, fra, breAdmin];

    const sendRequest = async (
      username,
      refreshToken = breAdmin.refreshToken
    ) => {
      return await request(app)
        .get(`/api/users/${username}`)
        .set("Content-Type", "application/json")
        .set("Cookie", [
          `refreshToken=${refreshToken}`,
          `accessToken=${refreshToken}`,
        ])
        .send();
    };

    /****************************************/

    test("should return my user", async () => {
      await User.create(users);

      const res = await sendRequest(bre.username, bre.refreshToken);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(userSchemaMapper(bre));
    });

    test("should return another user when making Admin request", async () => {
      await User.create(users);

      const res = await sendRequest(bre.username);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(userSchemaMapper(bre));
    });

    test("should return error if user does not exist", async () => {
      const users = [breAdmin];
      await User.create(users);

      const res = await sendRequest(bre.username);

      expect(res.status).toBe(400);
    });

    test("should return error if user tryies to get another user", async () => {
      await User.create(users);

      const res = await sendRequest(fra.username, bre.refreshToken);

      expect(res.status).toBe(401);
    });
  });

  describe("deleteUser", () => {
    beforeEach(async () => {
      await User.deleteMany({});
      await transactions.deleteMany({});
    });

    const bre = newDbUser("bre");
    const fra = newDbUser("fra");
    const breAdmin = newDbUser("breAdmin", "Admin");

    const users = [bre, fra, breAdmin];

    const sendRequest = async (email, refreshToken = breAdmin.refreshToken) => {
      return await request(app)
        .delete("/api/users")
        .set("Content-Type", "application/json")
        .set("Cookie", [
          `refreshToken=${refreshToken}`,
          `accessToken=${refreshToken}`,
        ])
        .send({ email: email });
    };

    /*************************************/

    test("should return deleted user", async () => {
      await User.create(users);

      const res = await sendRequest(bre.email);

      expect(res.status).toBe(200);
      expect(res.body.data.deletedTransactions).toBe(0);
      expect(res.body.data.deletedFromGroup).toBe(false);
    });

    test("should return error if requesting user is not Admin", async () => {
      await User.create(users);

      const res = await sendRequest(fra.email, bre.refreshToken);

      expect(res.status).toBe(401);
    });

    test("should return error if user doesn't exist", async () => {
      const users = [fra, breAdmin];

      await User.create(users);
      const res = await sendRequest(bre.email);

      expect(res.status).toBe(400);
    });

    test("should return removed transactions", async () => {
      await User.create(users);
      await transactions.create(userTransactions("bre"));

      const res = await sendRequest(bre.email);

      expect(res.status).toBe(200);
      expect(res.body.data.deletedTransactions).toBe(
        userTransactions("bre").length
      );
      expect(res.body.data.deletedFromGroup).toBe(false);
    });

    test("should return removed transactions and removed group", async () => {
      await User.create(users);
      await transactions.create(userTransactions("bre"));
      await Group.create({
        name: "test",
        members: [{ email: bre.email }, { email: fra.email }],
      });

      const res = await sendRequest(bre.email);

      expect(res.status).toBe(200);
      expect(res.body.data.deletedTransactions).toBe(
        userTransactions("bre").length
      );
      expect(res.body.data.deletedFromGroup).toBe(true);
    });
  });
});

describe("Groups", () => {
  describe("createGroup", () => {
    const groupStub = () => ({
      name: "test",
      members: [{ email: "bre@bre.it" }, { email: "fra@fra.it" }],
    });

    const bodyStub = () => ({
      name: groupStub().name,
      memberEmails: groupStub().members.map((m) => m.email),
    });

    const paramsStub = () => ({
      refreshToken: "bre",
    });

    const sendRequest = async (body, refreshToken = null) => {
      return await request(app)
        .post("/api/groups")
        .set("Content-Type", "application/json")
        .set("Cookie", [
          `refreshToken=${refreshToken}`,
          `accessToken=${refreshToken}`,
        ])
        .send(body);
    };

    beforeEach(async () => {
      await Promise.all([User.deleteMany({}), Group.deleteMany({})]);
    });

    test("should create a new group", async () => {
      const bre = newDbUser("bre");
      const fra = newDbUser("fra");
      await User.create([bre, fra]);

      const res = await sendRequest(bodyStub(), bre.refreshToken);

      expect(res.status).toBe(200);
      expect(res.body.data.group).toEqual(groupStub());
      expect(res.body.data.alreadyInGroup).toEqual([]);
      expect(res.body.data.membersNotFound).toEqual([]);
    });

    test("should return error if group already exists", async () => {
      const bre = newDbUser("bre");

      await User.create(bre);
      await Group.create({ name: groupStub().name });

      const res = await sendRequest(bodyStub(), bre.refreshToken);

      expect(res.status).toBe(400);
    });

    test("should return non exising users", async () => {
      const fra = newDbUser("fra");
      await User.create(fra);

      const res = await sendRequest(bodyStub(), fra.refreshToken);

      expect(res.status).toBe(200);
      expect(res.body.data.group.members).toEqual([{ email: fra.email }]);
      expect(res.body.data.membersNotFound).toEqual([newUser("bre").email]);
    });

    test("should return non exising users in a group", async () => {
      const bre = newDbUser("bre");
      const fra = newDbUser("fra");
      await User.create([bre, fra]);
      await Group.create({
        name: "pippo",
        members: [{ email: newUser("fra").email }],
      });

      const res = await sendRequest(bodyStub(), fra.refreshToken);

      expect(res.status).toBe(200);
      expect(res.body.data.alreadyInGroup).toEqual([newUser("fra").email]);
      expect(res.body.data.group.members).toEqual([
        {
          email: newUser("bre").email,
        },
      ]);
    });

    test("should return error if users do not exist or belog to a group", async () => {
      const fra = newDbUser("fra");
      await User.create(fra);
      await Group.create({
        name: "pippo",
        members: [{ email: fra.email }],
      });

      const res = await sendRequest(bodyStub(), fra.refreshToken);

      expect(res.status).toBe(400);
    });
  });

  describe("getGroups", () => {
    const sendRequest = async (body, refreshToken = breAdmin.refreshToken) => {
      return await request(app)
        .get("/api/groups")
        .set("Content-Type", "application/json")
        .set("Cookie", [
          `refreshToken=${refreshToken}`,
          `accessToken=${refreshToken}`,
        ])
        .send(body);
    };

    const breAdmin = newDbUser("bre", "Admin");
    const fra = newDbUser("fra");

    beforeAll(async () => {
      await User.deleteMany();
      await User.create([breAdmin, fra]);
    });

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

    test("should return error if user requesting is not Admin", async () => {
      await Group.create(newGroup("test"));

      const res = await sendRequest({}, fra.refreshToken);

      expect(res.status).toBe(401);
    });
  });

  describe("getGroup", () => {
    const sendRequest = async (name, body, refreshToken = bre.refreshToken) => {
      return await request(app)
        .get(`/api/groups/${name}`)
        .set("Content-Type", "application/json")
        .set("Cookie", [
          `refreshToken=${refreshToken}`,
          `accessToken=${refreshToken}`,
        ])
        .send(body);
    };

    const bre = newDbUser("bre");
    const lar = newDbUser("lar");
    const breAdmin = newDbUser("breAdmin", "Admin");

    beforeAll(async () => {
      await User.deleteMany();
      await User.create([bre, lar, breAdmin]);
    });

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

      expect(res.status).toBe(400);
    });

    test("should return error if user requestin is not part of the group", async () => {
      await Group.create(newGroup("test"));

      const res = await sendRequest("test", {}, lar.refreshToken);

      expect(res.status).toBe(401);
    });

    test("should return group if user if user is admin", async () => {
      await Group.create(newGroup("test"));

      const res = await sendRequest("test", {}, breAdmin.refreshToken);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(groupSchemaMapper(newGroup("test")));
    });
  });

  describe("addToGroup", () => {
    const sendRequest = async (
      name,
      body,
      refreshToken = bre.refreshToken,
      admin = false
    ) => {
      return await request(app)
        .patch(`/api/groups/${name}/${admin ? "insert" : "add"}`)
        .set("Content-Type", "application/json")
        .set("Cookie", [
          `refreshToken=${refreshToken}`,
          `accessToken=${refreshToken}`,
        ])
        .send(body);
    };

    const bre = newDbUser("bre");
    const fra = newDbUser("fra");
    const lar = newDbUser("lar");
    const mat = newDbUser("mat");
    const breAdmin = newDbUser("breAdmin", "Admin");

    const usersToAdd = [lar.email, mat.email];

    const groupStub = () => ({
      name: "test",
      members: [{ email: bre.email }, { email: fra.email }],
    });

    const bodyStub = () => ({
      emails: usersToAdd,
    });

    beforeEach(async () => {
      await Promise.all([User.deleteMany({}), Group.deleteMany({})]);
    });

    test("should add new users to a group", async () => {
      const updatedGroup = groupStub();
      updatedGroup.members.push(...usersToAdd.map((u) => ({ email: u })));
      await User.create([bre, fra, lar, mat]);
      await Group.create(groupStub());

      const res = await sendRequest(groupStub().name, bodyStub());

      expect(res.status).toBe(200);
      expect(res.body.data.group).toEqual(groupSchemaMapper(updatedGroup));
      expect(res.body.data.alreadyInGroup).toEqual([]);
      expect(res.body.data.membersNotFound).toEqual([]);
    });

    test("should add new users to a group with Admin role", async () => {
      const updatedGroup = groupStub();
      updatedGroup.members.push(...usersToAdd.map((u) => ({ email: u })));
      await User.create([bre, fra, lar, mat, breAdmin]);
      await Group.create(groupStub());

      const res = await sendRequest(
        groupStub().name,
        bodyStub(),
        breAdmin.refreshToken,
        true
      );

      expect(res.status).toBe(200);
      expect(res.body.data.group).toEqual(groupSchemaMapper(updatedGroup));
      expect(res.body.data.alreadyInGroup).toEqual([]);
      expect(res.body.data.membersNotFound).toEqual([]);
    });

    test("should return error if group doesn't exist", async () => {
      await User.create(bre);
      await Group.create(groupStub());

      const res = await sendRequest("random", bodyStub());

      expect(res.status).toBe(400);
    });

    test("should return non exising users", async () => {
      const addedUsers = (() => {
        const u = groupStub().members;
        u.push(lar.email);
        return u;
      })();

      const updatedGroup = groupStub();
      updatedGroup.members.push({ email: lar.email });

      await User.create([bre, fra, lar]);
      await Group.create(groupStub());

      const res = await sendRequest(groupStub().name, bodyStub());

      expect(res.status).toBe(200);
      expect(res.body.data.membersNotFound).toEqual([mat.email]);
      expect(res.body.data.group).toEqual(groupSchemaMapper(updatedGroup));
    });

    test("should return users in a group", async () => {
      await User.create([bre, fra, lar, mat]);
      await Group.create(groupStub());
      await Group.create({
        name: "pippo",
        members: [{ email: mat.email }],
      });

      const updatedGroup = groupStub();
      updatedGroup.members.push({ email: lar.email });

      const res = await sendRequest(groupStub().name, bodyStub());

      expect(res.status).toBe(200);
      expect(res.body.data.alreadyInGroup).toEqual([mat.email]);
      expect(res.body.data.group).toEqual(groupSchemaMapper(updatedGroup));
    });

    test("should return error if users do not exist or belog to a group", async () => {
      await User.create([bre, fra, mat]);
      await Group.create(groupStub());
      await Group.create({
        name: "pippo",
        members: [{ email: mat.email }],
      });

      const res = await sendRequest(groupStub().name, bodyStub());

      expect(res.status).toBe(400);
    });

    test("return error if user requesting is not part of the group", async () => {
      await User.create([bre, fra, lar, mat]);
      await Group.create(groupStub());

      const res = await sendRequest(
        groupStub().name,
        bodyStub(),
        lar.refreshToken
      );

      expect(res.status).toBe(401);
    });
  });

  describe("removeFromGroup", () => {
    const sendRequest = async (
      name,
      body,
      refreshToken = bre.refreshToken,
      admin = false
    ) => {
      return await request(app)
        .patch(`/api/groups/${name}/${admin ? "pull" : "remove"}`)
        .set("Content-Type", "application/json")
        .set("Cookie", [
          `refreshToken=${refreshToken}`,
          `accessToken=${refreshToken}`,
        ])
        .send(body);
    };

    const bre = newDbUser("bre");
    const fra = newDbUser("fra");
    const lar = newDbUser("lar");
    const mat = newDbUser("mat");
    const gia = newDbUser("gia");
    const breAdmin = newDbUser("breAdmin", "Admin");

    const usersToRemove = [bre.email, fra.email];

    const bodyStub = () => ({
      emails: usersToRemove,
    });

    const groupStub = () => ({
      name: "test",
      members: [
        ...usersToRemove.map((u) => ({ email: u })),
        { email: gia.email },
      ],
    });

    beforeEach(async () => {
      await Promise.all([User.deleteMany({}), Group.deleteMany({})]);
    });

    test("should remove users from a group", async () => {
      const updatedGroup = groupStub();
      updatedGroup.members = [{ email: gia.email }];
      await User.create([bre, fra, gia]);
      await Group.create(groupStub());

      const res = await sendRequest(groupStub().name, bodyStub());

      expect(res.status).toBe(200);
      expect(res.body.data.group).toEqual(groupSchemaMapper(updatedGroup));
      expect(res.body.data.notInGroup).toEqual([]);
      expect(res.body.data.membersNotFound).toEqual([]);
    });

    test("should remove users from a group with Admin role", async () => {
      const updatedGroup = groupStub();
      updatedGroup.members = [{ email: gia.email }];
      await User.create([bre, fra, breAdmin]);
      await Group.create(groupStub());

      const res = await sendRequest(
        groupStub().name,
        bodyStub(),
        breAdmin.refreshToken,
        true
      );

      expect(res.status).toBe(200);
      expect(res.body.data.group).toEqual(groupSchemaMapper(updatedGroup));
      expect(res.body.data.notInGroup).toEqual([]);
      expect(res.body.data.membersNotFound).toEqual([]);
    });

    test("should return error if group doesn't exist", async () => {
      await User.create(bre);
      await Group.create(groupStub());

      const res = await sendRequest("random", bodyStub());

      expect(res.status).toBe(400);
    });

    test("should return non existing users", async () => {
      const userNotExist = lar.email;
      const usersToRemove = [groupStub().members[0].email, userNotExist];
      const updatedGroup = groupStub();
      updatedGroup.members.splice(0, 1);

      await User.create([bre, fra]);
      await Group.create(groupStub());

      const res = await sendRequest(groupStub().name, {
        emails: usersToRemove,
      });

      expect(res.status).toBe(200);
      expect(res.body.data.membersNotFound).toEqual([userNotExist]);
      expect(res.body.data.group).toEqual(groupSchemaMapper(updatedGroup));
    });

    test("should return users not in a group", async () => {
      const userNotInGroup = lar.email;
      const usersToRemove = [groupStub().members[0].email, userNotInGroup];
      const updatedGroup = groupStub();
      updatedGroup.members.splice(0, 1);

      await User.create([bre, fra, lar]);
      await Group.create(groupStub());

      const res = await sendRequest(groupStub().name, {
        emails: usersToRemove,
      });

      expect(res.status).toBe(200);
      expect(res.body.data.notInGroup).toEqual([userNotInGroup]);
      expect(res.body.data.group).toEqual(groupSchemaMapper(updatedGroup));
    });

    test("should return error if users don't exist or don't belog to a group", async () => {
      const userNotExist = lar.email;
      const userNotInGroup = mat.email;
      const usersToRemove = [userNotExist, userNotInGroup];

      await User.create([bre, fra, mat]);
      await Group.create(groupStub());

      const res = await sendRequest(groupStub().name, {
        emails: usersToRemove,
      });

      expect(res.status).toBe(400);
    });

    test("should return error if user is not part of the group", async () => {});
  });

  describe("deleteGroup", () => {
    const sendRequest = async (body, refreshToken = breAdmin.refreshToken) => {
      return await request(app)
        .delete("/api/groups/")
        .set("Content-Type", "application/json")
        .set("Cookie", [
          `refreshToken=${refreshToken}`,
          `accessToken=${refreshToken}`,
        ])
        .send(body);
    };

    const bre = newDbUser("bre");
    const fra = newDbUser("fra");
    const breAdmin = newDbUser("breAdmin", "Admin");

    const usersToRemove = [bre.email, fra.email];

    const groupStub = () => ({
      name: "test",
      members: usersToRemove.map((u) => ({ email: u })),
    });

    beforeAll(async () => {
      await User.deleteMany();
      await User.create([bre, fra, breAdmin]);
    });

    beforeEach(async () => {
      await Group.deleteMany();
    });

    test("group should be removed", async () => {
      await Group.create({ name: "test" });

      const res = await sendRequest({ name: "test" });

      expect(res.status).toBe(200);
    });

    test("should return error if group does not exist", async () => {
      const res = await sendRequest({ name: "test" });

      expect(res.status).toBe(400);
    });

    test("should return error if requesting user if not Admin", async () => {
      await Group.create({ name: "test" });

      const res = await sendRequest({ name: "test" }, bre.refreshToken);

      expect(res.status).toBe(401);
    });
  });
});
