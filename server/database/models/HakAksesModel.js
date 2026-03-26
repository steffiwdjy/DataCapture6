const { DatabaseManager, DataTypes } = require("../../config/DatabaseManager");
const jarrdinDB = DatabaseManager.getDatabase(process.env.DB_NAME);
const { FiturModel } = require("./FiturModel");
const { RoleModel } = require("./RoleModel");

const HakAksesModel = jarrdinDB.define(
  "hak_akses",
  {
    fitur_id: {
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
    tableName: "hak_akses",
    timestamps: false,
  }
);

function associationHakAkses() {
  // Association antara HakAkses dan Fitur
  HakAksesModel.belongsTo(FiturModel, {
    foreignKey: "fitur_id",
    targetKey: "fitur_id",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  FiturModel.hasMany(HakAksesModel, {
    foreignKey: "fitur_id",
    sourceKey: "fitur_id",
  });

  // Association antara HakAkses dan Role
  HakAksesModel.belongsTo(RoleModel, {
    foreignKey: "role_id",
    targetKey: "role_id",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  RoleModel.hasMany(HakAksesModel, {
    foreignKey: "role_id",
    sourceKey: "role_id",
  });
}

associationHakAkses();

module.exports = { HakAksesModel };
