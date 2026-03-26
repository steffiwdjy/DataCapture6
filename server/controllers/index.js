const { DataFiturController } = require("./DataFiturController");
const { FiturController } = require("./FiturController");
const { PesanController } = require("./PesanController");
const { NotifikasiController } = require("./NotifikasiController");
const { RoleController } = require("./RoleController");
const { PenggunaController } = require("./PenggunaController");
const { PenggunaRoleController } = require("./PenggunaRoleController");

module.exports = {
  FiturController,
  DataFiturController,
  PenggunaRoleController,
  PenggunaController,
  RoleController,
  PesanController,
  NotifikasiController,
};
