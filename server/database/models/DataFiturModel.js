const { DatabaseManager, DataTypes } = require("../../config/DatabaseManager");
const jarrdinDB = DatabaseManager.getDatabase(process.env.DB_NAME);
const { FiturModel } = require("./FiturModel");
const { PenggunaModel } = require("./PenggunaModel");

const DataFiturModel = jarrdinDB.define(
    "DataFitur",
    {
        datafitur_id: {
            type: DataTypes.INTEGER(11),
            primaryKey: true,
            allowNull: false,
            autoIncrement: true,
        },
        fitur_id: {
            type: DataTypes.INTEGER(11),
            allowNull: false,
        },
        judul: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        tgl_dibuat: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        pengguna_id_dibuat: {
            type: DataTypes.INTEGER(11),
            allowNull: false,
        },
        file_folder: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
    },
    {
        tableName: "DataFitur",
        timestamps: false,
    }
);

function associationDataFitur() {
    // Association antara DataFitur dan Fitur
    DataFiturModel.belongsTo(FiturModel, {
        foreignKey: "fitur_id",
        targetKey: "fitur_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    FiturModel.hasMany(DataFiturModel, {
        foreignKey: "fitur_id",
        sourceKey: "fitur_id",
    });

    // Association antara DataFitur dan User
    DataFiturModel.belongsTo(PenggunaModel, {
        foreignKey: "pengguna_id_dibuat",
        targetKey: "pengguna_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    PenggunaModel.hasMany(DataFiturModel, {
        foreignKey: "pengguna_id_dibuat",
        sourceKey: "pengguna_id",
    });
}

associationDataFitur();

module.exports = { DataFiturModel };
