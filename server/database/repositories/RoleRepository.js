const { RoleModel } = require("../models");

class RoleRepository {
    static async readAll() {
        try {
            const findRole = await RoleModel.findAll();
            // console.log(findRole);

            const transformedData = findRole.map((role) => ({
                RoleID: role.role_id,
                Nama: role.nama,
            }));

            return transformedData;
        } catch (error) {
            throw error;
        }
    }

    static async readOne(role_id) {
        try {
            const findRole = await RoleModel.findOne({
                where: { role_id: role_id },
            });

            if (!findRole) {
                const newError = new Error("Role tidak ditemukan.");
                newError.status = 404;
                throw newError;
            }

            return findRole;
        } catch (error) {
            throw error;
        }
    }

    static async seedRoles() {
        const roles = [
            { nama: "Pengurus", deskripsi: "" },
            { nama: "Pengelola", deskripsi: "" },
            { nama: "Pemilik Unit", deskripsi: "" },
            { nama: "Pelaku Komersil", deskripsi: "" },
            { nama: "Admin", deskripsi: "Mengelola seluruh sistem" },
        ];
        try {
            for (const role of roles) {
                await RoleModel.findOrCreate({
                    where: { nama: role.nama },
                    defaults: role,
                });
            }
            console.log(">> Roles seeded successfully.");
        } catch (error) {
            console.error(">> Error seeding roles:", error);
            throw error;
        }
    }
}

module.exports = { RoleRepository };
