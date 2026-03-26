const {
    FiturModel,
    PenggunaModel,
    PenggunaRoleModel,
    HakAksesModel,
    RoleModel,
} = require("../models");

// const { DatabaseManager, Sequelize, Op } = require("../../config/DatabaseManager");

class FiturRepository {
    static async readAll() {
        try {
            const findFitur = await FiturModel.findAll();

            return findFitur;
        } catch (error) {
            throw error;
        }
    }

    static async readOne(fitur_id) {
        try {
            const findFitur = await FiturModel.findOne({
                where: { fitur_id: fitur_id },
            });

            if (!findFitur) {
                const newError = new Error("fitur tidak ditemukan.");
                newError.status = 404;
                throw newError;
            }

            return findFitur.dataValues;
        } catch (error) {
            throw error;
        }
    }

    static async readFiturByUserID(pengguna_id) {
        try {
            // Temukan fitur berdasarkan pengguna_id
            const userWithFitur = await PenggunaModel.findOne({
                where: { pengguna_id: pengguna_id },
                include: [
                    {
                        model: PenggunaRoleModel,
                        // required: true, untuk inner join ()
                        include: [
                            {
                                model: RoleModel,
                                include: [
                                    {
                                        model: HakAksesModel,
                                        include: [
                                            {
                                                model: FiturModel,
                                                attributes: ["nama"], // Ambil nama fitur
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });

            // Log untuk memeriksa data yang diterima
            // console.log("userWithFitur:", JSON.stringify(userWithFitur, null, 2));

            if (!userWithFitur || !userWithFitur.pengguna_roles) {
                return []; // Mengembalikan array kosong jika tidak ada relasi
            }

            // Mapping fitur yang ditemukan, validasi tiap tingkatan relasi
            const fiturList = userWithFitur.pengguna_roles.flatMap((userRole) => {
                if (!userRole.Role || !userRole.Role.hak_akses) {
                    return [];
                }
                return userRole.Role.hak_akses.flatMap((hakAkses) => {
                    if (hakAkses.Fitur && hakAkses.Fitur.nama) {
                        return hakAkses.Fitur.nama; // Mengembalikan nama fitur
                    }
                    return []; // Mengembalikan array kosong jika Fitur tidak ada
                });
            });

            // Log untuk memeriksa fiturList sebelum mengembalikannya
            // console.log("fiturList:", fiturList);

            // Menghilangkan duplikat dari fiturList
            const uniqueFiturList = [...new Set(fiturList)];

            return uniqueFiturList;
        } catch (error) {
            console.error("Error fetching fitur by user ID: ", error);
            throw error;
        }
    }
}

module.exports = { FiturRepository };
