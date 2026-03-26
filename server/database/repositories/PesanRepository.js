const { DatabaseManager } = require("../../config/DatabaseManager");
const { PesanModel, PenggunaModel, PesanTujuanModel } = require("../models");
const jarrdinDB = DatabaseManager.getDatabase(process.env.DB_NAME);

class PesanRepository {
    static async readAllNotifPesan(penerima_id) {
        try {
            const findMessage = await PesanTujuanModel.findAll({
                where: { penerima_id: penerima_id },
                include: [
                    { model: PenggunaModel, required: true, raw: true },
                    {
                        model: PesanModel,
                        required: true,
                        raw: true,
                        include: [{ model: PenggunaModel, required: true, raw: true }],
                    },
                ],
            });

            const transformedData = findMessage.map((msg) => ({
                Id: msg.pesan_id,
                FiturID: 7, //no fitur_id untuk masukan & aspirasi
                Judul: msg.Pesan.judul,
                DibuatOleh: msg.Pesan.Pengguna.nama,
                TglDibuat: msg.Pesan.tgl_dibuat,
                IsRead: msg.is_dibaca,
            }));

            // console.log(transformedData);

            // Mengurutkan berdasarkan is_dibaca dan TglDibuat
            const filteredData = transformedData.sort((a, b) => {
                // Urutkan berdasarkan is_dibaca, 1 (dibaca) akan muncul sebelum 0 (belum dibaca)
                if (a.IsRead === b.IsRead) {
                    // Jika is_dibaca sama, urutkan berdasarkan TglDibuat terbaru
                    return new Date(b.TglDibuat) - new Date(a.TglDibuat);
                }
                return a.IsRead - b.IsRead; // Mengurutkan berdasarkan is_dibaca, 1 lebih besar dari 0
            });

            return filteredData;
        } catch (error) {
            throw error;
        }
    }

    static async readAllByPenerimaID(penerima_id, startDate, endDate) {
        try {
            const findMessage = await PesanTujuanModel.findAll({
                where: { penerima_id: penerima_id },
                include: [
                    { model: PenggunaModel, required: true, raw: true },
                    {
                        model: PesanModel,
                        required: true,
                        raw: true,
                        include: [{ model: PenggunaModel, required: true, raw: true }],
                    },
                ],
            });

            const transformedData = findMessage.map((msg) => ({
                Id: msg.pesan_id,
                FiturID: 7, //no fitur_id untuk masukan & aspirasi
                Judul: msg.Pesan.judul,
                DibuatOleh: msg.Pesan.Pengguna.nama,
                TglDibuat: msg.Pesan.tgl_dibuat,
                IsRead: msg.is_dibaca,
            }));

            // console.log(transformedData);

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

    static async readAllByPengirimID(pengirim_id, startDate, endDate) {
        try {
            const findMessage = await PesanModel.findAll({
                where: { pengirim_id: pengirim_id },
                include: [
                    { model: PenggunaModel, required: true, raw: true },
                    {
                        model: PesanTujuanModel,
                        required: true,
                        raw: true,
                        include: [{ model: PenggunaModel, required: true, raw: true }],
                    },
                ],
            });

            const transformedData = findMessage.map((msg) => ({
                Id: msg.pesan_id,
                Judul: msg.judul,
                DibuatOleh: msg.Pengguna.nama,
                TglDibuat: msg.tgl_dibuat,
                // IsRead: msg.is_dibaca,
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

    static async readOne(pengguna_id, pesan_id, tipeRead) {
        try {
            let findMessage;

            if (tipeRead === "untukUser") {
                findMessage = await PesanModel.findOne({
                    where: { pesan_id: pesan_id },
                    include: [
                        { model: PenggunaModel, required: true },
                        {
                            model: PesanTujuanModel,
                            where: { penerima_id: pengguna_id },
                            required: true,
                        },
                    ],
                });

                if (!findMessage) {
                    const newError = new Error("Data tidak ditemukan.");
                    newError.status = 404;
                    throw newError;
                }

                const transformedData = {
                    Id: findMessage.pesan_id,
                    Judul: findMessage.judul,
                    TglDibuat: findMessage.tgl_dibuat,
                    DibuatOleh: {
                        UserID: findMessage.Pengguna.pengguna_id,
                        Nama: findMessage.Pengguna.nama,
                    },
                    Pesan: findMessage.pesan_text,
                    IsRead: findMessage.pesan_tujuans[0].is_dibaca,
                    File: findMessage.pesan_file,
                };

                return transformedData;
            } else if (tipeRead === "dibuatUser") {
                findMessage = await PesanModel.findOne({
                    where: { pesan_id: pesan_id, pengirim_id: pengguna_id },
                    include: [
                        { model: PenggunaModel, required: true },
                        {
                            model: PesanTujuanModel,
                            required: true,
                            include: { model: PenggunaModel, required: true },
                        },
                    ],
                });

                if (!findMessage) {
                    const newError = new Error("Data tidak ditemukan.");
                    newError.status = 404;
                    throw newError;
                }

                const transformedData = {
                    Id: findMessage.pesan_id,
                    Judul: findMessage.judul,
                    TglDibuat: findMessage.tgl_dibuat,
                    DibuatOleh: {
                        UserID: findMessage.Pengguna.pengguna_id,
                        Nama: findMessage.Pengguna.nama,
                    },
                    Pesan: findMessage.pesan_text,
                    // UserTujuan: findMessage.pesan_tujuans.map((msg) => ({
                    //   UserID: msg.Pengguna.pengguna_id,
                    //   Nama: msg.Pengguna.nama,
                    // })),
                    UserTujuan: findMessage.pesan_tujuans.map((msg) => msg.Pengguna.nama),
                    File: findMessage.pesan_file,
                };

                return transformedData;
            }

            // console.log(findMessage);
        } catch (error) {
            throw error;
        }
    }

    // static async readOneWithReplies(pesan_id) {
    //   try {
    //     const findMessage = await PesanModel.findOne({
    //       where: { pesan_id },
    //       include: [
    //         {
    //           model: PesanModel,
    //           as: "replies", // Self-referencing association
    //           include: {
    //             model: PenggunaModel,
    //           },
    //         },
    //         { model: PenggunaModel },
    //       ],
    //     });

    //     if (!findMessage) {
    //       const newError = new Error("Data tidak ditemukan.");
    //       newError.status = 404;
    //       throw newError;
    //     }

    //     const transformedData = {
    //       Id: findMessage.pesan_id,
    //       Judul: findMessage.judul,
    //       TglDibuat: findMessage.tgl_dibuat,
    //       DibuatOleh: findMessage.Pengguna.nama,
    //       Pesan: findMessage.pesan_text,
    //       // IsRead: findMessage.pesan_tujuans[0].is_dibaca,
    //       File: findMessage.pesan_file,
    //     };

    //     return transformedData;

    //     // return findMessage;
    //   } catch (error) {
    //     throw error;
    //   }
    // }

    static async create(dataInsert, isReply) {
        const transaction = await jarrdinDB.transaction();

        try {
            const { Judul, TglDibuat, UserID_dibuat, Pesan, PesanFile, AllPengurusID } = dataInsert;
            if (!Judul || !TglDibuat || !UserID_dibuat || !Pesan) {
                throw new Error("Data yang diperlukan tidak lengkap.");
            }

            const newMessage = await PesanModel.create(
                {
                    fitur_id: 7, //7 adalah ID Fitur Aspirasi
                    pengirim_id: UserID_dibuat,
                    judul: Judul,
                    pesan_text: Pesan,
                    pesan_file: PesanFile,
                    tgl_dibuat: new Date(TglDibuat),
                },
                { transaction }
            );

            // console.log(AllPengurusID);

            // Filter to hapus UserID_dibuat dari UserTujuan if ada
            const filteredUserTujuan = AllPengurusID.filter(
                (user) => user.pengguna_id !== UserID_dibuat
            );
            const pesan_id = newMessage.pesan_id;

            const messageTujuanRecords = filteredUserTujuan.map((user) => ({
                pesan_id: pesan_id,
                penerima_id: user.pengguna_id, // Pastikan ini adalah integer, bukan instance
            }));

            //   console.log(messageTujuanRecords, "TUJUAN");

            await PesanTujuanModel.bulkCreate(messageTujuanRecords, { transaction });

            await transaction.commit();

            return newMessage;
        } catch (error) {
            await transaction.rollback();
            console.error("Error creating Message:", error);
            throw error;
        }
    }

    static async replyMessage(dataMessage) {
        const transaction = await jarrdinDB.transaction();
        try {
            const { OriginalMessageID, Judul, TglDibuat, Pesan, UserID_dibuat, PesanFile } =
                dataMessage;
            if (!Judul || !TglDibuat || !Pesan) {
                throw new Error("Data yang diperlukan tidak lengkap.");
            }

            // Create the reply message
            const replyMessage = await PesanModel.create({
                fitur_id: 7, //7 adalah ID Fitur Aspirasi
                pengirim_id: UserID_dibuat, // ID of the user replying
                parentMessageID: OriginalMessageID, // ID of the original message
                judul: "RE: " + dataMessage.Judul, // Prefix with "RE:" to indicate a reply
                pesan_text: dataMessage.Pesan,
                pesan_file: dataMessage.PesanFile,
                tgl_dibuat: new Date(TglDibuat),
            });

            // BUAT MESSAGE ISREAD MENJADI DIBACA
            let messageTujuan = await PesanTujuanModel.findOne({
                where: { pesan_id: OriginalMessageID, penerima_id: UserID_dibuat },
                raw: true,
            });

            let responseUpdate;
            //jika is_dibaca True
            if (messageTujuan.is_dibaca === 1) {
                responseUpdate = await PesanTujuanModel.update(
                    { is_dibaca: false, tgl_dibaca: null },
                    { where: { pesan_id: OriginalMessageID, penerima_id: UserID_dibuat } }
                );
            } else {
                //Jika isread false
                responseUpdate = await PesanTujuanModel.update(
                    { is_dibaca: true, tgl_dibaca: new Date() },
                    { where: { pesan_id: OriginalMessageID, penerima_id: UserID_dibuat } }
                );
            }

            if (!responseUpdate) {
                const newError = new Error("Error update is_dibaca");
                newError.status = 500;
                throw newError;
            }

            await transaction.commit();

            return replyMessage;
        } catch (error) {
            await transaction.rollback();
            console.error("Error creating Message:", error);
            throw error;
        }
    }

    static async updateRead(pesan_id, pengguna_id) {
        // console.log(pesan_id, pengguna_id);

        try {
            let messageTujuan = await PesanTujuanModel.findOne({
                where: { pesan_id: pesan_id, penerima_id: pengguna_id },
                raw: true,
            });

            //jika is_dibaca True
            if (messageTujuan.is_dibaca === 1) {
                await PesanTujuanModel.update(
                    { is_dibaca: false, tgl_dibaca: null },
                    { where: { pesan_id: pesan_id, penerima_id: pengguna_id } }
                );

                return { IsRead: false };
            } else {
                //Jika isread false
                await PesanTujuanModel.update(
                    { is_dibaca: true, tgl_dibaca: new Date() },
                    { where: { pesan_id: pesan_id, penerima_id: pengguna_id } }
                );

                return { IsRead: true };
            }
        } catch (error) {
            throw error;
        }
    }
    static async updateRead2(pesan_id, pengguna_id) {
        // console.log(pesan_id, pengguna_id);

        try {
            await PesanTujuanModel.update(
                { is_dibaca: true, tgl_dibaca: new Date() },
                { where: { pesan_id: pesan_id, penerima_id: pengguna_id } }
            );

            return { IsRead: true };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = { PesanRepository };
