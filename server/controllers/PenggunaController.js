const jwt = require("jsonwebtoken");
const {
    PenggunaRepository,
    SesiMasukRepository,
    LogAktivitasRepository,
    FiturRepository,
} = require("../database/repositories");
const { Authorization } = require("../utils/Authorization");
const { generateOtp } = require("../utils/generateOtp");
const { sendOtpToEmail } = require("../utils/sendEmail");
const { sendOtpToWa } = require("../utils/sendWa");
const { Validator } = require("../utils/validator");
const excelJS = require("exceljs");
const OTP_EXPIRATION_TIME = 300000; // 5 menit (300.000 ms)

class PenggunaController {
    static async getAll(req, res) {
        try {
            const currUserID = req.dataSession.UserID;
            let currUser = await PenggunaRepository.readOne(req.dataSession.UserID);

            // Cek role
            const isAdmin = currUser.Role?.some((role) => role.RoleID === 5);

            let readUser = await PenggunaRepository.readAll(currUserID);

            if (!isAdmin) {
                readUser = readUser.map((user) => ({
                    UserID: user.UserID,
                    Nama: user.Nama,
                    Role: user.Role,
                }));
            }
            res.status(200).json(readUser);
        } catch (error) {
            console.error(error);
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    static async getOne(req, res) {
        const UserID = req.params.UserID;

        try {
            let readUser = await PenggunaRepository.readOne(UserID);

            let currUser = await PenggunaRepository.readOne(req.dataSession.UserID);
            // Cek role
            const isAdmin = currUser.Role?.some((role) => role.RoleID === 5);
            const isBySelf = currUser.UserID === readUser.UserID;

            // Hanya admin atau user itu sendiri yang boleh getOne
            if (!isAdmin && !isBySelf) {
                const newError = new Error("Akses ditolak!");
                newError.status = 403;
                throw newError;
            }

            res.status(200).json(readUser);
        } catch (error) {
            console.error(error);
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    static async insert(req, res) {
        try {
            const { User } = req.body;

            let currUser = await PenggunaRepository.readOne(req.dataSession.UserID);

            // Cek role
            const isAdmin = currUser.Role?.some((role) => role.RoleID === 5);

            // Hanya admin yang boleh nambah
            if (!isAdmin) {
                const newError = new Error("Akses ditolak!");
                newError.status = 403;
                throw newError;
            }

            const { error } = Validator.registerUser(User);
            if (error) {
                const newError = new Error(error.details[0].message);
                newError.status = 400;
                throw newError;
            }

            const createdUser = await PenggunaRepository.insert(User);

            // Tambah LogAktivitas
            let dataLog = {
                UserID: req.dataSession.UserID,
                FiturID: null,
                IpAddress: req.ip || null,
                UserAgent: req.get("User-Agent") || null,
                Aksi: "Penambahan Data Pengguna",
                Keterangan: `Data pengguna dengan Nama ${createdUser.nama} telah ditambahkan.`,
            };

            await LogAktivitasRepository.create(dataLog);
            res.status(201).json({
                success: true,
                // message: "Pengguna berhasil ditambahkan.",
                data: createdUser,
            });
        } catch (error) {
            console.error(error);
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    static async patch(req, res) {
        try {
            const { User, Mode } = req.body;
            let currUser = await PenggunaRepository.readOne(req.dataSession.UserID);

            // Cek role
            const isAdmin = currUser.Role?.some((role) => role.RoleID === 5);
            const isBySelf = currUser.UserID === User.UserID;

            // Hanya admin atau user itu sendiri yang boleh update
            if (!isAdmin && !isBySelf) {
                const newError = new Error("Akses ditolak!");
                newError.status = 403;
                throw newError;
            }

            // Khusus untuk update is_ketentuan
            if (Mode?.Nama === "updateKetentuan") {
                const isSetuju = User.IsKetentuan === true;

                let updated = await PenggunaRepository.updateTNC(User.UserID, User.IsKetentuan);

                // Jika pengguna membatalkan persetujuan, maka nonaktifkan akun
                if (!isSetuju) {
                    updated = await PenggunaRepository.nonActiveStatus(
                        User.UserID,
                        Mode?.Deskripsi
                    );
                }

                //deskripsi log sesuai dgn isKententuan
                const aksi = isSetuju ? "Persetujuan S&K" : "Pembatalan Persetujuan S&K";
                const keterangan = isSetuju
                    ? "Pengguna menyetujui Syarat & Ketentuan Aplikasi Web Member Rusunami The Jarrdin Cihampelas."
                    : "Pengguna membatalkan persetujuan dan menyatakan bersedia mengajukan permintaan penghapusan data pribadi.";

                await LogAktivitasRepository.create({
                    UserID: req.dataSession.UserID,
                    FiturID: null,
                    IpAddress: req.ip || null,
                    UserAgent: req.get("User-Agent") || null,
                    Aksi: aksi,
                    Keterangan: keterangan,
                });

                const transformedPatchUser = {
                    UserID: updated.pengguna_id,
                    Nama: updated.nama,
                    Email: updated.email,
                    NoTelp: updated.no_telp,
                    Alamat: updated.alamat,
                    NoUnit: updated.no_unit,
                    IsKetentuan: updated.is_ketentuan,
                    Status:
                        updated.status === 0
                            ? "RevokeAgreement"
                            : updated.status === 1
                            ? "Active"
                            : updated.status === 2
                            ? "Unactive"
                            : "Udentified",
                };
                return res.status(200).json({
                    success: true,
                    data: { User: transformedPatchUser },
                });
            }

            //khusu untuk update status
            if (isAdmin && Mode?.Nama === "reactivateStatus") {
                let updated = await PenggunaRepository.reactivateStatus(User.UserID);

                await LogAktivitasRepository.create({
                    UserID: req.dataSession.UserID,
                    FiturID: null,
                    IpAddress: req.ip || null,
                    UserAgent: req.get("User-Agent") || null,
                    Aksi: "Pengubahan Data Pengguna",
                    Keterangan: `Pengguna dengan Nama ${updated.nama} telah diaktifkan kembali ke sistem.`,
                });

                const transformedPatchUser = {
                    UserID: updated.pengguna_id,
                    Nama: updated.nama,
                    Email: updated.email,
                    NoTelp: updated.no_telp,
                    Alamat: updated.alamat,
                    NoUnit: updated.no_unit,
                    IsKetentuan: updated.is_ketentuan,
                    Status:
                        updated.status === 0
                            ? "RevokeAgreement"
                            : updated.status === 1
                            ? "Active"
                            : updated.status === 2
                            ? "Unactive"
                            : "Udentified",
                };
                return res.status(200).json({
                    success: true,
                    data: { User: transformedPatchUser },
                });
            }

            // Proses update umum
            const { error } = Validator.updateUser(User);
            if (error) {
                const newError = new Error(error.details[0].message);
                newError.status = 400;
                throw newError;
            }

            const patchUser = await PenggunaRepository.update(User);

            // Tambah LogAktivitas
            let dataLog = {
                UserID: req.dataSession.UserID,
                FiturID: null,
                IpAddress: req.ip || null,
                UserAgent: req.get("User-Agent") || null,
                Aksi: "Pengubahan Data Pengguna",
                Keterangan: `Data pengguna ${
                    isBySelf ? "" : "dengan Nama " + patchUser.nama
                } telah diperbarui.`,
            };

            await LogAktivitasRepository.create(dataLog);

            const transformedPatchUser = {
                UserID: patchUser.pengguna_id,
                Nama: patchUser.nama,
                Email: patchUser.email,
                NoTelp: patchUser.no_telp,
                Alamat: patchUser.alamat,
                NoUnit: patchUser.no_unit,
                IsKetentuan: patchUser.is_ketentuan,
                Status:
                    patchUser.status === 0
                        ? "RevokeAgreement"
                        : patchUser.status === 1
                        ? "Active"
                        : patchUser.status === 2
                        ? "Unactive"
                        : "Udentified",
            };
            // console.log(transformedPatchUser);

            res.status(200).json({
                success: true,
                data: { User: transformedPatchUser },
            });
        } catch (error) {
            console.error(error);
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    static async delete(req, res) {
        try {
            const UserID = req.params.UserID;
            let currUser = await PenggunaRepository.readOne(req.dataSession.UserID);

            // Cek role
            const isAdmin = currUser.Role?.some((role) => role.RoleID === 5);

            // Hanya admin yang boleh hapus
            if (!isAdmin) {
                const newError = new Error("Akses ditolak!");
                newError.status = 403;
                throw newError;
            }

            const deletedUser = await PenggunaRepository.delete(UserID);

            // Tambah LogAktivitas
            let dataLog = {
                UserID: req.dataSession.UserID,
                FiturID: null,
                IpAddress: req.ip || null,
                UserAgent: req.get("User-Agent") || null,
                Aksi: "Penghapusan Pengguna",
                Keterangan: `Pengguna dengan Nama ${deletedUser.nama} telah dihapus dari sistem.`,
            };

            await LogAktivitasRepository.create(dataLog);
            res.status(200).json({
                success: true,
                data: { User: deletedUser },
            });
        } catch (error) {
            console.error(error);
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    static async postLogin(req, res) {
        try {
            const { User } = req.body;

            const { error } = Validator.loginUser(User);
            if (error) {
                const newError = new Error(error.details[0].message);
                newError.status = 400;
                throw newError;
            }

            const readUser = await PenggunaRepository.readExisting(User.Email || User.NoTelp);
            if (!readUser) {
                //JIka user tidak ditemukan
                return res.status(401).json({ error: "Email atau No telepon tidak terdaftar" });
            }

            const identifier = readUser.Email || readUser.NoTelp;
            const otp = generateOtp(identifier);

            // console.log(readUser, "READUSER");

            //memasukan data session ke database
            SesiMasukRepository.create({
                pengguna_id: readUser.UserID,
                email: readUser.Email,
                no_telp: readUser.NoTelp,
                otp: otp,
            });

            // Tambah LogAktivitas
            let dataLog = {
                UserID: readUser.UserID,
                FiturID: null,
                IpAddress: req.ip || null,
                UserAgent: req.get("User-Agent") || null,
                Aksi: "Login - Permintaan OTP",
            };

            if (readUser.Email && User.Email) {
                dataLog.Keterangan = `Pengguna meminta OTP untuk login menggunakan email: ${readUser.Email}`;
                await LogAktivitasRepository.create(dataLog);
                sendOtpToEmail(readUser.Email, otp);
            }

            if (readUser.NoTelp && User.NoTelp) {
                dataLog.Keterangan = `Pengguna meminta OTP untuk login menggunakan nomor telepon: ${readUser.NoTelp}`;
                await LogAktivitasRepository.create(dataLog);
                sendOtpToWa(readUser.Nama, readUser.NoTelp, otp);
            }

            res.status(200).json({
                success: true,
                // sebelum integrasi ke WA API (jika no_telp maka otp akan di kirim ke client)
                data: { User: readUser },
            });
        } catch (error) {
            console.error(error);
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    static async verifyOtp(req, res) {
        try {
            const { Otp, Email, NoTelp } = req.body; // Klien mengirimkan EMail, MoTelp, dan OTP

            if ((!Email && !NoTelp) || !Otp) {
                return res.status(400).json({ error: "Isi OTP terlebih dahulu" });
            }

            // Temukan session login berdasarkan otp,email,no_telp
            const loginSession = await SesiMasukRepository.readOne(Otp, Email, NoTelp);

            if (!loginSession) {
                return res.status(401).json({ error: "Kode otp yang anda masukan salah" });
            }

            // Cek apakah OTP masih aktif
            const currentTime = new Date().getTime();
            const otpCreationTime = new Date(loginSession.wkt_masuk).getTime();

            // Periksa apakah waktu aktif sudah melewati batas yang diizinkan
            if (currentTime - otpCreationTime > OTP_EXPIRATION_TIME) {
                return res.status(401).json({ error: "Kode otp sudah kadaluwarsa" });
            }

            // Cocokkan OTP
            if (loginSession.otp !== Otp) {
                return res.status(401).json({ error: "Kode otp yang anda masukan salah" });
            }

            const readUser = await PenggunaRepository.readExisting(
                loginSession.email || loginSession.no_telp
            );

            const readFitur = await FiturRepository.readFiturByUserID(readUser.UserID);

            const payload = {
                UserID: readUser.UserID,
                Nama: readUser.Nama,
                Email: readUser.Email,
                NoTelp: readUser.NoTelp,
                Role: readUser.Role,
                Otp: loginSession.otp,
                IsKetentuan: readUser.IsKetentuan,
                Status: readUser.Status,
                LoginSessionID: loginSession.sesi_id,
                Fitur: readFitur,
            };

            // Tambah LogAktivitas
            let dataLog = {
                UserID: readUser.UserID,
                FiturID: null,
                IpAddress: req.ip || null,
                UserAgent: req.get("User-Agent") || null,
                Aksi: "Login - Verifikasi OTP",
                Keterangan: `Pengguna berhasil memverifikasi OTP untuk login`,
            };

            await LogAktivitasRepository.create(dataLog);

            // Jika OTP valid dan masih aktif
            const token = await Authorization.encryption(payload);
            res.set("authorization", `Bearer ${token}`);

            // Memasukan token ke database
            SesiMasukRepository.updateToken(loginSession.sesi_id, token);

            delete payload.Otp;
            delete payload.LoginSessionID;
            res.status(200).json({ success: true, message: "Login successful", data: payload });
        } catch (error) {
            console.error(error);
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    static async getUserSession(req, res) {
        const token = req.headers["authorization"];
        const UserID = req.dataSession.UserID;

        try {
            let readSession = await SesiMasukRepository.readToken(token);
            if (!readSession) {
                return res.status(401).json({ message: "Sesi anda telah berakhir" });
            }

            //cek apakah expired menggunakan jwt.verify
            const secretKey = process.env.SECRET_KEY;
            const decoded = jwt.verify(token, secretKey);

            const { iat, exp, Otp, LoginSessionID, ...rest } = decoded;
            const sessionData = {
                ...rest,
            };

            const userData = await PenggunaRepository.readOne(UserID);

            //jika pengguna sudah dihapus
            if (userData.Status === "Unactive") {
                return res.status(403).json({
                    status: "forbidden",
                    message: "Akun Anda telah dihapus permanen dan tidak dapat mengakses sistem.",
                });
            }

            // //jika pengguna mengajukan pembatalan persetujuan syarat & ketentuan
            // if (userData.Status === "RevokeAgreement") {
            //     return res.status(403).json({
            //         status: "pending_revoke",
            //         message:
            //             "Akun Anda sedang dalam proses pembatalan persetujuan. Akses ditangguhkan.",
            //     });
            // }

            res.status(200).json({ status: "authorized", dataLogin: sessionData });
        } catch (error) {
            console.error(error);
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    static async getLogs(req, res) {
        const { Tipe, StartDate, EndDate } = req.params;
        const UserID = req.dataSession.UserID;

        try {
            let readLogs = await LogAktivitasRepository.findByPenggunaId(
                UserID,
                Tipe,
                StartDate,
                EndDate
            );

            res.status(200).json(readLogs);
        } catch (error) {
            console.error(error);
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    static async downloadLogs(req, res) {
        try {
            const UserID = req.dataSession.UserID;
            let readLogs = await LogAktivitasRepository.findByPenggunaId(UserID, "download");

            const workbook = new excelJS.Workbook(); // membuat workbook baru
            const worksheet = workbook.addWorksheet("Data Logs"); // membuat worksheet baru

            worksheet.columns = [
                { header: "ID Pengguna", key: "pengguna_id", width: 10 },
                { header: "Aksi", key: "aksi", width: 10 },
                { header: "Keterangan", key: "keterangan", width: 10 },
                { header: "Perangkat", key: "user_agent", width: 10 },
                { header: "Alamat IP", key: "ip_address", width: 10 },
                { header: "Waktu", key: "waktu", width: 10 },
            ];

            let counter = 1;
            readLogs.map((log) => {
                worksheet.addRow(log); // tambah data ke worksheet
                counter++;
            });

            // buat first line jd bold
            worksheet.getRow(1).eachCell((cell) => {
                cell.font = { bold: true };
            });

            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader("Content-Disposition", "attachment; filename=data_logs.xlsx");

            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            console.error(error);
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    static async logout(req, res) {
        try {
            const dataSession = req.dataSession;
            console.log(dataSession, "dataSession");
            // delete loginSession
            const loginSession = await SesiMasukRepository.delete(dataSession.LoginSessionID);

            res.status(200).json({ success: true, message: "Logout successful" });
        } catch (error) {
            console.error(error);
            res.status(error.status || 500).json({ error: error.message });
        }
    }
}

module.exports = { PenggunaController };
