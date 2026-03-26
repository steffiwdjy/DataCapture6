const { DatabaseManager, DataTypes } = require("../../config/DatabaseManager");
const jarrdinDB = DatabaseManager.getDatabase(process.env.DB_NAME);

const FiturModel = jarrdinDB.define(
  "Fitur",
  {
    fitur_id: {
      type: DataTypes.INTEGER(11),
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    nama: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  },
  {
    tableName: "Fitur",
    timestamps: false,
  }
);

module.exports = { FiturModel };
