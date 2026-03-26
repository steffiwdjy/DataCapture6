const { DatabaseManager, DataTypes } = require("../../config/DatabaseManager");
const jarrdinDB = DatabaseManager.getDatabase(process.env.DB_NAME);
const { DataFiturModel } = require("./DataFiturModel");
const { PenggunaModel } = require("./PenggunaModel");

const TujuanPenggunaModel = jarrdinDB.define(
  "tujuan_pengguna",
  {
    datafitur_id: {
      type: DataTypes.INTEGER(11),
      primaryKey: true,
      allowNull: false,
    },
    pengguna_id: {
      type: DataTypes.INTEGER(11),
      primaryKey: true,
      allowNull: false,
    },
    is_dibaca: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false, // By default, the message is unread
    },
  },
  {
    tableName: "tujuan_pengguna",
    timestamps: false,
  }
);

function associationUserTujuan() {
  // Association between UserTujuan and DataFitur
  TujuanPenggunaModel.belongsTo(DataFiturModel, {
    foreignKey: "datafitur_id",
    targetKey: "datafitur_id",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  DataFiturModel.hasMany(TujuanPenggunaModel, {
    foreignKey: "datafitur_id",
    sourceKey: "datafitur_id",
  });
}

// Association between UserTujuan and User
TujuanPenggunaModel.belongsTo(PenggunaModel, {
  foreignKey: "pengguna_id",
  targetKey: "pengguna_id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

PenggunaModel.hasMany(TujuanPenggunaModel, {
  foreignKey: "pengguna_id",
  sourceKey: "pengguna_id",
});

associationUserTujuan();

module.exports = { TujuanPenggunaModel };
