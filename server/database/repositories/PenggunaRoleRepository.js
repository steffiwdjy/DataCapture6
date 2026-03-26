const { PenggunaModel, PenggunaRoleModel, RoleModel } = require("../models");

class PenggunaRoleRepository {
    static async readRoleByUserID(pengguna_id) {
        try {
            const findRole = await PenggunaModel.findOne({
                where: { pengguna_id: pengguna_id },
                attributes: ["nama", "no_telp"],
                include: [
                    {
                        model: PenggunaRoleModel,
                        required: true,
                        include: [
                            {
                                model: RoleModel,
                                required: true,
                                attributes: ["nama"],
                            },
                        ],
                    },
                ],
            });

            if (!findRole || !findRole.pengguna_roles) {
                return []; // Mengembalikan array kosong jika tidak ada relasi
            }

            const transformedData = findRole.pengguna_roles.map((role) => ({
                Nama: role.Role.nama,
                Deskripsi: role.Role.deskripsi,
            }));

            return transformedData;
        } catch (error) {
            console.error("Error fetching role by user ID: ", error);
            throw error;
        }
    }

    static async readAllPengurusID() {
        try {
            const findUserID = await PenggunaRoleModel.findAll({
                where: { role_id: 1 }, //role_id 1 merupakan id pengurus
                attributes: ["pengguna_id"], // mengambil kolom pengguna_id saja
                raw: true,
            });

            return findUserID;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = { PenggunaRoleRepository };
