const { DataFiturSchema } = require("./DataFiturSchema");
const { MessageSchema } = require("./MessageSchema");
const { UserSchema } = require("./UserSchema");

const Validator = {
  Description: "Input Validator",
};

Object.assign(Validator, DataFiturSchema, UserSchema, MessageSchema);

module.exports = { Validator };
