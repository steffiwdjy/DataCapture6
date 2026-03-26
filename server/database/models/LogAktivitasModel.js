const { DatabaseManager, DataTypes } = require("../../config/DatabaseManager");
const { PenggunaModel } = require("./PenggunaModel");
const { FiturModel } = require("./FiturModel"); // pastikan model Fitur sudah dibuat dan diekspor
const jarrdinDB = DatabaseManager.getDatabase(process.env.DB_NAME);

const LogAktivitasModel = jarrdinDB.define(
    "LogAktivitas",
    {
        log_id: {
            type: DataTypes.INTEGER(11),
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        pengguna_id: {
            type: DataTypes.INTEGER(11),
            allowNull: false,
        },
        fitur_id: {
            type: DataTypes.INTEGER(11),
            allowNull: true,
        },
        aksi: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        keterangan: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        waktu: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        ip_address: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        user_agent: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        tableName: "LogAktivitas",
        timestamps: false,
    }
);

function associationLogAktivitas() {
    LogAktivitasModel.belongsTo(PenggunaModel, {
        foreignKey: "pengguna_id",
        targetKey: "pengguna_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    PenggunaModel.hasMany(LogAktivitasModel, {
        foreignKey: "pengguna_id",
        sourceKey: "pengguna_id",
    });

    LogAktivitasModel.belongsTo(FiturModel, {
        foreignKey: "fitur_id",
        targetKey: "fitur_id",
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
    });

    FiturModel.hasMany(LogAktivitasModel, {
        foreignKey: "fitur_id",
        sourceKey: "fitur_id",
    });
}

associationLogAktivitas();

module.exports = { LogAktivitasModel };
