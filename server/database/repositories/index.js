const { DataFiturRepository } = require("./DataFiturRepository");
const { FiturRepository } = require("./FiturRepository");
const { SesiMasukRepository } = require("./SesiMasukRepository");
const { PesanRepository } = require("./PesanRepository");
const { RoleRepository } = require("./RoleRepository");
const { PenggunaRepository } = require("./PenggunaRepository");
const { PenggunaRoleRepository } = require("./PenggunaRoleRepository");
const { LogAktivitasRepository } = require("./LogAktivitasRepository");

module.exports = {
    FiturRepository,
    DataFiturRepository,
    PenggunaRoleRepository,
    PenggunaRepository,
    RoleRepository,
    PesanRepository,
    SesiMasukRepository,
    LogAktivitasRepository,
};
