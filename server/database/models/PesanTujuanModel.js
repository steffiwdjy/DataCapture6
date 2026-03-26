const { DatabaseManager, DataTypes } = require("../../config/DatabaseManager");
const { PenggunaModel } = require("./PenggunaModel");
const { PesanModel } = require("./PesanModel");
const jarrdinDB = DatabaseManager.getDatabase(process.env.DB_NAME);

const PesanTujuanModel = jarrdinDB.define(
    "pesan_tujuan",
    {
        pesan_id: {
            type: DataTypes.INTEGER(11),
            primaryKey: true,
            allowNull: false,
        },
        penerima_id: {
            type: DataTypes.INTEGER(11),
            primaryKey: true,
            allowNull: false,
        },
        is_dibaca: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false, // By default, the message is unread
        },
        tgl_dibaca: {
            type: DataTypes.DATE,
            allowNull: true, // Null means the message hasn't been read
        },
    },
    {
        tableName: "pesan_tujuan",
        timestamps: false,
    }
);

function associationMessageTujuan() {
    // Association between MessageTujuan and Message
    PesanTujuanModel.belongsTo(PesanModel, {
        foreignKey: "pesan_id",
        targetKey: "pesan_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    PesanModel.hasMany(PesanTujuanModel, {
        foreignKey: "pesan_id",
        sourceKey: "pesan_id",
    });
}

// Association between MessageTujuan and User
PesanTujuanModel.belongsTo(PenggunaModel, {
    foreignKey: "penerima_id",
    targetKey: "pengguna_id",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
});

PenggunaModel.hasMany(PesanTujuanModel, {
    foreignKey: "penerima_id",
    sourceKey: "pengguna_id",
});

associationMessageTujuan();

module.exports = { PesanTujuanModel };
