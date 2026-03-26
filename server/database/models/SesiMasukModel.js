const { DatabaseManager, DataTypes } = require("../../config/DatabaseManager");
const { PenggunaModel } = require("./PenggunaModel");
const jarrdinDB = DatabaseManager.getDatabase(process.env.DB_NAME);

const SesiMasukModel = jarrdinDB.define(
  "SesiMasuk",
  {
    sesi_id: {
      type: DataTypes.INTEGER(11),
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    pengguna_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    no_telp: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    otp: {
      type: DataTypes.STRING(6),
      allowNull: false,
    },
    wkt_masuk: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    token: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "SesiMasuk",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["otp", "no_telp", "email"],
        name: "Kombinasi unik otp_noTelp_email",
      },
    ],
  }
);

function associationLoginSession() {
  SesiMasukModel.belongsTo(PenggunaModel, {
    foreignKey: "pengguna_id",
    targetKey: "pengguna_id",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  PenggunaModel.hasMany(SesiMasukModel, {
    foreignKey: "pengguna_id",
    sourceKey: "pengguna_id",
  });
}

associationLoginSession();

module.exports = { SesiMasukModel };
