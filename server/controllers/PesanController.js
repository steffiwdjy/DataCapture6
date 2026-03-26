const {
    PesanRepository,
    PenggunaRoleRepository,
    PenggunaRepository,
    LogAktivitasRepository,
} = require("../database/repositories");
const { sendNotifToWa } = require("../utils/sendWa");
const { uploadFileGdrive, createFolder } = require("../utils/uploadFileGdrive");
const { Validator } = require("../utils/validator");

class PesanController {
    static async getAll(req, res) {
        const { Tipe, StartDate, EndDate } = req.params;
        const UserID = req.dataSession.UserID;

        try {
            if (Tipe === "untukUser") {
                const readAspirasi = await PesanRepository.readAllByPenerimaID(
                    UserID,
                    StartDate,
                    EndDate
                );
                return res.status(200).json(readAspirasi);
            }

            if (Tipe === "dibuatUser") {
                const readAspirasi = await PesanRepository.readAllByPengirimID(
                    UserID,
                    StartDate,
                    EndDate
                );
                return res.status(200).json(readAspirasi);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    static async getOne(req, res) {
        const PesanID = req.params.PesanID;
        const Tipe = req.params.Tipe;
        const UserID = req.dataSession.UserID;

        try {
            const readOneMessage = await PesanRepository.readOne(UserID, PesanID, Tipe);
            // console.log("Fetched message:", readOneMessage);

            return res.status(200).json(readOneMessage);
        } catch (error) {
            // console.error("Error fetching data:", error);
            return res
                .status(error.status || 500)
                .json({ error: error.message || "Internal server error" });
        }
    }

    static async post(req, res) {
        const { body, files } = req;
        // console.log(body, files);

        const isReply = body.UserTujuanID ? true : false;
        let dataMessage = {
            ...body,
            UserTujuanID: Number(body.UserTujuanID),
            TglDibuat: Number(body.TglDibuat),
            UserID_dibuat: req.dataSession.UserID,
        };

        // console.log(body, dataMessage, isReply);

        let userIds = [];
        // KALAU BUKAN REPLY, maka ambil semua idPengurus
        if (!isReply) {
            userIds = await PenggunaRoleRepository.readAllPengurusID();
            // Filter agar tidak menyertakan dirinya sendiri
            userIds = userIds.filter((item) => item.pengguna_id !== req.dataSession.UserID);
            // console.log(userIds);

            if (userIds.length === 0) {
                return res.status(404).json({
                    error: `Gagal mengirim data. Tidak ditemukan pengguna dengan role: Pengurus.`,
                });
            }
        } else {
            // KALAU REPLY, maka yg di push adalah id user tujuan saja
            userIds.push({ pengguna_id: dataMessage.UserTujuanID });
        }
        userIds.push({ pengguna_id: dataMessage.UserID_dibuat }); //menambah juga pengguna_id untuk user yg membuat data
        const judul = dataMessage.Judul;
        let linkFiles = ""; //berupa string
        // console.log(files);

        // console.log(userIds);

        // // JIKA post terdapat files
        let arrDataUser = [];

        // Fetch user emails from PenggunaRepository
        try {
            arrDataUser = await Promise.all(
                userIds.map(async (user) => {
                    console.log(user);

                    const readUser = await PenggunaRepository.readOne(user.pengguna_id);
                    return {
                        UserID: user ? readUser.UserID : null,
                        Nama: user ? readUser.Nama : null,
                        NoTelp: user ? readUser.NoTelp : null,
                        Email: user ? readUser.Email : null,
                    };
                })
            );
        } catch (error) {
            return res.status(500).json({ error: "Error fetching user emails." });
        }
        // console.log(arrDataUser);
        // END Fetch user emails from PenggunaRepository

        if (files && files.PesanFile) {
            // membuat folder berdasarkan nama fitur_judul
            const namaFolder = `Masukan&Aspirasi_${judul}`;
            const folderId = await createFolder(namaFolder);
            try {
                for (let i = 0; i < files.PesanFile.length; i++) {
                    console.log(`Uploading file: ${files.PesanFile[i].originalname}`);
                    const dataFile = await uploadFileGdrive(
                        files.PesanFile[i],
                        arrDataUser,
                        folderId
                    );
                    const url = `https://drive.google.com/file/d/${dataFile.id}/view`; //link dari file pada gdrive
                    if (i === files.PesanFile.length - 1) {
                        linkFiles += url;
                    } else {
                        linkFiles += url + ",";
                    }
                }
            } catch (error) {
                console.error(`Error uploading file: ${error}`);
                return res.status(500).send(`Error uploading file: ${error.message}`);
            }
            console.log(linkFiles);
            dataMessage = {
                ...dataMessage,
                PesanFile: linkFiles,
            };
        }

        // Menghapus atribut UserTujuanID
        const { UserTujuanID, ...newDataMessage } = dataMessage;

        // Tambahkan AllPengurusID ke dalam objek baru tanpa UserTujuanID
        dataMessage = {
            ...newDataMessage,
            AllPengurusID: userIds,
        };

        // Validasi data dari request body yang ingin di create
        let { error } = Validator.createMessage(dataMessage, isReply);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        try {
            const createMessage = await PesanRepository.create(dataMessage);

            // Filter array untuk menghapus data pembuat data
            arrDataUser = arrDataUser.filter((user) => user.UserID !== dataMessage.UserID_dibuat);
            const jumlahFile = files && files.PesanFile ? files.PesanFile.length : 0;

            // Tambah LogAktivitas
            let dataLog = {
                UserID: req.dataSession.UserID,
                FiturID: 7,
                IpAddress: req.ip || null,
                UserAgent: req.get("User-Agent") || null,
                Aksi: `${isReply ? "Balas" : "Tambah Data"} Masukan Aspirasi`,
                Keterangan: `Data dengan judul "${dataMessage.Judul}" berhasil ${
                    isReply
                        ? `dibalas dan dikirimkan ke ${arrDataUser[0].Nama}`
                        : "ditambahkan dan dikirimkan kepada seluruh Pengurus"
                }. Jumlah file yang dilampirkan: ${jumlahFile}.`,
            };
            await LogAktivitasRepository.create(dataLog);

            await sendNotifToWa(arrDataUser, "Masukan & Aspirasi");
            return res.status(201).json({ success: true, data: createMessage });
        } catch (error) {
            console.error(error);
            return res.status(error.status || 500).json({ error: error.message });
        }
    }

    static async updateRead(req, res) {
        const { MessageID } = req.body;
        const UserID = req.dataSession.UserID;

        try {
            const updateMessage = await PesanRepository.updateRead(MessageID, UserID);
            return res.status(201).json(updateMessage);
        } catch (error) {
            console.error(error);
            return res.status(error.status || 500).json({ error: error.message });
        }
    }
}

module.exports = { PesanController };
