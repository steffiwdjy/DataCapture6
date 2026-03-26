const { DatabaseManager, DataTypes } = require("../../config/DatabaseManager");
const { PenggunaModel } = require("./PenggunaModel");
const jarrdinDB = DatabaseManager.getDatabase(process.env.DB_NAME);
const { RoleModel } = require("./RoleModel");

const PenggunaRoleModel = jarrdinDB.define(
  "pengguna_role",
  {
    pengguna_id: {
      type: DataTypes.INTEGER(11),
      primaryKey: true,
      allowNull: false,
    },
    role_id: {
      type: DataTypes.INTEGER(11),
      primaryKey: true,
      allowNull: false,
    },
  },
  {
    tableName: "pengguna_role",
    timestamps: false,
  }
);

function associationUserRole() {
  // Association between UserRole and User
  PenggunaRoleModel.belongsTo(PenggunaModel, {
    foreignKey: "pengguna_id",
    targetKey: "pengguna_id",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  PenggunaModel.hasMany(PenggunaRoleModel, {
    foreignKey: "pengguna_id",
    sourceKey: "pengguna_id",
  });

  // Association between UserRole and Role
  PenggunaRoleModel.belongsTo(RoleModel, {
    foreignKey: "role_id",
    targetKey: "role_id",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  RoleModel.hasMany(PenggunaRoleModel, {
    foreignKey: "role_id",
    sourceKey: "role_id",
  });
}

associationUserRole();

module.exports = { PenggunaRoleModel };
