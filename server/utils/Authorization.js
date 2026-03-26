const jwt = require("jsonwebtoken");
const { FiturModel } = require("../database/models");

class Authorization {
    static async encryption(payload) {
        try {
            const secretKey = process.env.SECRET_KEY;

            const options = {
                expiresIn: "12h",
            };

            const token = jwt.sign(payload, secretKey, options);

            return token;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    static async decryption(req, res, next) {
        try {
            const token = req.headers["authorization"];
            // console.log(token);

            if (!token) {
                return res.status(401).json({ message: "Unauthorized" });
            }

            const secretKey = process.env.SECRET_KEY;

            const decoded = jwt.verify(token, secretKey);

            req.dataSession = decoded;

            next();
        } catch (error) {
            console.error(error);

            if (error.name === "TokenExpiredError") {
                return res.status(403).json({ message: "Token has expired" });
            }

            return res.status(403).json({ message: "Forbidden" });
        }
    }

    static checkRole(allowedRoles) {
        return (req, res, next) => {
            const userRoles = req.dataSession.Role.map((role) => role.Nama); // Ambil hanya nama role

            // Cek apakah ada salah satu role yang diizinkan
            const hasAccess = userRoles.some((role) => allowedRoles.includes(role));

            if (!hasAccess) {
                return res.status(403).json({ message: "Forbidden: You do not have access" });
            }

            next();
        };
    }

    // static async checkAccess(featureName) {
    //     return async (req, res, next) => {
    //         try {
    //             const { role_id } = req.dataSession; // role_id dari token

    //             if (!role_id) {
    //                 return res.status(403).json({ message: "Forbidden: Missing role" });
    //             }

    //             // Cari fitur berdasarkan nama fitur
    //             const fitur = await FiturModel.findOne({ where: { nama: featureName } });

    //             if (!fitur) {
    //                 return res.status(403).json({ message: "Feature not found" });
    //             }

    //             // Periksa apakah role memiliki akses ke fitur ini
    //             const hasAccess = await HakAksesModel.findOne({
    //                 where: { role_id, fitur_id: fitur.fitur_id },
    //             });

    //             if (!hasAccess) {
    //                 return res
    //                     .status(403)
    //                     .json({ message: "Forbidden: No access to this feature" });
    //             }

    //             next(); // Lanjutkan ke handler berikutnya jika memiliki akses
    //         } catch (error) {
    //             console.error(error);
    //             return res.status(500).json({ message: "Internal Server Error" });
    //         }
    //     };
    // }
}

module.exports = { Authorization };
