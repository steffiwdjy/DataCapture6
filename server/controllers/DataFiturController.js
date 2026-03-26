const {
    DataFiturRepository,
    FiturRepository,
    PenggunaRepository,
    RoleRepository,
    LogAktivitasRepository,
} = require("../database/repositories");
const { sendNotifToWa } = require("../utils/sendWa");
const { uploadFileGdrive, createFolder } = require("../utils/uploadFileGdrive");
const { Validator } = require("../utils/validator");

class DataFiturController {
    static async getAll(req, res) {
        const { FiturID, Tipe, StartDate, EndDate } = req.params;

        const UserID = req.dataSession.UserID;

        try {
            if (Tipe === "untukUser") {
                const readFiturUntukuser = await DataFiturRepository.readAllByFiturIdUntukUser(
                    UserID,
                    FiturID,
                    StartDate,
                    EndDate
                );
                return res.status(200).json(readFiturUntukuser);
            }

            if (Tipe === "dibuatUser") {
                const readFiturDibuatUser = await DataFiturRepository.readAllByFiturIdDibuatUser(
                    UserID,
                    FiturID,
                    StartDate,
                    EndDate
                );
                return res.status(200).json(readFiturDibuatUser);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    static async getOne(req, res) {
        const DataFiturID = req.params.DataFiturID;

        try {
            const readOneDataFitur = await DataFiturRepository.readOne(DataFiturID);

            const currUserID = req.dataSession.UserID;
            const isBySelf = currUserID === readOneDataFitur.DibuatOleh.UserID;
            const isForSelf = readOneDataFitur.UserTujuan?.some(
                (tujuan) => tujuan.UserID === currUserID
            );

            // Hanya yg membuat data itu sendiri atau yg ditujukan, yang boleh mendapatkan datanya
            if (!isBySelf && !isForSelf) {
                const newError = new Error("Akses ditolak!");
                newError.status = 403;
                throw newError;
            }

            const transformedData = {
                ...readOneDataFitur,
                UserTujuan: readOneDataFitur.UserTujuan.map((tujuan) => tujuan.Nama),
            };

            return res.status(200).json(transformedData);
        } catch (error) {
            console.error("Error fetching data:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    static async post(req, res) {
        const { body, files } = req;

        // Tentukan UserTujuan berd TipeTujuan
        let userTujuan;
        if (body.TipeTujuan === "individu") {
            // Jika individu, parsing UserTujuan dari body sebagai ID individu
            userTujuan = body.UserTujuan.split(",").map((id) => Number(id));
        } else if (body.TipeTujuan === "group") {
            // Jika group, ambil ID pengguna berdasarkan peran
            const roleIds = body.UserTujuan.split(",").map((id) => Number(id));
            try {
                const usersByRole = await Promise.all(
                    roleIds.map(async (roleId) => {
                        const users = await PenggunaRepository.readAllUserByRole(roleId);
                        // Filter agar tidak menyertakan dirinya sendiri
                        const filtered = users.filter(
                            (user) => user.UserID !== req.dataSession.UserID
                        );
                        return {
                            roleId,
                            users: filtered,
                        };
                    })
                );

                // Cek role-role yang kosong
                const missingRoles = [];
                for (const entry of usersByRole) {
                    if (!Array.isArray(entry.users) || entry.users.length === 0) {
                        const role = await RoleRepository.readOne(entry.roleId);
                        missingRoles.push(role ? role.nama : `ID ${entry.roleId}`);
                    }
                }

                // Jika ADA satu saja role yang kosong → gagal
                if (missingRoles.length > 0) {
                    return res.status(404).json({
                        error: `Gagal mengirim data. Tidak ditemukan pengguna dengan role: ${missingRoles.join(
                            ", "
                        )}.`,
                    });
                }

                // Jika semua role valid, ambil userTujuan
                const rawUserIDs = usersByRole.flatMap((entry) =>
                    entry.users.map((user) => user.UserID)
                );
                //agar tidak ada userId yg duplikat, karena Set hanya menyimpan nilai unik
                userTujuan = Array.from(new Set(rawUserIDs));
            } catch (error) {
                return res.status(500).json({ error: "Error fetching users by role." });
            }
        }

        let dataFitur = {
            Judul: body.Judul,
            FiturID: Number(body.FiturID),
            TglDibuat: Number(body.TglDibuat),
            UserID_dibuat: req.dataSession.UserID,
            UserTujuan: userTujuan,
            FileFolder: body.FileFolder || [],
        };
        // console.log(dataFitur, "DATA FITUR");

        const readFitur = await FiturRepository.readOne(dataFitur.FiturID);
        const judul = dataFitur.Judul;

        let linkFiles = ""; //berupa string
        let arrDataUser = [];
        // Fetch user emails from PenggunaRepository
        let userIds = dataFitur.UserTujuan;
        userIds.push(dataFitur.UserID_dibuat); //menambah juga userID untuk yg buat data
        try {
            arrDataUser = await Promise.all(
                userIds.map(async (id) => {
                    const user = await PenggunaRepository.readOne(id);
                    return {
                        UserID: user ? user.UserID : null,
                        Nama: user ? user.Nama : null,
                        NoTelp: user ? user.NoTelp : null,
                        Email: user ? user.Email : null,
                    };
                })
            );
        } catch (error) {
            return res.status(500).json({ error: "Error fetching data user." });
        }
        // console.log(arrDataUser);
        // END Fetch user emails from PenggunaRepository

        // // JIKA post terdapat files
        if (files && files.FileFolder) {
            // membuat folder berdasarkan nama fitur_judul
            const namaFolder = `${readFitur.nama}_${judul}`;
            const folderId = await createFolder(namaFolder);
            try {
                for (let i = 0; i < files.FileFolder.length; i++) {
                    console.log(`Uploading file: ${files.FileFolder[i].originalname}`);
                    const dataFile = await uploadFileGdrive(
                        files.FileFolder[i],
                        arrDataUser,
                        folderId
                    );
                    const url = `https://drive.google.com/file/d/${dataFile.id}/view`; //link dari file pada gdrive
                    if (i === files.FileFolder.length - 1) {
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
            dataFitur = {
                ...dataFitur,
                FileFolder: linkFiles,
            };
        }

        // Validasi data dari request body yang ingin di create
        let { error } = Validator.createDataFitur(dataFitur);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        try {
            const createDataFitur = await DataFiturRepository.create(dataFitur);
            // Filter array untuk menghapus data pembuat data
            arrDataUser = arrDataUser.filter((user) => user.UserID !== dataFitur.UserID_dibuat);
            const jumlahFile = files && files.FileFolder ? files.FileFolder.length : 0;

            // Tambah LogAktivitas
            let dataLog = {
                UserID: req.dataSession.UserID,
                FiturID: Number(body.FiturID),
                IpAddress: req.ip || null,
                UserAgent: req.get("User-Agent") || null,
                Aksi: `Tambah Data ${readFitur.nama}`,
                Keterangan: `Data dengan judul "${dataFitur.Judul}" berhasil ditambahkan dan dikirimkan kepada ${arrDataUser.length} pengguna. Jumlah file yang dilampirkan: ${jumlahFile}.`,
            };
            await LogAktivitasRepository.create(dataLog);

            await sendNotifToWa(arrDataUser, readFitur.nama);
            return res.status(201).json({ success: true, data: createDataFitur });
        } catch (error) {
            console.error(error);
            return res.status(error.status || 500).json({ error: error.message });
        }
    }

    static async delete(req, res) {
        try {
            const deleteDataFitur = await DataFiturRepository.delete(req.params.DataFiturID);

            res.status(201).json({ success: true });
        } catch (error) {
            console.error(error);
            res.status(error.status || 500).json({ error: error.message });
        }
    }
}

module.exports = { DataFiturController };
