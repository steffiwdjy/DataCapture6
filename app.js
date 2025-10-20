// package.json dependencies needed:
// npm install express mysql2 bcrypt dotenv path body-parser express-session cors multer json2csv

const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');
const multer = require('multer');
const { Parser } = require('json2csv');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 7000;

// --- File Upload Configuration ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('public/uploads'));
app.use(session({
    secret: 'kunci-rahasia-super-aman-jangan-disebar',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// --- Security Middleware ---
const checkAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: "Akses ditolak. Silakan login." });
    }
    next();
};

const ADMIN_ROLES = ['ketua agen', 'p3srs', 'pkj'];
const checkAdmin = (req, res, next) => {
    if (!req.session.user || !ADMIN_ROLES.includes(req.session.user.role)) {
        return res.status(403).json({ success: false, message: "Akses ditolak. Fitur ini hanya untuk admin." });
    }
    next();
};

// ================== AUTHENTICATION ==================
app.post('/api/signup', async (req, res) => {
    const { email, password, nib } = req.body;
    if (!email || !password || !nib || password.length < 8 || !/^\d{13}$/.test(nib)) {
        return res.status(400).json({ success: false, message: "Data tidak valid." });
    }
    
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [existingUser] = await conn.query('SELECT email FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            await conn.rollback();
            conn.release();
            return res.status(409).json({ success: false, message: "Email sudah terdaftar." });
        }
        
        const [agentResult] = await conn.query('INSERT INTO agents (name) VALUES (?)', [email]);
        const newAgentId = agentResult.insertId;

        const hashedPassword = await bcrypt.hash(password, 10);
        await conn.query(
            'INSERT INTO users (email, password, nib, role, agent_id) VALUES (?, ?, ?, ?, ?)',
            [email, hashedPassword, nib, 'agen', newAgentId]
        );
        
        await conn.commit();
        conn.release();
        res.json({ success: true, message: "Registrasi berhasil! Silakan login." });

    } catch (error) {
        if(conn) await conn.rollback();
        if(conn) conn.release();
        console.error("Signup Error:", error);
        res.status(500).json({ success: false, message: "Server error saat registrasi." });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: "Email atau password salah." });
        }
        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            req.session.user = { id: user.id, email: user.email, role: user.role };
            res.json({ success: true, user: req.session.user });
        } else {
            res.status(401).json({ success: false, message: "Email atau password salah." });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error." });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy(() => res.json({ success: true }));
});

app.get('/api/user', (req, res) => {
    res.json({ user: req.session.user || null });
});


// ================== RENTALS DATA ==================
app.get('/api/rentals', checkAuth, async (req, res) => {
    const user = req.session.user;
    let query = `
        SELECT
            r.*,
            (SELECT GROUP_CONCAT(
                JSON_OBJECT(
                    'action', l.action, 'field_changed', l.field_changed, 'old_value', l.old_value,
                    'new_value', l.new_value, 'email', l.email, 'time_stamp', l.time_stamp
                ) SEPARATOR '|||'
            ) FROM rental_logs l WHERE l.rental_id = r.id) as logs_json
        FROM rentals r
    `;
    const params = [];

    if (!ADMIN_ROLES.includes(user.role)) {
        query += ' WHERE r.email_agent = ?';
        params.push(user.email);
    }
    query += ' ORDER BY r.created_at DESC';

    try {
        const [rows] = await pool.query(query, params);
        
        rows.forEach(r => {
            r.status_pasutri = r.status_pasutri === 'Menikah' ? 'Ya' : 'Belum Menikah';
            r.komentar = JSON.parse(r.komentar || '[]');
            if (r.logs_json) {
                r.logs = r.logs_json.split('|||').map(logStr => JSON.parse(logStr))
                                        .sort((a, b) => new Date(b.time_stamp) - new Date(a.time_stamp));
            } else {
                r.logs = [];
            }
            delete r.logs_json;
        });
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error fetching rentals with logs:", error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data penyewa.' });
    }
});

app.put('/api/rentals/:id', checkAuth, async (req, res) => {
    const { id } = req.params;
    const { jenis_sewa, metode_pembayaran, waktu_checkout, komentar, metode_lain } = req.body;
    
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [oldDataRows] = await conn.query('SELECT * FROM rentals WHERE id = ?', [id]);
        if (oldDataRows.length === 0) {
            await conn.rollback(); conn.release();
            return res.status(404).json({ success: false, message: 'Data rental tidak ditemukan.' });
        }
        const oldData = oldDataRows[0];
        
        const newData = {
            jenis_sewa,
            metode_pembayaran,
            metode_lain: metode_lain || oldData.metode_lain,
            waktu_checkout: waktu_checkout || null,
            komentar: JSON.stringify(komentar || []),
        };
        const changedFields = {};
        const logEntries = [];

        Object.keys(newData).forEach(key => {
            let oldValue = oldData[key];
            if (key === 'komentar') oldValue = oldValue || '[]';
            else if (oldValue === null) oldValue = "";

            if (String(oldValue) !== String(newData[key])) {
                changedFields[key] = newData[key];
                logEntries.push(['update', key, String(oldValue), String(newData[key]), req.session.user.email, id]);
            }
        });

        if (Object.keys(changedFields).length > 0) {
            changedFields.diedit_oleh = req.session.user.email;
            const updateQuery = 'UPDATE rentals SET ' + Object.keys(changedFields).map(key => `${key} = ?`).join(', ') + ' WHERE id = ?';
            const updateParams = [...Object.values(changedFields), id];
            await conn.query(updateQuery, updateParams);

            if (logEntries.length > 0) {
                const logQuery = 'INSERT INTO rental_logs (action, field_changed, old_value, new_value, email, rental_id) VALUES ?';
                await conn.query(logQuery, [logEntries]);
            }
        }
        
        await conn.commit();
        conn.release();
        res.json({ success: true, message: 'Data berhasil diperbarui.' });

    } catch (error) {
        if(conn) await conn.rollback();
        if(conn) conn.release();
        console.error("Error updating rental:", error);
        res.status(500).json({ success: false, message: 'Gagal memperbarui data.' });
    }
});

app.get('/api/rentals/duplicates', checkAdmin, async (req, res) => {
    try {
        const query = `
            SELECT r1.* FROM rentals r1
            INNER JOIN (
                SELECT nik FROM rentals WHERE nik IS NOT NULL AND nik != '' GROUP BY nik HAVING COUNT(*) > 1
            ) r2 ON r1.nik = r2.nik
            ORDER BY r1.nik, r1.created_at DESC;
        `;
        const [rows] = await pool.query(query);
        rows.forEach(r => r.komentar = JSON.parse(r.komentar || '[]'));
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal cek data duplikat.' });
    }
});


// ================== CSV DOWNLOAD ENDPOINTS ==================

// --- 1. DOWNLOAD RENTAL DATA (All Roles) ---
app.get('/api/rentals/csv', checkAuth, async (req, res) => {
    try {
        const user = req.session.user;
        let query = 'SELECT * FROM rentals';
        const params = [];

        if (!ADMIN_ROLES.includes(user.role)) {
            query += ' WHERE email_agent = ?';
            params.push(user.email);
        }
        query += ' ORDER BY created_at DESC';
        const [rows] = await pool.query(query, params);

        const fields = ['id', 'nama', 'nik', 'status_pasutri', 'status_kewarganegaraan', 'tower', 'lantai', 'unit', 'jenis_sewa', 'metode_pembayaran', 'metode_lain', 'tanggal_checkin', 'waktu_checkin', 'tanggal_checkout', 'waktu_checkout', 'lama_menginap', 'email_agent', 'diedit_oleh', 'created_at'];
        const csv = new Parser({ fields }).parse(rows);

        res.header('Content-Type', 'text/csv');
        res.attachment('data-penyewa.csv');
        res.send(csv);
    } catch (error) {
        res.status(500).send("Gagal membuat file CSV.");
    }
});

// --- 2. DOWNLOAD ALL LOG DATA (All Roles) ---
app.get('/api/logs/csv', checkAuth, async (req, res) => {
    try {
        const user = req.session.user;
        let query = `
            SELECT 
                l.id, l.time_stamp, l.email, r.nama as nama_penyewa, CONCAT(r.tower, '-', r.lantai, '-', r.unit) as unit,
                l.action, l.field_changed, l.old_value, l.new_value
            FROM rental_logs l
            LEFT JOIN rentals r ON l.rental_id = r.id
        `;
        const params = [];

        if (!ADMIN_ROLES.includes(user.role)) {
            query += ' WHERE r.email_agent = ?';
            params.push(user.email);
        }
        
        query += ' ORDER BY l.time_stamp DESC';
        
        const [logs] = await pool.query(query, params);
        
        const fields = ['id', 'time_stamp', 'email', 'nama_penyewa', 'unit', 'action', 'field_changed', 'old_value', 'new_value'];
        const csv = new Parser({ fields }).parse(logs);

        res.header('Content-Type', 'text/csv');
        res.attachment('semua-log-perubahan.csv');
        res.send(csv);
    } catch (error) {
        res.status(500).send("Gagal membuat file CSV.");
    }
});

// --- 3. DOWNLOAD SINGLE TENANT LOG (All Roles) ---
app.get('/api/rentals/:id/log/csv', checkAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const [rentalInfo] = await pool.query('SELECT nama, unit FROM rentals WHERE id = ?', [id]);
        if (rentalInfo.length === 0) return res.status(404).send('Data penyewa tidak ditemukan.');
        
        const { nama, unit } = rentalInfo[0];
        const safeFilename = `log-${nama.replace(/[^a-zA-Z0-9]/g, '_')}-unit_${unit}.csv`;

        const [logs] = await pool.query('SELECT * FROM rental_logs WHERE rental_id = ? ORDER BY time_stamp DESC', [id]);
        const fields = ['time_stamp', 'email', 'action', 'field_changed', 'old_value', 'new_value'];
        const csv = new Parser({ fields }).parse(logs);

        res.header('Content-Type', 'text/csv');
        res.attachment(safeFilename);
        res.send(csv);
    } catch (error) {
        res.status(500).send("Gagal membuat file CSV.");
    }
});


// ================== DASHBOARD (NEW & UPDATED) ==================

// --- 1. RENTALS OVER TIME (FOR LINE CHART) ---
app.get('/api/dashboard/rentals-over-time', checkAuth, async (req, res) => {
    const { filter } = req.query;
    const user = req.session.user;
    
    let groupBy = "DATE_FORMAT(created_at, '%Y-%m-%d')"; // Daily for weekly
    let dateFilter = 'WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';

    if (filter === 'monthly') {
        dateFilter = 'WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
    } else if (filter === 'all') {
        groupBy = "DATE_FORMAT(created_at, '%Y-%m')"; // Monthly for all-time
        dateFilter = '';
    }

    let query = `
        SELECT ${groupBy} as period, COUNT(*) as count 
        FROM rentals 
        ${dateFilter}
    `;
    const params = [];

    if (!ADMIN_ROLES.includes(user.role)) {
        query += ` ${dateFilter ? 'AND' : 'WHERE'} email_agent = ?`;
        params.push(user.email);
    }

    query += ` GROUP BY period ORDER BY period ASC`;

    try {
        const [results] = await pool.query(query, params);
        const labels = results.map(r => r.period);
        const data = results.map(r => r.count);
        res.json({ success: true, labels, data });
    } catch (error) {
        console.error("Stats Error:", error);
        res.status(500).json({ success: false, message: 'Gagal memuat statistik rentang waktu.' });
    }
});

// --- 2. POPULAR UNITS (FOR HISTOGRAM) ---
app.get('/api/dashboard/popular-units', checkAuth, async (req, res) => {
    const { filter } = req.query;
    const user = req.session.user;

    let dateFilter = '';
    if (filter === 'weekly') {
        dateFilter = 'WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
    } else if (filter === 'monthly') {
        dateFilter = 'WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
    }
    
    let query = `
        SELECT 
            CONCAT(tower, '-', lantai, '-', unit) as unit_full, 
            email_agent,
            COUNT(*) as rental_count 
        FROM rentals 
        ${dateFilter}
    `;
    const params = [];

    if (!ADMIN_ROLES.includes(user.role)) {
        query += ` ${dateFilter ? 'AND' : 'WHERE'} email_agent = ?`;
        params.push(user.email);
    }

    query += ` GROUP BY unit_full, email_agent ORDER BY rental_count DESC LIMIT 5`;
    
    try {
        const [results] = await pool.query(query, params);
        const labels = results.map(r => r.unit_full);
        const data = results.map(r => r.rental_count);
        const agents = results.map(r => r.email_agent); // For admin view
        res.json({ success: true, labels, data, agents });
    } catch (error) {
        console.error("Popular Units Error:", error);
        res.status(500).json({ success: false, message: 'Gagal memuat unit populer.' });
    }
});


// --- 3. AGENT PERFORMANCE (ADMINS ONLY) ---
app.get('/api/dashboard/agent-performance', checkAdmin, async (req, res) => {
    const { filter } = req.query;

    let dateFilter = '';
    if (filter === 'weekly') {
        dateFilter = 'WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
    } else if (filter === 'monthly') {
        dateFilter = 'WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
    }

    const query = `
        SELECT email_agent, COUNT(*) as total_rented 
        FROM rentals 
        ${dateFilter} 
        GROUP BY email_agent 
        ORDER BY total_rented DESC
    `;

    try {
        const [stats] = await pool.query(query);
        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal memuat statistik agen.' });
    }
});


// --- 4. VIOLATIONS ---
app.post('/api/dashboard/violations', checkAdmin, upload.single('photo'), async (req, res) => {
    const { rental_id, description } = req.body;
    const photo_url = req.file ? `/uploads/${req.file.filename}` : null;
    try {
        await pool.query(
            `INSERT INTO violations (rental_id, description, photo_url, uploaded_by) VALUES (?, ?, ?, ?)`,
            [rental_id, description, photo_url, req.session.user.email]
        );
        res.json({ success: true, message: 'Laporan pelanggaran berhasil diupload.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal upload laporan.' });
    }
});


app.get('/api/dashboard/violations', checkAuth, async (req, res) => {
    try {
        const user = req.session.user;
        const isAdmin = ADMIN_ROLES.includes(user.role);

        const uploadedByField = isAdmin ? 'v.uploaded_by' : "'' as uploaded_by";
        
        const query = `SELECT v.id, v.description, v.photo_url, v.created_at, r.nama, r.unit, ${uploadedByField}
            FROM violations v 
            JOIN rentals r ON v.rental_id = r.id 
            ORDER BY v.created_at DESC`;
        
        const [violations] = await pool.query(query);
        res.json({ success: true, data: violations });
    } catch (error) {
        console.error("Violation Fetch Error:", error);
        res.status(500).json({ success: false, message: 'Gagal memuat laporan.' });
    }
});



// Endpoint to update a violation description
app.put('/api/dashboard/violations/:id', checkAdmin, async (req, res) => {
    const { id } = req.params;
    const { description } = req.body;
    if (!description) {
        return res.status(400).json({ success: false, message: 'Deskripsi tidak boleh kosong.' });
    }
    try {
        const [result] = await pool.query('UPDATE violations SET description = ? WHERE id = ?', [description, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan.' });
        }
        res.json({ success: true, message: 'Deskripsi laporan berhasil diperbarui.' });
    } catch (error) {
        console.error("Violation Update Error:", error);
        res.status(500).json({ success: false, message: 'Gagal memperbarui laporan.' });
    }
});

// Endpoint to delete a violation
app.delete('/api/dashboard/violations/:id', checkAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM violations WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan.' });
        }
        res.json({ success: true, message: 'Laporan pelanggaran berhasil dihapus.' });
    } catch (error) {
        console.error("Violation Delete Error:", error);
        res.status(500).json({ success: false, message: 'Gagal menghapus laporan.' });
    }
});


// ================== MANAJEMEN UNIT ==================
async function getOccupiedUnits() {
    try {
        // A unit is occupied if its checkout date is today or in the future.
        const [occupied] = await pool.query(
            "SELECT DISTINCT CONCAT(tower, '-', lantai, '-', unit) as unit_string FROM rentals WHERE tanggal_checkout >= CURDATE()"
        );
        // Return a Set for fast O(1) lookups
        return new Set(occupied.map(r => r.unit_string));
    } catch (error) {
        console.error("Error fetching occupied units:", error);
        return new Set(); // Return an empty set on error
    }
}


async function getAgentIdByEmail(email) {
    const conn = await pool.getConnection();
    try {
        const [rows] = await conn.query("SELECT agent_id FROM users WHERE email = ?", [email]);
        return rows.length > 0 ? rows[0].agent_id : null;
    } finally {
        conn.release();
    }
}

function parseUnitNumber(unit_number) {
    const parts = (unit_number || "").split('-');
    return {
        unit_tower: parts[0] || '',
        unit_lantai: parts[1] || '',
        unit_nomor: parts[2] || '',
    };
}

app.get('/api/agents', checkAdmin, async(req, res) => {
    try {
        const [agents] = await pool.query("SELECT email FROM users WHERE role = 'agen' ORDER BY email");
        res.json({ success: true, data: agents });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal memuat daftar agen.' });
    }
});

app.get('/api/units/:agentEmail', checkAdmin, async (req, res) => {
    try {
        const agentEmail = decodeURIComponent(req.params.agentEmail);
        const agentId = await getAgentIdByEmail(agentEmail);
        if (!agentId) return res.json({ success: true, data: [] });

        const [units] = await pool.query("SELECT id, unit_number FROM units WHERE agent_id = ?", [agentId]);
        const formattedUnits = units.map(u => ({ id: u.id, ...parseUnitNumber(u.unit_number) }));
        res.json({ success: true, data: formattedUnits });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal memuat unit agen.' });
    }
});

app.post('/api/units', checkAdmin, async (req, res) => {
    const { agent_email, unit_tower, unit_lantai, unit_nomor } = req.body;
    try {
        const agentId = await getAgentIdByEmail(agent_email);
        if (!agentId) return res.status(404).json({ success: false, message: 'Agent tidak ditemukan.' });

        const unitNumber = `${unit_tower}-${unit_lantai}-${unit_nomor}`;
        await pool.query("INSERT INTO units (agent_id, unit_number) VALUES (?, ?)", [agentId, unitNumber]);
        res.json({ success: true, message: 'Unit berhasil ditambahkan.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal menambahkan unit.' });
    }
});

app.delete('/api/units/:unitId', checkAdmin, async (req, res) => {
    try {
        await pool.query("DELETE FROM units WHERE id = ?", [req.params.unitId]);
        res.json({ success: true, message: 'Unit berhasil dihapus.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal menghapus unit.' });
    }
});

app.get('/api/my-units', checkAuth, async(req, res) => {
    try {
        const agentId = await getAgentIdByEmail(req.session.user.email);
        if (!agentId) return res.json({ success: true, data: [] });
        
        const occupiedUnitsSet = await getOccupiedUnits();

        const [units] = await pool.query("SELECT id, unit_number FROM units WHERE agent_id = ?", [agentId]);
        const formattedUnits = units.map(u => {
            
            const unitParts = parseUnitNumber(u.unit_number);
            const unitString = `${unitParts.unit_tower}-${unitParts.unit_lantai}-${unitParts.unit_nomor}`;
            return {
                id: u.id,
                ...unitParts,
                is_occupied: occupiedUnitsSet.has(unitString)
            };
            
        });
        res.json({ success: true, data: formattedUnits });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal memuat unit Anda.' });
    }
});


// Get all units for admin roles
app.get('/api/all-units', checkAdmin, async (req, res) => {
    try {
        const occupiedUnitsSet = await getOccupiedUnits();

        // --- THIS IS THE FIX ---
        const query = 'SELECT u.id, u.unit_number, us.email as agent_email ' +
                    'FROM units u ' +
                    'JOIN users us ON u.agent_id = us.agent_id ' +
                    'ORDER BY us.email, u.unit_number';
        // --- END OF FIX ---

        const [units] = await pool.query(query);
        const formattedUnits = units.map(u => {
            const unitParts = parseUnitNumber(u.unit_number);
            const unitString = `${unitParts.unit_tower}-${unitParts.unit_lantai}-${unitParts.unit_nomor}`;
            return {
                id: u.id,
                ...unitParts,
                agent_email: u.agent_email,
                is_occupied: occupiedUnitsSet.has(unitString)
            };
        });
        res.json({ success: true, data: formattedUnits });
    } catch (error) {
        console.error("Error fetching all units:", error);
        res.status(500).json({ success: false, message: 'Gagal memuat semua unit.' });
    }
});

// Helper function to calculate duration
function calculateDays(checkin, checkout) {
    const d1 = new Date(checkin);
    const d2 = new Date(checkout);
    if (isNaN(d1) || isNaN(d2)) return 0;
    const diffTime = Math.max(0, d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// NEW ENDPOINT: Save a new rental record
app.post('/api/rentals', checkAuth, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const {
            nama, nik, status_pasutri, tower, lantai, unit, status_kewarganegaraan,
            jenis_sewa, metode_pembayaran, metode_lain, tanggal_checkin, waktu_checkin, tanggal_checkout
        } = req.body;

        const isAdmin = ADMIN_ROLES.includes(req.session.user.role);
        let agent_email = req.session.user.email;
        if (isAdmin && req.body.agent_email) {
            agent_email = req.body.agent_email;
        }

        const lama_menginap = calculateDays(tanggal_checkin, tanggal_checkout);

        const sql = `INSERT INTO rentals (
            nama, nik, status_pasutri, tower, lantai, unit, status_kewarganegaraan, 
            jenis_sewa, metode_pembayaran, metode_lain, tanggal_checkin, waktu_checkin, 
            tanggal_checkout, lama_menginap, email_agent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const params = [
            nama, nik, status_pasutri, tower, lantai, unit, status_kewarganegaraan,
            jenis_sewa, metode_pembayaran, metode_pembayaran === 'Others' ? metode_lain : null,
            tanggal_checkin, waktu_checkin, tanggal_checkout, lama_menginap, agent_email
        ];
        
        await conn.beginTransaction();
        const [result] = await conn.query(sql, params);
        const newRentalId = result.insertId;

        // Add creation event to logs
        const logQuery = `INSERT INTO rental_logs (action, field_changed, new_value, email, rental_id) VALUES ?`;
        const logEntries = [
            ['create', 'all', JSON.stringify(req.body), req.session.user.email, newRentalId]
        ];
        await conn.query(logQuery, [logEntries]);

        await conn.commit();
        res.json({ success: true, message: "Data penyewa berhasil disimpan." });

    } catch (error) {
        if(conn) await conn.rollback();
        console.error("Error saving rental:", error);
        res.status(500).json({ success: false, message: 'Gagal menyimpan data penyewa.' });
    } finally {
        if(conn) conn.release();
    }
});

// ================== ETC ==================
app.get('/api/pelanggaran-list', checkAuth, (req, res) => {
    const user = req.session.user;
    const listForAgen = [
        "Ditemukan alat suntik di tempat sampah", "Ditemukan kondom dalam jumlah banyak",
        "Kerusakan parah pada fasilitas", "Kebisingan berlebihan di malam hari",
        "Penyalahgunaan alkohol/narkoba", "Kekerasan atau ancaman kepada penghuni lain",
        "Merokok di area terlarang", "Tidak menjaga kebersihan unit",
        "Terpantau adanya tamu yang keluar masuk pada malam hari", "Menyewakan kembali unit yang disewa",
    ];
    const listForAdmin = [
        ...listForAgen,
        "Agen memberlakukan sistem transit", "Agen lalai terhadap pelanggaran penyewa"
    ];

    if (ADMIN_ROLES.includes(user.role)) {
        res.json({ success: true, data: listForAdmin });
    } else {
        res.json({ success: true, data: listForAgen });
    }
});

// Fallback Route
app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Server Start
app.listen(port, () => {
    console.log(`✅ Server berjalan di http://localhost:${port}`);
});