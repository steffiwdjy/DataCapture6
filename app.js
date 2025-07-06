
// package.json dependencies needed:
// npm install express mysql2 bcrypt dotenv multer path body-parser express-session multer cors

const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const session = require('express-session');
const multer = require('multer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 7000;


// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// MySQL Connection
function getConnection() {
    return mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE
    });
}

async function loadRentalsFromDb() {
    const conn = await getConnection();
    const [rows] = await conn.execute("SELECT * FROM rentals ORDER BY id ASC");
    await conn.end();

    // Parsing kolom komentar dari JSON string ke list
    for (const r of rows) {
        // Format waktu checkin/checkout ke string agar bisa ditampilkan
        if (r.waktu_checkin) {
            try {
                // Jika waktu adalah datetime.time, pakai strftime langsung
                if (r.waktu_checkin instanceof Date) {
                    r.waktu_checkin = r.waktu_checkin.toTimeString().slice(0, 5);
                } else if (typeof r.waktu_checkin === 'string') {
                    // Kalau waktu adalah timedelta, ubah ke HH:MM secara manual
                    const timeMatch = r.waktu_checkin.match(/(\d+):(\d+)/);
                    if (timeMatch) {
                        const hours = parseInt(timeMatch[1]);
                        const minutes = parseInt(timeMatch[2]);
                        r.waktu_checkin = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                    }
                } else {
                    // Handle timedelta-like objects
                    const totalSeconds = parseInt(r.waktu_checkin);
                    const hours = Math.floor(totalSeconds / 3600);
                    const minutes = Math.floor((totalSeconds % 3600) / 60);
                    r.waktu_checkin = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                }
            } catch (error) {
                r.waktu_checkin = "";
            }
        } else {
            r.waktu_checkin = "";
        }

        if (r.waktu_checkout) {
            try {
                if (r.waktu_checkout instanceof Date) {
                    r.waktu_checkout = r.waktu_checkout.toTimeString().slice(0, 5);
                } else if (typeof r.waktu_checkout === 'string') {
                    const timeMatch = r.waktu_checkout.match(/(\d+):(\d+)/);
                    if (timeMatch) {
                        const hours = parseInt(timeMatch[1]);
                        const minutes = parseInt(timeMatch[2]);
                        r.waktu_checkout = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                    }
                } else {
                    const totalSeconds = parseInt(r.waktu_checkout);
                    const hours = Math.floor(totalSeconds / 3600);
                    const minutes = Math.floor((totalSeconds % 3600) / 60);
                    r.waktu_checkout = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                }
            } catch (error) {
                r.waktu_checkout = "";
            }
        } else {
            r.waktu_checkout = "";
        }

        // Format tanggal checkin/checkout ke string juga (jika perlu)
        if (r.tanggal_checkin) {
            r.tanggal_checkin = r.tanggal_checkin instanceof Date ? 
                r.tanggal_checkin.toISOString().split('T')[0] : 
                r.tanggal_checkin;
        } else {
            r.tanggal_checkin = "";
        }

        if (r.tanggal_checkout) {
            r.tanggal_checkout = r.tanggal_checkout instanceof Date ? 
                r.tanggal_checkout.toISOString().split('T')[0] : 
                r.tanggal_checkout;
        } else {
            r.tanggal_checkout = "";
        }

        // Komentar parsing
        if (r.komentar) {
            try {
                r.komentar = JSON.parse(r.komentar);
            } catch (error) {
                r.komentar = [];
            }
        } else {
            r.komentar = [];
        }
    }

    return rows;
}

// Fungsi update waktu_checkout dan diedit_oleh di DB
async function updateCheckoutTime(rentalId, waktuCheckout, user) {
    const conn = await getConnection();
    const [rows] = await conn.execute(`SELECT waktu_checkout FROM rentals WHERE id=?`, [rentalId]);
    const oldValue = rows.length > 0 ? rows[0].waktu_checkout : "";

    await conn.execute(`
        UPDATE rentals
        SET waktu_checkout=?, diedit_oleh=?
        WHERE id=?
    `, [waktuCheckout, user, rentalId]);

    await logRentalChange(
        rentalId,
        'edited',
        'waktu check-out',
        oldValue,
        waktuCheckout,
        user
    );

    await conn.end();
}

// Fungsi update komentar dan diedit_oleh di DB
async function updateKomentar(rentalId, komentarList, user) {
    const conn = await getConnection();
    const [rows] = await conn.execute(`SELECT komentar FROM rentals WHERE id=?`, [rentalId]);
    const oldKomentar = rows.length > 0 ? rows[0].komentar : "";

    const komentarJson = JSON.stringify(komentarList);

    await conn.execute(`
        UPDATE rentals
        SET komentar=?, diedit_oleh=?
        WHERE id=?
    `, [komentarJson, user, rentalId]);

    await logRentalChange(
        rentalId,
        'edited',
        'komentar',
        oldKomentar,
        komentarJson,
        user
    );

    await conn.end();
}


// Utilities
function hashPassword(password) {
    return bcrypt.hashSync(password, 10);
}

function checkPassword(password, hashed) {
    return bcrypt.compareSync(password, hashed);
}

function isValidEmail(email) {
    const pattern = /[^@]+@[^@]+\.[^@]+/;
    return pattern.test(email);
}

async function createTables() {
    try {
        const conn = await getConnection();

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS users (
                email VARCHAR(255) PRIMARY KEY,
                password TEXT,
                nib VARCHAR(13)
            )
        `);

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS rentals (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nama VARCHAR(255),
                tower VARCHAR(10),
                lantai VARCHAR(10),
                unit VARCHAR(10),
                status_kewarganegaraan VARCHAR(10),
                jenis_sewa ENUM('Harian', 'Mingguan', 'Bulanan'),
                metode_pembayaran VARCHAR(50),
                metode_lain VARCHAR(50),
                tanggal_checkin DATE,
                waktu_checkin TIME,
                tanggal_checkout DATE,
                waktu_checkout TIME,
                lama_menginap INT,
                komentar TEXT,
                email_agent VARCHAR(255),
                diedit_oleh VARCHAR(255)
            )
        `);

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS rental_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                rental_id INT,
                action VARCHAR(20),
                field_changed VARCHAR(50),
                old_value TEXT,
                new_value TEXT,
                email VARCHAR(255),
                time_stamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (rental_id) REFERENCES rentals(id),
                FOREIGN KEY (email) REFERENCES users(email)
            )
        `);

        await conn.end();
    } catch (error) {
        console.error(`Database error: ${error}`);
        throw error;
    }
}

async function addUser(email, password, nib) {
    const conn = await getConnection();
    await conn.execute("INSERT INTO users (email, password, nib) VALUES (?, ?, ?)", [email, password, nib]);
    await conn.end();
}

async function getUserPassword(email) {
    const conn = await getConnection();
    const [rows] = await conn.execute("SELECT password FROM users WHERE email = ?", [email]);
    await conn.end();
    return rows.length > 0 ? rows[0].password : null;
}

async function logRentalChange(rentalId, action, field, oldVal, newVal, userEmail) {
    const conn = await getConnection();
    await conn.execute(`
        INSERT INTO rental_logs (rental_id, action, field_changed, old_value, new_value, email)
        VALUES (?, ?, ?, ?, ?, ?)
    `, [rentalId, action, field, oldVal, newVal, userEmail]);
    await conn.end();
}

async function addRental(data) {
    const conn = await getConnection();
    const [result] = await conn.execute(`
        INSERT INTO rentals 
        (nama, tower, lantai, unit, status_kewarganegaraan, jenis_sewa, metode_pembayaran, metode_lain,
         tanggal_checkin, waktu_checkin, tanggal_checkout, waktu_checkout, lama_menginap, komentar, email_agent)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        data.nama, data.tower, data.lantai, data.unit, data.status_kewarganegaraan,
        data.jenis_sewa, data.metode_pembayaran, data.metode_lain, data.tanggal_checkin,
        data.waktu_checkin, data.tanggal_checkout, data.waktu_checkout,
        data.lama_menginap, data.komentar, data.email_agent
    ]);

    const rentalId = result.insertId;

    await logRentalChange(
        rentalId,
        'added',
        'all_fields',
        '',
        'added new rental data',
        data.email_agent
    );

    await conn.end();
}



const pelanggaranList = [
    "Ditemukan alat suntik di tempat sampah",
    "Ditemukan kondom dalam jumlah banyak",
    "Kerusakan parah pada fasilitas",
    "Kebisingan berlebihan di malam hari",
    "Penyalahgunaan alkohol/narkoba",
    "Kekerasan atau ancaman kepada penghuni lain",
    "Merokok di area terlarang",
    "Tidak menjaga kebersihan unit",
    "Terpantau adanya tamu yang keluar masuk pada malam hari",
    "Menyewakan kembali unit yang disewa",
    "Agen memberlakukan sistem transit",
    "Agen lalai terhadap pelanggaran penyewa"
];

// Initialize database
createTables();

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Auth routes
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const hashInDb = await getUserPassword(email);
        if (hashInDb && checkPassword(password, hashInDb)) {
            req.session.user = email;
            res.json({ success: true });
        } else {
            res.json({ success: false, message: "Email atau password salah" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

app.post('/api/signup', async (req, res) => {
    const { email, password, nib } = req.body;

    const validEmail = isValidEmail(email);
    const validPassword = password.length >= 8;

    // nib
    const nibStr = String(nib).trim();
    const validNib = /^\d{13}$/.test(nibStr);

    if (!validEmail) {
        return res.json({ success: false, message: "Email tidak valid" });
    }
    if (!validPassword) {
        return res.json({ success: false, message: "Password harus minimal 8 karakter" });
    }
    if (!validNib) {
        return res.json({ success: false, message: "NIB tidak valid" });
    }

    try {
        const existingUser = await getUserPassword(email);
        if (existingUser) {
            return res.json({ success: false, message: "Email sudah terdaftar" });
        }

        await addUser(email, hashPassword(password), nib);
        res.json({ success: true, message: "Registrasi berhasil! Silakan login" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }


    console.log("Received NIB:", nib);

});


app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.get('/api/user', (req, res) => {
    res.json({ user: req.session.user || null });
});

// Rental routes
app.post('/api/rental', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const {
        nama, tower, lantai, unit, status_kewarganegaraan,
        metode_pembayaran, metode_lain, tanggal_checkin, waktu_checkin,
        tanggal_checkout, lama_menginap, jenis_sewa, lama_sewa_bulan
    } = req.body;

    const fieldLabels = {
        nama: "Nama Penyewa",
        tower: "Tower",
        lantai: "Lantai",
        unit: "Nomor Unit",
        status_kewarganegaraan: "Status Kewarganegaraan",
        metode_pembayaran: "Metode Pembayaran",
        tanggal_checkin: "Tanggal Check-In",
        waktu_checkin: "Waktu Check-In",
        tanggal_checkout: "Tanggal Check-Out",
        lama_menginap: "Lama Menginap",
        jenis_sewa: "Jenis Sewa"
    };

    const requiredFields = {
        nama, tower, lantai, unit, status_kewarganegaraan,
        metode_pembayaran, tanggal_checkin, waktu_checkin
    };


    for (const [key, value] of Object.entries(requiredFields)) {
        if (value === undefined || value === null || String(value).trim() === "") {
            return res.status(400).json({
                success: false,
                message: `Field ${fieldLabels[key] || key} tidak boleh kosong`
            });
        }
    }

    let finalTanggalCheckout = tanggal_checkout;
    let finalLamaMenginap = lama_menginap;

    if (jenis_sewa === "Bulanan") {
        if (!lama_sewa_bulan || isNaN(lama_sewa_bulan) || lama_sewa_bulan <= 0) {
            return res.status(400).json({
                success: false,
                message: "Lama sewa (bulan) wajib diisi untuk sewa bulanan."
            });
        }

        const startDate = new Date(tanggal_checkin);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + parseInt(lama_sewa_bulan));
        endDate.setDate(endDate.getDate() - 1); // hitung mundur 1 hari agar tidak tabrakan dengan tanggal mulai bulan berikutnya

        finalTanggalCheckout = endDate.toISOString().split('T')[0];
        const timeDiff = Math.abs(endDate - startDate);
        finalLamaMenginap = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    } else {
        if (!tanggal_checkout || !lama_menginap) {
            return res.status(400).json({
                success: false,
                message: "Tanggal check-out dan lama menginap wajib diisi untuk sewa harian/mingguan."
            });
        }
    }

    const resmiMetode = ["Kartu Kredit", "Cash", "Kartu Debit", "QRIS"];
    const metodeLainTerisi = metode_lain && metode_lain.trim() !== "";

    if (resmiMetode.includes(metode_pembayaran)) {
        if (metodeLainTerisi) {
            return res.status(400).json({
                success: false,
                message: `Metode lainnya harus dikosongkan jika memilih \"${metode_pembayaran}\"`
            });
        }
    } else {
        if (!metodeLainTerisi) {
            return res.status(400).json({
                success: false,
                message: `Field Metode Lainnya wajib diisi.`
            });
        }
    }

    try {
        const data = {
            nama: nama || "",
            tower: tower || "",
            lantai: lantai || "",
            unit: unit || "",
            status_kewarganegaraan: status_kewarganegaraan || "",
            jenis_sewa: jenis_sewa || "Harian", // fallback default
            metode_pembayaran: metode_pembayaran || "",
            metode_lain: metode_lain || "", // pastikan string
            tanggal_checkin: tanggal_checkin || null,
            waktu_checkin: waktu_checkin || null,
            tanggal_checkout: finalTanggalCheckout || null,
            waktu_checkout: null, // tetap null aman
            lama_menginap: finalLamaMenginap || 0,
            komentar: "", // default empty string
            email_agent: req.session.user || ""
        };

        for (const [key, value] of Object.entries(data)) {
            if (value === undefined) {
                console.error(`Field ${key} is undefined`);
            }
        }


        await addRental(data);
        res.json({ success: true, message: "Data penyewa berhasil disimpan!" });
    } catch (error) {
        console.error("Error saat simpan rental:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});


app.get('/api/rentals', async (req, res) => {
    
    if (!req.session.user) {
        console.log("User belum login");
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    try {
        const dataList = await loadRentalsFromDb();
        res.json({ success: true, data: dataList });
    } catch (error) {
        console.error("Gagal load data penyewa:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});




app.post('/api/update-checkout', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { rentalId, waktuCheckout } = req.body;

    try {
        if (waktuCheckout) {
            // Validate time format
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(waktuCheckout)) {
                return res.json({ success: false, message: "Format waktu check-out tidak valid. Gunakan format HH:MM." });
            }
        }
        
        await updateCheckoutTime(rentalId, waktuCheckout, req.session.user);
        res.json({ success: true, message: "Waktu check-out disimpan" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

app.post('/api/update-komentar', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { rentalId, komentar } = req.body;

    try {
        await updateKomentar(rentalId, komentar, req.session.user);
        res.json({ success: true, message: "Komentar diperbarui" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

app.get('/api/pelanggaran-list', (req, res) => {
    res.json({ data: pelanggaranList });
});

app.get('/api/download-csv', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    try {
        const dataList = await loadRentalsFromDb(); // Tambahkan baris ini

        const headers = [
            "Nama Penyewa", "Jenis Sewa", "Status Kewarganegaraan", "Tower", "Lantai", "Unit",
            "Metode Pembayaran", "Tanggal Check-In", "Waktu Check-In",
            "Tanggal Check-Out", "Waktu Check-Out", "Lama Menginap (hari)",
            "Komentar", "Agen", "Diedit Oleh"
        ];

        let csvContent = headers.join(',') + '\n';

        dataList.forEach(row => {
            const komentarStr = Array.isArray(row.komentar) ? row.komentar.join(', ') : "";
            const csvRow = [
                row.nama, row.jenis_sewa || "", row.status_kewarganegaraan, row.tower, row.lantai, row.unit,
                row.metode_pembayaran, row.tanggal_checkin, row.waktu_checkin,
                row.tanggal_checkout, row.waktu_checkout, row.lama_menginap,
                komentarStr, row.email_agent, row.diedit_oleh || ""
            ].map(field => `"${field || ""}"`).join(',');
            csvContent += csvRow + '\n';
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="data_penyewa.csv"');
        res.send(csvContent);
    } catch (error) {
        console.error("Gagal download CSV:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});


app.get('/api/logs/:rentalId', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const rentalId = req.params.rentalId;
    const conn = await getConnection();
    const [logs] = await conn.execute(`
        SELECT action, field_changed, old_value, new_value, email, time_stamp
        FROM rental_logs
        WHERE rental_id = ?
        ORDER BY time_stamp DESC
    `, [rentalId]);
    await conn.end();
    res.json({ success: true, logs });
});

// Endpoint untuk mengambil semua log
app.get('/api/all-logs', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    try {
        const conn = await getConnection();
        const [logs] = await conn.execute(`
            SELECT rental_id, action, field_changed, old_value, new_value, email, time_stamp
            FROM rental_logs
            ORDER BY time_stamp DESC
        `);
        await conn.end();

        res.json({ success: true, logs });
    } catch (error) {
        console.error("Gagal ambil semua log:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});



// Create public directory structure
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
}

// // Create HTML file
app.get('/', (req, res) => {
  res.sendFile(path.resolve('./index.html'));
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}`);
});

