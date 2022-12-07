const { checkSession } = require(".");
const datap = require("../../datap");
const { ObjectId } = require("mongodb");

const create = async ({ token, data, makePrivate }) => {
  makePrivate?.();
  await checkSession({ token });

  const { type, receiverId, message, senderId, data: noticeData } = data;

  const { insertedId: id } = await datap.mongo.create("notification", {
    type,
    message,
    receiverId,
    senderId,
    status: 0,
    data: noticeData,
  });

  return {
    id,
  };
};

const setRead = async ({ token, data }) => {
  const session = await checkSession({ token });

  const result = await datap.mongo.readone(
    {
      _id: ObjectId(data.id),
      receiverId: session.user._id,
    },
    "notification"
  );

  if (!result) {
    throw new Error("Notification not found");
  }

  await datap.mongo.update("notification", {
    id: data.id,
    status: 1,
  });
};

const list = async ({ token, data }) => {
  const session = await checkSession({ token });

  return datap.mongo.read(
    "notification",
    {
      receiverId: session.user._id,
      status: data.status,
    },
    data.limit,
    data.skip,
    { _id: -1 }
  );
};

module.exports = {
  create,
  setRead,
  list,
};
