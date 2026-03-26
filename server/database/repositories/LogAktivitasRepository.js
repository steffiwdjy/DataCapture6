const { LogAktivitasModel } = require("../models");
const { DatabaseManager } = require("../../config/DatabaseManager");
// const { redisClient } = require("../../config/RedisManager");
const jarrdinDB = DatabaseManager.getDatabase(process.env.DB_NAME);

class LogAktivitasRepository {
    static async create(dataInsert) {
        const transaction = await jarrdinDB.transaction();

        try {
            // 1. Simpan dulu ke database
            const newLog = await LogAktivitasModel.create(
                {
                    pengguna_id: dataInsert.UserID,
                    fitur_id: dataInsert.FiturID,
                    aksi: dataInsert.Aksi,
                    keterangan: dataInsert.Keterangan,
                    waktu: new Date(),
                    ip_address: dataInsert.IpAddress,
                    user_agent: dataInsert.UserAgent,
                },
                { transaction }
            );

            // Commit transaction ke database
            await transaction.commit();
            return newLog;
        } catch (error) {
            await transaction.rollback();
            console.error("Error create LogAktivitas:", error);
            throw error;
        }
    }

    static async findAll() {
        return await LogAktivitasModel.findAll({
            order: [["waktu", "DESC"]],
        });
    }

    static async findById(log_id) {
        return await LogAktivitasModel.findByPk(log_id);
    }

    static async findByPenggunaId(pengguna_id, tipe, start_date, end_date) {
        const filter = {};
        let startDateEpoch = null;
        let endDateEpoch = null;

        if (start_date && end_date) {
            startDateEpoch = parseInt(start_date);
            endDateEpoch = parseInt(end_date);

            // Set startDate ke awal hari (00:00:00) di zona waktu lokal
            let startDateAdjusted = new Date(startDateEpoch);
            startDateAdjusted.setHours(0, 0, 0, 0); // Set ke jam 00:00:00

            // Set endDate ke akhir hari (23:59:59.999) di zona waktu lokal
            let endDateAdjusted = new Date(endDateEpoch);
            endDateAdjusted.setHours(23, 59, 59, 999); // Set ke jam 23:59:59.999

            startDateEpoch = startDateAdjusted.getTime();
            endDateEpoch = endDateAdjusted.getTime();

            // Untuk query ke database
            filter.waktu = {
                [jarrdinDB.Sequelize.Op.between]: [
                    new Date(startDateEpoch),
                    new Date(endDateEpoch),
                ],
            };
        }

        // Filter tipe aksi jika bukan "all"
        if (tipe && tipe !== "all") {
            const Op = jarrdinDB.Sequelize.Op;

            if (tipe === "login") {
                filter.aksi = { [Op.like]: "%login%" };
            } else if (tipe === "insert") {
                filter.aksi = { [Op.like]: "%tambah%" };
            } else if (tipe === "update") {
                filter.aksi = { [Op.like]: "%ubah%" };
            }
        }

        // Group log berdasarkan tanggal & filter
        const logs = await LogAktivitasModel.findAll({
            where: { pengguna_id, ...filter },
            order: [["waktu", "DESC"]],
        });

        if (tipe === "download") {
            return logs;
        }

        const groupedLogs = logs.reduce((groups, log) => {
            const logDate = new Date(log.waktu);
            // Formatkan ke string lokal tanpa jam (YYYY-MM-DD sesuai zona lokal)
            const dateKey =
                logDate.getFullYear() +
                "-" +
                String(logDate.getMonth() + 1).padStart(2, "0") +
                "-" +
                String(logDate.getDate()).padStart(2, "0");

            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(log);
            return groups;
        }, {});

        // Ubah jadi array dan urutkan dari terbaru ke terlama
        const groupedArray = Object.keys(groupedLogs)
            .sort((a, b) => new Date(b) - new Date(a)) // Urutkan desc
            .map((date) => ({
                Tanggal: date,
                Logs: groupedLogs[date].sort((a, b) => new Date(b.waktu) - new Date(a.waktu)), // urutkan log dalam 1 tanggal
            }));

        return groupedArray;
    }

    static async delete(log_id) {
        const log = await LogAktivitasModel.findByPk(log_id);
        if (log) {
            const logKey = `log:${log.pengguna_id}:${new Date(log.waktu).getTime()}`;
        }
        return await LogAktivitasModel.destroy({
            where: { log_id },
        });
    }
}

module.exports = { LogAktivitasRepository };
