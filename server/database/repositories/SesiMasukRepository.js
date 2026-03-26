const { SesiMasukModel } = require("../models");
const { DatabaseManager } = require("../../config/DatabaseManager");
const jarrdinDB = DatabaseManager.getDatabase(process.env.DB_NAME);

class SesiMasukRepository {
    static async readAll() {
        try {
            const findLoginSession = await SesiMasukModel.findAll();

            return findLoginSession;
        } catch (error) {
            throw error;
        }
    }

    static async readOne(otp, email, no_telp) {
        try {
            let findLoginSession;

            findLoginSession = await SesiMasukModel.findOne({
                where: { otp: otp, email: email, no_telp: no_telp },
            });

            if (!findLoginSession) {
                const newError = new Error("Kode otp yang anda masukan salah");
                newError.status = 404;
                throw newError;
            }

            return findLoginSession;
        } catch (error) {
            throw error;
        }
    }

    static async readToken(token) {
        try {
            let findLoginSession;

            findLoginSession = await SesiMasukModel.findOne({
                where: { token: token },
            });

            if (!findLoginSession) {
                const newError = new Error("Sesi anda telah berakhir");
                newError.status = 404;
                throw newError;
            }

            return findLoginSession;
        } catch (error) {
            throw error;
        }
    }

    static async create(dataInsert) {
        const transaction = await jarrdinDB.transaction();
        try {
            const { pengguna_id, email, no_telp, otp } = dataInsert;
            //   console.log(email, no_telp, otp);

            //   EMAIL ATAU NOTELP YANG DIISI
            if ((!email && !no_telp) || !otp) {
                throw new Error("Data yang diperlukan tidak lengkap.");
            }

            const newDataLoginSession = await SesiMasukModel.create(
                {
                    pengguna_id,
                    email,
                    no_telp,
                    otp,
                },
                { transaction }
            );

            await transaction.commit();

            return newDataLoginSession;
        } catch (error) {
            await transaction.rollback();
            console.error("Error creating DataFitur:", error);
            throw error;
        }
    }

    static async updateToken(sesi_id, token) {
        try {
            return await SesiMasukModel.update({ token: token }, { where: { sesi_id: sesi_id } });
        } catch (error) {
            throw error;
        }
    }

    static async delete(id) {
        try {
            const findLoginSession = await SesiMasukModel.findOne({
                where: { sesi_id: id },
            });

            if (!findLoginSession) {
                const newError = new Error("sesi_id tidak ditemukan.");
                newError.status = 404;
                throw newError;
            }

            const deleteLoginSession = await SesiMasukModel.destroy({
                where: { sesi_id: findLoginSession.sesi_id },
            });

            return deleteLoginSession;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = { SesiMasukRepository };
