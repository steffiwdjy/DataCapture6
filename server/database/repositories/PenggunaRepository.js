const { PenggunaModel, RoleModel, PenggunaRoleModel } = require("../models");
const { DatabaseManager } = require("../../config/DatabaseManager");
const jarrdinDB = DatabaseManager.getDatabase(process.env.DB_NAME);

class PenggunaRepository {
    static async readAll(excludeUserID = null) {
        try {
            const whereCondition = {
                status: [0, 1], // Hanya ambil pengguna dengan status 0 atau 1
            };

            // excludeUserID merupakan id pengguna yg get
            if (excludeUserID) {
                whereCondition.pengguna_id = {
                    [jarrdinDB.Sequelize.Op.ne]: excludeUserID,
                };
            }

            const findUser = await PenggunaModel.findAll({
                where: whereCondition,
                include: {
                    model: PenggunaRoleModel,
                    required: true,
                    include: { model: RoleModel, required: true },
                },
            });

            const transformedData = findUser.map((user) => ({
                UserID: user.pengguna_id,
                Nama: user.nama,
                Email: user.email,
                NoTelp: user.no_telp,
                Role: user.pengguna_roles.map((role) => ({
                    Nama: role.Role.nama,
                    RoleID: role.Role.role_id,
                })),
                Status:
                    user.status === 0
                        ? "RevokeAgreement"
                        : user.status === 1
                        ? "Active"
                        : user.status === 2
                        ? "Unactive"
                        : "Udentified",
            }));

            return transformedData;
        } catch (error) {
            throw error;
        }
    }

    static async readAllUserByRole(role_id) {
        try {
            const users = await PenggunaModel.findAll({
                where: {
                    status: [0, 1], // Hanya ambil pengguna dengan status 0 atau 1
                },
                include: [
                    {
                        model: PenggunaRoleModel,
                        required: true,
                        where: { role_id: role_id }, // Filter by role_id
                        include: [
                            {
                                model: RoleModel,
                                required: true,
                            },
                        ],
                    },
                ],
            });

            // Transform the data into a simplified format
            const transformedData = users.map((user) => ({
                UserID: user.pengguna_id,
                Nama: user.nama,
                Email: user.email,
                NoTelp: user.no_telp,
                Role: user.pengguna_roles.map((penggunaRole) => ({
                    Nama: penggunaRole.Role.nama,
                    RoleID: penggunaRole.Role.role_id,
                })),
            }));

            return transformedData;
        } catch (error) {
            throw error;
        }
    }

    static async readOne(pengguna_id) {
        try {
            const findUser = await PenggunaModel.findOne({
                include: {
                    model: PenggunaRoleModel,
                    required: true,
                    include: { model: RoleModel, required: true },
                },
                where: { pengguna_id: pengguna_id },
            });

            if (!findUser) {
                const newError = new Error("User tidak ditemukan.");
                newError.status = 404;
                throw newError;
            }

            const transformedData = {
                UserID: findUser.pengguna_id,
                Nama: findUser.nama,
                Email: findUser.email,
                NoTelp: findUser.no_telp,
                Alamat: findUser.alamat,
                NoUnit: findUser.no_unit,
                Role: findUser.pengguna_roles.map((role) => ({
                    Nama: role.Role.nama,
                    RoleID: role.Role.role_id,
                })),
                IsKetentuan: findUser.is_ketentuan,
                AlasanBatal: findUser.alasan_batal_ketentuan,
                Status:
                    findUser.status === 0
                        ? "RevokeAgreement"
                        : findUser.status === 1
                        ? "Active"
                        : findUser.status === 2
                        ? "Unactive"
                        : "Udentified",
            };

            return transformedData;
        } catch (error) {
            throw error;
        }
    }

    static async readExisting(identifier) {
        try {
            const rawIdentifier = String(identifier || "").trim();
            if (!rawIdentifier) {
                const newError = new Error("Email atau No telepon tidak terdaftar");
                newError.status = 404;
                throw newError;
            }

            const isEmail = rawIdentifier.includes("@");
            const emailIdentifier = rawIdentifier.toLowerCase();
            const phoneDigits = rawIdentifier.replace(/\D/g, "");

            let phoneVariants = [phoneDigits];
            if (phoneDigits.startsWith("0")) {
                phoneVariants.push(`62${phoneDigits.slice(1)}`);
            }
            if (phoneDigits.startsWith("62")) {
                phoneVariants.push(`0${phoneDigits.slice(2)}`);
            }
            phoneVariants = [...new Set(phoneVariants.filter(Boolean))];

            const findUser = await PenggunaModel.findOne({
                where: isEmail
                    ? jarrdinDB.Sequelize.where(
                          jarrdinDB.Sequelize.fn("LOWER", jarrdinDB.Sequelize.col("email")),
                          emailIdentifier
                      )
                    : { no_telp: { [jarrdinDB.Sequelize.Op.in]: phoneVariants } },
                raw: false,
            });

            if (!findUser || findUser.status === 2) {
                const newError = new Error("Email atau No telepon tidak terdaftar");
                newError.status = 404;
                throw newError;
            }

            const findUserRoles = await PenggunaRoleModel.findAll({
                where: {
                    pengguna_id: findUser.pengguna_id,
                },
                include: [
                    {
                        model: RoleModel,
                        required: true,
                    },
                ],
                raw: false,
            });

            if (!findUserRoles || findUserRoles.length === 0) {
                const newError = new Error("Email atau No telepon tidak terdaftar");
                newError.status = 404;
                throw newError;
            }

            // if (!findUser || findUser.status === 0) {
            //     const newError = new Error(
            //         "Akses Ditolak.\n\n" +
            //             "Anda telah membatalkan persetujuan atas Syarat & Ketentuan kami sebelumnya.\n" +
            //             "Untuk menggunakan sistem ini kembali, silakan hubungi Pengelola Rusunami The Jarrdin Cihampelas."
            //     );
            //     newError.status = 404;
            //     throw newError;
            // }

            // console.log(findUser);
            // Transform the data
            const formattedData = {
                UserID: findUser.pengguna_id,
                NoTelp: findUser.no_telp,
                Nama: findUser.nama,
                Email: findUser.email,
                Role: findUserRoles.map((penggunaRole) => ({
                    Nama: penggunaRole.Role.nama,
                    Deskripsi: penggunaRole.Role.deskripsi,
                })),
                IsKetentuan: findUser.is_ketentuan,
                Status:
                    findUser.status === 0
                        ? "RevokeAgreement"
                        : findUser.status === 1
                        ? "Active"
                        : findUser.status === 2
                        ? "Unactive"
                        : "Udentified",
            };

            return formattedData;
        } catch (error) {
            throw error;
        }
    }

    static async insert(dataInsert) {
        const transaction = await jarrdinDB.transaction();
        try {
            let existingUser;
            //cek apakah no telepon sudah ada pada database
            if (dataInsert.NoTelp) {
                existingUser = await PenggunaModel.findOne({
                    where: {
                        no_telp: dataInsert.NoTelp,
                    },
                });
            }
            //cek apakah email sudah ada pada database
            if (dataInsert.Email) {
                existingUser = await PenggunaModel.findOne({
                    where: {
                        Email: dataInsert.Email,
                    },
                });
            }

            if (!dataInsert.NoTelp) {
                dataInsert.NoTelp = null;
            }
            if (!dataInsert.Email) {
                dataInsert.Email = null;
            }

            if (existingUser) {
                const error = new Error("Pengguna dengan email atau no telepon sudah terdaftar.");
                error.status = 400;
                throw error;
            }

            // Buat data pengguna baru
            const newUser = await PenggunaModel.create(
                {
                    kode_user: dataInsert.Nama + dataInsert.NoUnit,
                    nama: dataInsert.Nama,
                    email: dataInsert.Email,
                    no_telp: dataInsert.NoTelp,
                    alamat: dataInsert.Alamat || null,
                    no_unit: dataInsert.NoUnit || null,
                },
                { transaction }
            );

            // Tambahkan role jika ada
            if (Array.isArray(dataInsert.Role)) {
                for (const roleID of dataInsert.Role) {
                    const roleExist = await RoleModel.findOne({
                        where: { role_id: roleID },
                    });

                    if (!roleExist) {
                        const error = new Error(`Role dengan ID ${roleID} tidak ditemukan.`);
                        error.status = 404;
                        throw error;
                    }

                    await PenggunaRoleModel.create(
                        {
                            pengguna_id: newUser.pengguna_id,
                            role_id: roleID,
                        },
                        { transaction }
                    );
                }
            }

            await transaction.commit();
            return newUser;
        } catch (error) {
            await transaction.rollback();
            console.error("Error insert Pengguna:", error);
            throw error;
        }
    }

    static async update(dataUpdate) {
        const transaction = await jarrdinDB.transaction();
        const { Op } = require("sequelize");
        try {
            const findUser = await PenggunaModel.findOne({
                where: { pengguna_id: dataUpdate.UserID },
            });

            if (!findUser) {
                const newError = new Error("Pengguna tidak ditemukan");
                newError.status = 404;
                throw newError;
            }

            // Cek apakah email sudah digunakan oleh pengguna lain
            if (dataUpdate.Email) {
                const emailUsed = await PenggunaModel.findOne({
                    where: {
                        email: dataUpdate.Email,
                        pengguna_id: { [Op.ne]: dataUpdate.UserID },
                    },
                });

                if (emailUsed) {
                    const error = new Error("Email sudah terdaftar, gunakan alamat email lain");
                    error.status = 409;
                    throw error;
                }
            }

            // Cek apakah no_telp sudah digunakan oleh pengguna lain
            if (dataUpdate.NoTelp) {
                const noTelpUsed = await PenggunaModel.findOne({
                    where: {
                        no_telp: dataUpdate.NoTelp,
                        pengguna_id: { [Op.ne]: dataUpdate.UserID },
                    },
                });

                if (noTelpUsed) {
                    const error = new Error(
                        "Nomor telepon sudah terdaftar, gunakan nomor telepon yang lain"
                    );
                    error.status = 409;
                    throw error;
                }
            }

            await findUser.update(
                {
                    nama: dataUpdate.Nama,
                    email: dataUpdate.Email,
                    no_telp: dataUpdate.NoTelp,
                    alamat: dataUpdate.Alamat,
                    no_unit: dataUpdate.NoUnit,
                },
                { transaction }
            );

            if (dataUpdate.Role) {
                for (const role of dataUpdate.Role) {
                    const findRole = await RoleModel.findOne({
                        where: { role_id: role.RoleID },
                    });

                    if (!findRole) {
                        const error = new Error("Role not found.");
                        error.status = 404;
                        throw error;
                    }

                    switch (role.Action) {
                        case "CREATE":
                            await PenggunaRoleModel.create(
                                {
                                    pengguna_id: findUser.pengguna_id,
                                    role_id: role.RoleID,
                                },
                                { transaction }
                            );
                            break;
                        case "DELETE":
                            await PenggunaRoleModel.destroy({
                                where: {
                                    pengguna_id: findUser.pengguna_id,
                                    role_id: role.RoleID,
                                },
                                transaction,
                            });
                            break;
                        default:
                            1;
                            const newError = new Error("Invalid request format.");
                            newError.status = 400;
                            throw newError;
                    }
                }
            }

            await transaction.commit();

            return findUser;
        } catch (error) {
            await transaction.rollback();
            console.error("Error update Pengguna:", error);
            throw error;
        }
    }

    static async delete(UserID) {
        // console.log(UserID);
        const transaction = await jarrdinDB.transaction();
        try {
            const findUser = await PenggunaModel.findOne({
                where: { pengguna_id: UserID },
            });

            if (!findUser) {
                const newError = new Error("Pengguna tidak ditemukan");
                newError.status = 404;
                throw newError;
            }

            await findUser.update(
                {
                    status: 2,
                },
                { transaction }
            );

            await transaction.commit();

            return findUser;
        } catch (error) {
            await transaction.rollback();
            console.error("Error non-aktifkan Pengguna:", error);
            throw error;
        }
    }

    static async nonActiveStatus(UserID, Alasan) {
        const transaction = await jarrdinDB.transaction();
        try {
            const findUser = await PenggunaModel.findOne({
                where: { pengguna_id: UserID },
            });

            if (!findUser) {
                const newError = new Error("Pengguna tidak ditemukan");
                newError.status = 404;
                throw newError;
            }

            await findUser.update(
                {
                    status: 0,
                    alasan_batal_ketentuan: Alasan,
                },
                { transaction }
            );

            await transaction.commit();

            return findUser;
        } catch (error) {
            await transaction.rollback();
            console.error("Error pengajuan non-aktifkan Pengguna:", error);
            throw error;
        }
    }
    static async reactivateStatus(UserID) {
        const transaction = await jarrdinDB.transaction();
        try {
            const findUser = await PenggunaModel.findOne({
                where: { pengguna_id: UserID },
            });

            if (!findUser) {
                const newError = new Error("Pengguna tidak ditemukan");
                newError.status = 404;
                throw newError;
            }

            await findUser.update(
                {
                    status: 1,
                    alasan_batal_ketentuan: null,
                },
                { transaction }
            );

            await transaction.commit();

            return findUser;
        } catch (error) {
            await transaction.rollback();
            console.error("Error pengajuan meng-aktifkan kembali Pengguna:", error);
            throw error;
        }
    }

    static async updateTNC(UserID, NewIsKetentuan) {
        const transaction = await jarrdinDB.transaction();
        try {
            const findUser = await PenggunaModel.findOne({
                where: { pengguna_id: UserID },
            });

            if (!findUser) {
                const newError = new Error("Pengguna tidak ditemukan");
                newError.status = 404;
                throw newError;
            }

            await findUser.update(
                {
                    is_ketentuan: NewIsKetentuan,
                    alasan_batal_ketentuan: null,
                },
                { transaction }
            );

            await transaction.commit();

            return findUser;
        } catch (error) {
            await transaction.rollback();
            console.error("Error update is_ketentuan from Pengguna:", error);
            throw error;
        }
    }
}

module.exports = { PenggunaRepository };
