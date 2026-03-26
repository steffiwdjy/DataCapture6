const { DataFiturModel, TujuanPenggunaModel, PenggunaModel } = require("../models");
const { DatabaseManager } = require("../../config/DatabaseManager");
const jarrdinDB = DatabaseManager.getDatabase(process.env.DB_NAME);

class DataFiturRepository {
    static async readAllUntukUser(pengguna_id) {
        try {
            let findDataFitur;
            findDataFitur = await PenggunaModel.findAll({
                where: { pengguna_id: pengguna_id },
                include: [
                    {
                        model: TujuanPenggunaModel,
                        required: true,
                        include: [
                            {
                                model: DataFiturModel,
                                required: true,
                                include: [
                                    {
                                        model: PenggunaModel,
                                        required: true,
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });

            if (
                !findDataFitur ||
                !findDataFitur.length === 0 ||
                !findDataFitur[0]?.tujuan_penggunas
            ) {
                return [];
            }

            const transformedData = findDataFitur[0]?.tujuan_penggunas.map((data) => ({
                Id: data.DataFitur.datafitur_id,
                FiturID: data.DataFitur.fitur_id,
                Judul: data.DataFitur.judul,
                DibuatOleh: data.DataFitur.Pengguna.nama,
                TglDibuat: data.DataFitur.tgl_dibuat,
                IsRead: data.is_dibaca,
            }));

            // Mengurutkan berdasarkan is_dibaca dan TglDibuat
            transformedData.sort((a, b) => {
                // Urutkan berdasarkan is_dibaca, 1 (dibaca) akan muncul sebelum 0 (belum dibaca)
                if (a.IsRead === b.IsRead) {
                    // Jika is_dibaca sama, urutkan berdasarkan TglDibuat terbaru
                    return new Date(b.TglDibuat) - new Date(a.TglDibuat);
                }
                return a.IsRead - b.IsRead; // Mengurutkan berdasarkan is_dibaca, 1 lebih besar dari 0
            });

            return transformedData;

            // return findDataFitur;
        } catch (error) {
            throw error;
        }
    }
    static async readAllByFiturIdUntukUser(pengguna_id, fitur_id, startDate, endDate) {
        console.log(fitur_id);

        try {
            let findDataFitur;
            findDataFitur = await PenggunaModel.findAll({
                where: { pengguna_id: pengguna_id },
                include: [
                    {
                        model: TujuanPenggunaModel,
                        required: true,
                        include: [
                            {
                                model: DataFiturModel,
                                required: true,
                                where: { fitur_id: fitur_id },
                                include: [
                                    {
                                        model: PenggunaModel,
                                        required: true,
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });

            if (
                !findDataFitur ||
                !findDataFitur.length === 0 ||
                !findDataFitur[0]?.tujuan_penggunas
            ) {
                return [];
            }

            const transformedData = findDataFitur[0]?.tujuan_penggunas.map((data) => ({
                Id: data.DataFitur.datafitur_id,
                Judul: data.DataFitur.judul,
                DibuatOleh: data.DataFitur.Pengguna.nama,
                TglDibuat: data.DataFitur.tgl_dibuat,
            }));

            // Filter transformedData berdasarkan startDate dan endDate
            const filteredData = transformedData.filter((item) => {
                const itemDate = new Date(item.TglDibuat).getTime(); // Konversi TglDibuat ke epoch
                return itemDate >= startDate && itemDate <= endDate;
            });

            // Mengurutkan berdasarkan TglDibuat terbaru
            filteredData.sort((a, b) => new Date(b.TglDibuat) - new Date(a.TglDibuat));

            console.log(transformedData);
            return filteredData;
        } catch (error) {
            throw error;
        }
    }
    static async readAllByFiturIdDibuatUser(pengguna_id, fitur_id, startDate, endDate) {
        try {
            let findDataFitur;
            findDataFitur = await PenggunaModel.findAll({
                where: { pengguna_id: pengguna_id },
                include: [
                    {
                        model: DataFiturModel,
                        required: true,
                        where: { fitur_id: fitur_id },
                        include: [
                            {
                                model: PenggunaModel,
                                required: true,
                            },
                        ],
                    },
                ],
            });

            if (!findDataFitur || !findDataFitur.length === 0 || !findDataFitur[0]?.DataFiturs) {
                return [];
            }

            const transformedData = findDataFitur[0]?.DataFiturs.map((data) => ({
                Id: data.datafitur_id,
                Judul: data.judul,
                DibuatOleh: data.Pengguna.nama,
                TglDibuat: data.tgl_dibuat,
            }));

            // Filter transformedData berdasarkan startDate dan endDate
            const filteredData = transformedData.filter((item) => {
                const itemDate = new Date(item.TglDibuat).getTime(); // Konversi TglDibuat ke epoch
                return itemDate >= startDate && itemDate <= endDate;
            });

            // Mengurutkan berdasarkan TglDibuat terbaru
            filteredData.sort((a, b) => new Date(b.TglDibuat) - new Date(a.TglDibuat));

            return filteredData;
        } catch (error) {
            throw error;
        }
    }

    static async readOne(datafitur_id) {
        try {
            let findDataFitur;

            findDataFitur = await DataFiturModel.findOne({
                where: { datafitur_id: datafitur_id },
                include: [
                    {
                        model: PenggunaModel, // Include untuk user pembuat data
                        attributes: ["nama", "pengguna_id"], // Ambil hanya nama, dan pengguna_id pembuat
                    },
                    {
                        model: TujuanPenggunaModel, // Include untuk user tujuan
                        required: false, // Jika ada, ambil data UserTujuan
                        include: [
                            {
                                model: PenggunaModel, // Include data dari PenggunaModel di dalam UserTujuan
                                attributes: ["nama", "pengguna_id"], // Ambil nama user tujuan
                            },
                        ],
                    },
                ],
            });
            if (!findDataFitur) {
                const newError = new Error("Data tidak ditemukan.");
                newError.status = 404;
                throw newError;
            }

            // Transform the data to the desired format
            const transformedData = {
                Judul: findDataFitur.judul,
                TglDibuat: findDataFitur.tgl_dibuat,
                DibuatOleh: {
                    UserID: findDataFitur.Pengguna.pengguna_id,
                    Nama: findDataFitur.Pengguna.nama,
                },
                UserTujuan: findDataFitur.tujuan_penggunas.map((tujuan) => ({
                    UserID: tujuan.Pengguna.pengguna_id,
                    Nama: tujuan.Pengguna.nama,
                })),
                File: findDataFitur.file_folder,
            };

            return transformedData;
            // return findDataFitur;
        } catch (error) {
            throw error;
        }
    }

    static async create(dataInsert) {
        const transaction = await jarrdinDB.transaction();
        try {
            const { FiturID, Judul, TglDibuat, UserID_dibuat, FileFolder, UserTujuan } = dataInsert;

            if (
                !FiturID ||
                !Judul ||
                !TglDibuat ||
                !UserID_dibuat ||
                !FileFolder ||
                !UserTujuan ||
                !Array.isArray(UserTujuan)
            ) {
                throw new Error("Data yang diperlukan tidak lengkap.");
            }

            const newDataFitur = await DataFiturModel.create(
                {
                    fitur_id: FiturID,
                    judul: Judul,
                    tgl_dibuat: new Date(TglDibuat),
                    pengguna_id_dibuat: UserID_dibuat,
                    file_folder: FileFolder,
                },
                { transaction }
            );

            // Filter to hapus UserID_dibuat dari UserTujuan if ada
            const filteredUserTujuan = UserTujuan.filter(
                (pengguna_id) => pengguna_id !== UserID_dibuat
            );

            const userTujuanRecords = filteredUserTujuan.map((pengguna_id) => ({
                datafitur_id: newDataFitur.datafitur_id,
                pengguna_id,
            }));

            await TujuanPenggunaModel.bulkCreate(userTujuanRecords, { transaction });

            await transaction.commit();

            return newDataFitur;
        } catch (error) {
            await transaction.rollback();
            console.error("Error creating DataFitur:", error);
            throw error;
        }
    }

    // Fungsi delete untuk menghapus dataFitur beserta relasi di TujuanPenggunaModel
    static async delete(datafitur_id) {
        const transaction = await jarrdinDB.transaction();
        try {
            // Cari apakah datafitur_id ada
            const dataFitur = await DataFiturModel.findOne({
                where: { datafitur_id },
                include: [TujuanPenggunaModel],
            });

            if (!dataFitur) {
                throw new Error("DataFitur not found.");
            }

            // Hapus relasi dari TujuanPenggunaModel terlebih dahulu
            await TujuanPenggunaModel.destroy({
                where: { datafitur_id },
                transaction,
            });

            // Hapus data dari DataFiturModel
            await DataFiturModel.destroy({
                where: { datafitur_id },
                transaction,
            });

            // Commit transaksi setelah berhasil
            await transaction.commit();

            return { success: true, message: "DataFitur deleted successfully." };
        } catch (error) {
            await transaction.rollback();
            console.error("Error deleting DataFitur:", error);
            throw error;
        }
    }

    static async updateIsRead(pengguna_id, datafitur_id) {
        try {
            await TujuanPenggunaModel.update(
                {
                    is_dibaca: true,
                },
                { where: { pengguna_id: pengguna_id, datafitur_id: datafitur_id } }
            );
            return { IsRead: true };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = { DataFiturRepository };
