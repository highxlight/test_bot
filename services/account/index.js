const datap = require("../../datap.js");
const { ObjectId } = require("mongodb");
const { guid } = require("../../utils.js");
const _ = require("lodash");

const createSession = async ({ data: user }) => {
  await datap.mongo.deletequery("session", {
    "user._id": ObjectId(user._id),
  });

  const sessionObj = {
    user: {
      _id: user._id,
      username: user.username,
      role: user.role,
    },
    token: guid(),
  };

  await datap.mongo.create("session", sessionObj);

  const token = sessionObj.token;
  return {
    ..._.omit(user, ["password"]),
    id: user._id,
    token: token,
    access_token:token,
    code: 200,
  };
};

const checkSession = async ({ token, data = {} }) => {
  const foundSession = await datap.mongo.readone({ token }, "session");
  if (!foundSession) {
    const err = new Error("Invalid session");
    err.code = 401;
    throw err;
  }

  if (data.roles && !data.roles?.includes(foundSession.user.role)) {
    throw new Error("You are not authorized to perform this action");
  }
  return foundSession;
};

const login = async ({ data }) => {
  const foundUser = await datap.mongo.readone(
    {
      username: data.username,
      password: data.password,
    },
    "user"
  );

  if (!foundUser) {
    throw new Error("Invalid username or password");
  }

  return createSession({ data: { ...foundUser } });
};

const getProfile = async ({ token }) => {
  const session = await checkSession({ token });

  const user = await datap.mongo.readid(session.user._id.toString(), "user");
  return _.omit(user, ["password"]);
};

const logout = async ({ token }) => {
  await checkSession({ token });
  await datap.mongo.deletequery("session", {
    token,
  });
};

const createUser = async ({ token, data }) => {
  if (!(data.username?.length > 0 && data.password?.length > 0)) {
    throw new Error("Invalid username or password");
  }
  if (!["admin", "sub-account"].includes(data.role)) {
    throw new Error("Invalid user role");
  }

  const foundSession = await checkSession({ token });

  if (foundSession.user?.role !== "admin") {
    throw new Error("You are not authorized to create users");
  }

  if (data.role === "admin" && data.walletAddress == null) {
    throw new Error("You must provide a wallet address");
  }

  const foundUser = await datap.mongo.readone(
    {
      username: data.username,
    },
    "user"
  );

  if (foundUser) {
    throw new Error("Username already exists");
  }

  const result = await datap.mongo.create("user", {
    username: data.username,
    role: data.role,
    password: data.password,
    walletAddress: data.walletAddress,
  });

  return {
    userId: result.insertedId,
  };
};

const list = async ({ token, data }) => {
  await checkSession({
    token,
    data: { roles: ["admin", "superadmin"] },
  });

  const userData = await datap.mongo.read("user", {
    ...data,
  });

  return userData.map((user) => ({
    id: user._id,
    ..._.omit(user, ["password"]),
  }));
};

const deleteUser = async ({ token, data }) => {
  const foundSession = await checkSession({
    token,
    data: { roles: ["admin", "superadmin"] },
  });

  if (foundSession.user._id?.toString() === data.id) {
    throw new Error("You cannot delete yourself");
  }

  const duser = await datap.mongo.readid(data.id, "user");

  if (duser.role === "superadmin") {
    throw new Error("You cannot delete a superadmin");
  }

  await datap.mongo.delete(data.id, "user");

  await datap.mongo.deletequery("session", {
    "user._id": ObjectId(data.id),
  });
};

const updateUser = async ({ token, data }) => {
  const foundSession = await checkSession({ token });
  if (
    !["admin", "superadmin"].includes(foundSession.user.role) &&
    foundSession.user._id?.toString() !== data.id
  ) {
    throw new Error("You are not authorized to update users");
  }

  if (foundSession.user.role === "admin") {
    const duser = await datap.mongo.readid(data.id, "user");
    if (duser.role === "superadmin") {
      throw new Error("You cannot update a superadmin");
    }
  }

  await datap.mongo.update(
    "user",
    _.pick(data, [
      "id",
      "password",
      "email",
      "phoneNumber",
      "role",
      "walletAddress",
    ])
  );
};

module.exports = {
  checkSession,
  createUser,
  list,
  login,
  logout,
  deleteUser,
  updateUser,
  getProfile,
};
