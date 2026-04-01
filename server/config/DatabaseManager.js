const { Sequelize, DataTypes, Op, QueryTypes } = require("sequelize");

class DatabaseManager {
    static DATABASES = {};

    constructor(dbName, username, password, hostname, port, dialect) {
        this.db = new Sequelize(dbName, username, password, {
            host: hostname,
            dialect: dialect,
            port: port,
            logging: false,
            pool: {
                max: 10,
                min: 0,
                acquire: 30000,
                idle: 10000
            },
            dialectOptions: {
                connectTimeout: 60000
            }
        });
        DatabaseManager.DATABASES[dbName] = this.db;
    }

    static getDatabase(dbName) {
        return DatabaseManager.DATABASES[dbName];
    }

    static getDatabaseDetail(dbName) {
        const db = DatabaseManager.DATABASES[dbName];

        if (db) {
            return db.config;
        } else {
            console.error(`>> ${dbName} database is not configured.`);
            return null;
        }
    }

    static async authenticate(dbName) {
        const db = DatabaseManager.DATABASES[dbName];

        if (!db) {
            console.error(`>> ${dbName} database is not configured.`);
            return;
        }

        try {
            await db.authenticate();
            console.log(`>> ${dbName} database connected successfully.`);
        } catch (error) {
            console.error(`>> Error connecting to ${dbName} database:`, error);
        }
    }

    static async synchronize(dbName, isForce) {
        const db = DatabaseManager.DATABASES[dbName];

        if (!db) {
            console.error(`>> ${dbName} database is not configured.`);
            return;
        }

        if (!isForce || isForce !== true) {
            isForce = false;
        }

        try {
            if (isForce === true) {
                await db.query("SET FOREIGN_KEY_CHECKS = 0");
            }

            await db.sync({
                force: isForce,
            });

            console.log(`>> ${dbName} database synchronized successfully.`);

            if (isForce === true) {
                await db.query("SET FOREIGN_KEY_CHECKS = 1");
            }
        } catch (error) {
            console.error(`>> Error synchronizing ${dbName} database:`, error);
        }
    }

    static async closeConnection(dbName) {
        const db = DatabaseManager.DATABASES[dbName];

        if (!db) {
            console.error(`>> ${dbName} database is not configured.`);
            return;
        }

        try {
            await db.close();
            console.log(`>> Connection to ${dbName} database closed.`);
        } catch (error) {
            console.error(`Error closing connection to ${dbName} database:`, error);
        }
    }

    static async seedData(dbName) {
        const db = DatabaseManager.DATABASES[dbName];

        if (!db) {
            console.error(`>> ${dbName} database is not configured.`);
            return;
        }

        try {
            console.log(`>> Starting data seeding for ${dbName}...`);

            // Seed default roles
            const { RoleModel, FiturModel, HakAksesModel } = require("../database/models");

            const defaultRoles = [
                { role_id: 1, nama: "Pengurus" },
                { role_id: 2, nama: "Pengelola" },
                { role_id: 3, nama: "Pemilik Unit" },
                { role_id: 4, nama: "Pelaku Komersil" },
                { role_id: 5, nama: "Admin" },
            ];

            const defaultFitur = [
                { fitur_id: 1, nama: "Pengumuman" },
                { fitur_id: 2, nama: "Pengumuman Pengelola" },
                { fitur_id: 3, nama: "Laporan" },
                { fitur_id: 4, nama: "Tagihan Bulanan" },
                { fitur_id: 5, nama: "Buletin Kegiatan" },
                { fitur_id: 6, nama: "Informasi Paket" },
                { fitur_id: 7, nama: "Masukan & Aspirasi" },
                { fitur_id: 8, nama: "Daftar Pengguna" },
            ];

            const defaultHakAkses = [
                { role_id: 1, fitur_id: 1 },
                { role_id: 1, fitur_id: 3 },
                { role_id: 1, fitur_id: 7 },
                { role_id: 2, fitur_id: 2 },
                { role_id: 2, fitur_id: 4 },
                { role_id: 2, fitur_id: 5 },
                { role_id: 2, fitur_id: 6 },
                { role_id: 3, fitur_id: 1 },
                { role_id: 3, fitur_id: 2 },
                { role_id: 3, fitur_id: 3 },
                { role_id: 3, fitur_id: 4 },
                { role_id: 3, fitur_id: 5 },
                { role_id: 3, fitur_id: 6 },
                { role_id: 3, fitur_id: 7 },
                { role_id: 4, fitur_id: 1 },
                { role_id: 4, fitur_id: 2 },
                { role_id: 4, fitur_id: 4 },
                { role_id: 4, fitur_id: 5 },
                { role_id: 5, fitur_id: 8 },
            ];

            // Insert default roles, features, and permissions
            await RoleModel.bulkCreate(defaultRoles, { ignoreDuplicates: true });
            await FiturModel.bulkCreate(defaultFitur, { ignoreDuplicates: true });
            await HakAksesModel.bulkCreate(defaultHakAkses, { ignoreDuplicates: true });

            console.log(">> Default Role, Fitur, and Hak Akses seeded successfully.");

            // Add the admin user
            const { PenggunaModel } = require("../database/models/PenggunaModel");

            const adminExists = await PenggunaModel.findOne({ where: { kode_user: "ADMIN" } });

            if (!adminExists) {
                const userAdmin = await PenggunaModel.create({
                    kode_user: "ADMIN",
                    nama: "Administrator",
                    no_unit: "000",
                    alamat: "Office",
                    no_telp: null,
                    email: "rafibintang26.rb@gmail.com",
                });

                // Add admin role to the PenggunaRole table
                const { PenggunaRoleModel } = require("../database/models/PenggunaRoleModel");
                await PenggunaRoleModel.create({
                    pengguna_id: userAdmin.pengguna_id,
                    role_id: 5,
                });
                console.log(">> Admin user created successfully.");
            } else {
                console.log(">> Admin user already exists.");
            }

            console.log(`>> Seeding data for ${dbName} completed successfully.`);
        } catch (error) {
            console.error(`>> Error during data seeding for ${dbName}:`, error);
        }
    }
}

module.exports = {
    DatabaseManager,
    Sequelize,
    DataTypes,
    Op,
    QueryTypes,
};
