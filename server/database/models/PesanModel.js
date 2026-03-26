const { DatabaseManager, DataTypes } = require("../../config/DatabaseManager");
const jarrdinDB = DatabaseManager.getDatabase(process.env.DB_NAME);
const { FiturModel } = require("./FiturModel");
const { PenggunaModel } = require("./PenggunaModel");

const PesanModel = jarrdinDB.define(
    "Pesan",
    {
        pesan_id: {
            type: DataTypes.INTEGER(11),
            primaryKey: true,
            allowNull: false,
            autoIncrement: true,
        },
        fitur_id: {
            type: DataTypes.INTEGER(11),
            allowNull: false,
        },
        pengirim_id: {
            type: DataTypes.INTEGER(11),
            allowNull: false,
        },
        judul: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        pesan_text: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        pesan_file: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        tgl_dibuat: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        tableName: "Pesan",
        timestamps: false,
    }
);

function associationMessage() {
    // Association antara Message dan Fitur
    PesanModel.belongsTo(FiturModel, {
        foreignKey: "fitur_id",
        targetKey: "fitur_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    FiturModel.hasMany(PesanModel, {
        foreignKey: "fitur_id",
        sourceKey: "fitur_id",
    });

    // Association antara Message dan User
    PesanModel.belongsTo(PenggunaModel, {
        foreignKey: "pengirim_id",
        targetKey: "pengguna_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    PenggunaModel.hasMany(PesanModel, {
        foreignKey: "pengirim_id",
        sourceKey: "pengguna_id",
    });
}

associationMessage();

module.exports = { PesanModel };
