const { DatabaseManager, DataTypes } = require("../../config/DatabaseManager");
const jarrdinDB = DatabaseManager.getDatabase(process.env.DB_NAME);

const RoleModel = jarrdinDB.define(
  "Role",
  {
    role_id: {
      type: DataTypes.INTEGER(11),
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    nama: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    deskripsi: {
      type: DataTypes.TEXT(),
      allowNull: true,
    },
  },
  {
    tableName: "Role",
    timestamps: false,
  }
);

module.exports = { RoleModel };
