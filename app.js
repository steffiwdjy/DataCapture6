// // package.json dependencies needed:
// // npm install express mysql2 dotenv path body-parser cors multer json2csv jsonwebtoken

const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const { Parser } = require('json2csv');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'jwt-secret-key-jarrdin';
const SRUSUN_JWT_SECRET = process.env.SRUSUN_JWT_SECRET || 'jarrdin-cihampelas';

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
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;
  if (!token) {
    return res.status(401).json({ success: false, message: "Akses ditolak. Silakan login." });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (_) {
    try {
      decoded = jwt.verify(token, SRUSUN_JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: "Token tidak valid. Silakan login ulang." });
    }
  }

  // Normalize: SRusun JWT has UserID + Role (array of objects); Data Capture JWT has id + roles (array of strings)
  if (decoded.UserID !== undefined && Array.isArray(decoded.Role)) {
    req.user = {
      id: decoded.UserID,
      nama: decoded.Nama,
      email: decoded.Email,
      no_telp: decoded.NoTelp,
      roles: decoded.Role.map(r => r.Nama),
      fitur: decoded.Fitur || [],
      _source: 'srusun'
    };
  } else {
    req.user = decoded;
  }
  return next();
};

// SRusun roles: 'Pengelola' has admin access, 'Pelaku Komersil' has regular access
const ADMIN_ROLES = ['Pengelola'];
const isAdmin = (user) => user && user.roles && user.roles.some(r => ADMIN_ROLES.includes(r));
const checkAdmin = (req, res, next) => {
  if (!isAdmin(req.user)) {
    return res.status(403).json({ success: false, message: "Akses ditolak. Fitur ini hanya untuk admin." });
  }
  next();
};

// ================== AUTHENTICATION ==================
app.post('/api/login', async (req, res) => {
  const { email } = req.body;
  try {
    const [rows] = await pool.query(`
      SELECT p.*, GROUP_CONCAT(r.nama) as role_names
      FROM pengguna p
      LEFT JOIN pengguna_role pr ON p.id = pr.user_id
      LEFT JOIN role r ON pr.role_id = r.id
      WHERE p.email = ?
      GROUP BY p.id
    `, [email]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: "Email tidak ditemukan." });
    }
    const pengguna = rows[0];
    const roles = pengguna.role_names ? pengguna.role_names.split(',') : [];
    const payload = { id: pengguna.id, email: pengguna.email, nama: pengguna.nama, no_unit: pengguna.no_unit, kode_user: pengguna.kode_user, roles };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
    res.json({ success: true, token, user: payload });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

app.post('/api/logout', (req, res) => {
  res.json({ success: true });
});

app.get('/api/user', checkAuth, (req, res) => {
  res.json({ user: req.user });
});


// ================== RENTALS DATA ==================
app.get('/api/rentals', checkAuth, async (req, res) => {
  try {
    // PAGINATION & FILTER LOGIC
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const hasCommentFilter = req.query.commentFilter === 'true';
    const offset = (page - 1) * limit;

    const user = req.user;
    let whereClauses = [];
    let params = [];

    // Filter berdasarkan Role
    if (!isAdmin(user)) {
      whereClauses.push('r.user_email = ?');
      params.push(user.email);
    }

    // Filter berdasarkan Komentar (jika ada)
    if (hasCommentFilter) {
      whereClauses.push("(r.komentar IS NOT NULL AND r.komentar != '[]' AND r.komentar != '')");
    }

    const whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    // --- Query 1: Menghitung Total Item ---
    const countQuery = `SELECT COUNT(*) as totalItems FROM rentals r ${whereSql}`;
    const [countRows] = await pool.query(countQuery, params);
    const totalItems = countRows[0].totalItems;
    const totalPages = Math.ceil(totalItems / limit);

    // --- Query 2: Mengambil Data untuk Halaman Ini ---
    const logSubQuery = `(SELECT GROUP_CONCAT(
            JSON_OBJECT(
                'action', l.action, 'field_changed', l.field_changed, 'old_value', l.old_value,
                'new_value', l.new_value, 'email', l.email, 'timestamp', l.timestamp
            ) SEPARATOR '|||'
        ) FROM rental_logs l WHERE l.rental_id = r.id) as logs_json`;

    const dataQuery = `
            SELECT r.*, u.tower, u.lantai, u.unit, r.user_email as user_email, ${logSubQuery}
            FROM rentals r
            LEFT JOIN units u ON r.unit_number = u.unit_number
            ${whereSql}
            ORDER BY r.created_at DESC
            LIMIT ? OFFSET ?
        `;

    // Tambahkan parameter limit dan offset ke params
    const dataParams = [...params, limit, offset];
    await pool.query('SET SESSION group_concat_max_len = 1000000');
    const [rows] = await pool.query(dataQuery, dataParams);
    rows.forEach(r => {
      r.status_pasutri = r.status_pasutri === 'Ya' ? 'Ya' : 'Belum Menikah';
      try {
        r.komentar = JSON.parse(r.komentar || '[]');
      } catch (e) {
        r.komentar = r.komentar ? [r.komentar] : [];
      }
      if (r.logs_json) {
        r.logs = r.logs_json.split('|||').map(logStr => {
          try {
            return JSON.parse(logStr);
          } catch (e) {
            console.log(r)
            console.log("Offending log string:", logStr);
            console.log("Offending log string:", r.logs_json);
            return { action: "invalid_log", error: "Invalid JSON" };
          }
        }).sort((a, b) => {
          if (!a.timestamp || !b.timestamp) return 0;
          return new Date(b.timestamp) - new Date(a.timestamp);
        });
      } else {
        r.logs = [];
      }
      delete r.logs_json;
    });

    // Kirim Respon Terstruktur Baru 
    res.json({
      success: true,
      data: rows,
      pagination: {
        page: page,
        limit: limit,
        totalItems: totalItems,
        totalPages: totalPages
      }
    });


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

    const [oldDataRows] = await conn.query(`
            SELECT r.*, u.* FROM rentals r LEFT JOIN units u ON r.unit_number = u.unit_number WHERE r.id = ?
            `, [id]);
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

      if (String(oldValue) !== String(newData[key])) {
        changedFields[key] = newData[key];
        logEntries.push(['update', key, String(oldValue), String(newData[key]), req.user.email, id]);
      }
    });

    if (Object.keys(changedFields).length > 0) {
      changedFields.diedit_oleh = req.user.email;
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
    if (conn) await conn.rollback();
    if (conn) conn.release();
    console.error("Error updating rental:", error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui data.' });
  }
});

app.get('/api/rentals/duplicates', checkAdmin, async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const innerQuery = `(SELECT nik FROM rentals WHERE nik IS NOT NULL AND nik != '' GROUP BY nik HAVING COUNT(*) > 1) r2`;

    // --- Query 1: Menghitung Total Item ---
    const countQuery = `SELECT COUNT(DISTINCT r1.id) as totalItems FROM rentals r1 INNER JOIN ${innerQuery} ON r1.nik = r2.nik`;
    const [countRows] = await pool.query(countQuery);
    const totalItems = countRows[0].totalItems;
    const totalPages = Math.ceil(totalItems / limit);

    // --- Query 2: Mengambil Data ---
    const dataQuery = `
            SELECT r1.* FROM rentals r1
            INNER JOIN ${innerQuery} ON r1.nik = r2.nik
            ORDER BY r1.nik, r1.created_at DESC
            LIMIT ? OFFSET ?
        `;
    const [rows] = await pool.query(dataQuery, [limit, offset]);


    rows.forEach(r => r.komentar = JSON.parse(r.komentar || '[]'));

    // Kirim Respon Terstruktur Baru 
    res.json({
      success: true,
      data: rows,
      pagination: {
        page: page,
        limit: limit,
        totalItems: totalItems,
        totalPages: totalPages
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal cek data duplikat.' });
  }
});


// ================== CSV DOWNLOAD ENDPOINTS ==================

// --- 1. DOWNLOAD RENTAL DATA (All Roles) ---
app.get('/api/rentals/csv', checkAuth, async (req, res) => {
  try {
    const user = req.user;
    let query = 'SELECT r.*, u.tower, u.lantai, u.unit, r.user_email as user_email FROM rentals r LEFT JOIN units u ON r.unit_number = u.unit_number';
    const params = [];

    if (!isAdmin(user)) {
      query += ' WHERE r.user_email = ?';
      params.push(user.email);
    }
    query += ' ORDER BY r.created_at DESC';
    const [rows] = await pool.query(query, params);

    const fields = ['id', 'nama', 'nik', 'status_pasutri', 'status_kewarganegaraan', 'tower', 'lantai', 'unit', 'jenis_sewa', 'metode_pembayaran', 'metode_lain', 'tanggal_checkin', 'waktu_checkin', 'tanggal_checkout', 'waktu_checkout', 'lama_menginap', 'user_email', 'diedit_oleh', 'created_at'];
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
    const user = req.user;
    let query = `
            SELECT 
                l.id, l.timestamp, l.email, r.nama as nama_penyewa, CONCAT(u.tower, '-', u.lantai, '-', u.unit) as unit,
                l.action, l.field_changed, l.old_value, l.new_value
            FROM rental_logs l
            LEFT JOIN rentals r ON l.rental_id = r.id
            LEFT JOIN units u ON r.unit_number = u.unit_number
        `;
    const params = [];

    if (!isAdmin(user)) {
      query += ' WHERE r.user_email = ?';
      params.push(user.email);
    }

    query += ' ORDER BY l.timestamp DESC';

    const [logs] = await pool.query(query, params);

    const fields = ['id', 'timestamp', 'email', 'nama_penyewa', 'unit', 'action', 'field_changed', 'old_value', 'new_value'];
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

    const [rentalInfo] = await pool.query('SELECT r.nama, CONCAT(u.tower, \'-\', u.lantai, \'-\', u.unit) as unit FROM rentals r LEFT JOIN units u ON r.unit_number = u.unit_number WHERE r.id = ?', [id]);
    if (rentalInfo.length === 0) return res.status(404).send('Data penyewa tidak ditemukan.');

    const { nama, unit } = rentalInfo[0];
    const safeFilename = `log-${nama.replace(/[^a-zA-Z0-9]/g, '_')}-unit_${unit}.csv`;

    const [logs] = await pool.query('SELECT * FROM rental_logs WHERE rental_id = ? ORDER BY timestamp DESC', [id]);
    const fields = ['timestamp', 'email', 'action', 'field_changed', 'old_value', 'new_value'];
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
  const user = req.user;

  let groupBy = "DATE_FORMAT(tanggal_checkin, '%Y-%m-%d')"; // Daily for weekly
  let dateFilter = 'WHERE tanggal_checkin >= DATE_SUB(NOW(), INTERVAL 7 DAY)';

  if (filter === 'monthly') {
    dateFilter = 'WHERE tanggal_checkin >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
  } else if (filter === 'all') {
    groupBy = "DATE_FORMAT(tanggal_checkin, '%Y-%m')"; // Monthly for all-time
    dateFilter = '';
  }

  let query = `
        SELECT ${groupBy} as period, COUNT(*) as count 
        FROM rentals 
        ${dateFilter}
    `;
  const params = [];

  if (!isAdmin(user)) {
    query += ` ${dateFilter ? 'AND' : 'WHERE'} user_email = ?`;
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
  const user = req.user;

  let dateFilter = '';
  if (filter === 'weekly') {
    dateFilter = 'WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
  } else if (filter === 'monthly') {
    dateFilter = 'WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
  }

  let query = `
        SELECT 
            CONCAT(u.tower, '-', u.lantai, '-', u.unit) as unit_full, 
            r.user_email as user_email,
            COUNT(*) as rental_count 
        FROM rentals r
        LEFT JOIN units u ON r.unit_number = u.unit_number
        ${dateFilter}
    `;
  const params = [];

  if (!isAdmin(user)) {
    query += ` ${dateFilter ? 'AND' : 'WHERE'} r.user_email = ?`;
    params.push(user.email);
  }

  query += ` GROUP BY unit_full, r.user_email ORDER BY rental_count DESC LIMIT 5`;

  try {
    const [results] = await pool.query(query, params);
    const labels = results.map(r => r.unit_full);
    const data = results.map(r => r.rental_count);
    const agents = results.map(r => r.user_email); // For admin view
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
        SELECT user_email, COUNT(*) as total_rented 
        FROM rentals 
        ${dateFilter} 
        GROUP BY user_email 
        ORDER BY total_rented DESC
    `;

  try {
    const [stats] = await pool.query(query);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error("Agent Performance Error:", error);
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
      [rental_id, description, photo_url, req.user.email]
    );
    res.json({ success: true, message: 'Laporan pelanggaran berhasil diupload.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal upload laporan.' });
  }
});


app.get('/api/dashboard/violations', checkAuth, async (req, res) => {
  try {
    const user = req.user;
    const userIsAdmin = isAdmin(user);

    const uploadedByField = userIsAdmin ? 'v.uploaded_by' : "'' as uploaded_by";

    const query = `SELECT v.id, v.description, v.photo_url, v.created_at, r.nama, CONCAT(u.tower, '-', u.lantai, '-', u.unit) as unit, ${uploadedByField}
            FROM violations v 
            JOIN rentals r ON v.rental_id = r.id 
            LEFT JOIN units u ON r.unit_number = u.unit_number
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
    const [occupied] = await pool.query(
      `SELECT DISTINCT unit_number 
      FROM rentals 
      WHERE tanggal_checkout >= CURDATE()`
    );
    return new Set(occupied.map(r => r.unit_number));
  } catch (error) {
    console.error("Error fetching occupied units:", error);
    return new Set();
  }
}



async function getAgentIdByEmail(email) {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query("SELECT id FROM pengguna WHERE email = ?", [email]);
    return rows.length > 0 ? rows[0].id : null;
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

app.get('/api/agents', checkAdmin, async (req, res) => {
  try {
    const [agents] = await pool.query(`
      SELECT p.email FROM pengguna p
      INNER JOIN pengguna_role pr ON p.id = pr.user_id
      INNER JOIN role r ON pr.role_id = r.id
      WHERE r.nama = 'agen'
      ORDER BY p.email
    `);
    res.json({ success: true, data: agents });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memuat daftar agen.' });
  }
});

app.get('/api/units/:agentEmail', checkAdmin, async (req, res) => {
  try {
    const agentEmail = decodeURIComponent(req.params.agentEmail);

    const [units] = await pool.query("SELECT unit_number as id, unit_number FROM units WHERE user_email = ?", [agentEmail]);
    const formattedUnits = units.map(u => ({ id: u.id, unit_number: u.unit_number, ...parseUnitNumber(u.unit_number) }));
    res.json({ success: true, data: formattedUnits });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memuat unit agen.' });
  }
});

app.get('/api/units', checkAuth, async (req, res) => {
  try {
    const [units] = await pool.query(
      `SELECT unit_number as unit_id,unit_number, tower, lantai, unit as nomor_unit, null as kode 
             FROM units ORDER BY tower, lantai, unit`
    );

    const occupiedSet = await getOccupiedUnits();

    const data = units.map(u => {
      const unitString = `${u.tower}-${u.lantai}-${u.nomor_unit}`;
      return {
        ...u,
        status: occupiedSet.has(unitString) ? 'Occupied' : 'Available'
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error("Error loading units:", error);
    res.status(500).json({ success: false, message: "Gagal memuat unit." });
  }
});


app.post('/api/units', checkAdmin, async (req, res) => {
  const { unit_tower, unit_lantai, unit_nomor, agent_email } = req.body;

  if (!unit_tower || !unit_lantai || !unit_nomor || !agent_email) {
    return res.status(400).json({ success: false, message: "Data unit tidak lengkap." });
  }

  try {
    const unit_number = `${unit_tower}-${unit_lantai}-${unit_nomor}`;
    await pool.query(
      `INSERT INTO units (unit_number, user_email, tower, lantai, unit) VALUES (?, ?, ?, ?, ?)`,
      [unit_number, agent_email, unit_tower, unit_lantai, unit_nomor]
    );
    res.json({ success: true, message: "Unit berhasil ditambahkan." });
  } catch (error) {
    console.error("Add Unit Error:", error);
    res.status(500).json({ success: false, message: "Gagal menambah unit." });
  }
});

app.put('/api/units/:id', checkAdmin, async (req, res) => {
  const { id } = req.params;
  const { tower, lantai, nomor_unit, kode } = req.body;

  try {
    const [result] = await pool.query(
      `UPDATE units SET tower = ?, lantai = ?, unit = ?, unit_number = ? WHERE unit_number = ?`,
      [tower, lantai, nomor_unit, `${tower}-${lantai}-${nomor_unit}`, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Unit tidak ditemukan." });
    }

    res.json({ success: true, message: "Unit berhasil diperbarui." });
  } catch (error) {
    console.error("Update Unit Error:", error);
    res.status(500).json({ success: false, message: "Gagal memperbarui unit." });
  }
});


app.delete('/api/units/:id', checkAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const [inUse] = await pool.query(
      `SELECT id FROM rentals 
             WHERE unit_number = (
                SELECT unit_number 
                FROM units WHERE unit_number = ?
             ) AND tanggal_checkout >= CURDATE()`,
      [id]
    );

    if (inUse.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Unit tidak dapat dihapus karena sedang digunakan."
      });
    }

    const [result] = await pool.query(`DELETE FROM units WHERE unit_number = ?`, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Unit tidak ditemukan." });
    }

    res.json({ success: true, message: "Unit berhasil dihapus." });
  } catch (error) {
    console.error("Delete Unit Error:", error);
    res.status(500).json({ success: false, message: "Gagal menghapus unit." });
  }
});


app.get('/api/my-units', checkAuth, async (req, res) => {
  try {
    const occupiedUnitsSet = await getOccupiedUnits();

    const [units] = await pool.query("SELECT unit_number as id, unit_number FROM units WHERE user_email = ?", [req.user.email]);
    const formattedUnits = units.map(u => {

      const unitParts = parseUnitNumber(u.unit_number);
      const unitString = `${unitParts.unit_tower}-${unitParts.unit_lantai}-${unitParts.unit_nomor}`;
      return {
        id: u.id,
        unit_number: u.unit_number,
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

    const query = 'SELECT u.unit_number as id, u.unit_number, u.user_email as agent_email ' +
      'FROM units u ' +
      'ORDER BY u.user_email, u.unit_number';

    const [units] = await pool.query(query);
    const formattedUnits = units.map(u => {
      const unitParts = parseUnitNumber(u.unit_number);
      const unitString = `${unitParts.unit_tower}-${unitParts.unit_lantai}-${unitParts.unit_nomor}`;
      return {
        id: u.id,
        unit_number: u.unit_number,
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
      nama, nik, status_pasutri, unit_number, status_kewarganegaraan,
      jenis_sewa, metode_pembayaran, metode_lain, tanggal_checkin, waktu_checkin, tanggal_checkout
    } = req.body;

    const userIsAdmin = isAdmin(req.user);
    let agent_email = req.user.email;
    if (userIsAdmin && req.body.agent_email) {
      agent_email = req.body.agent_email;
    }

    const lama_menginap = calculateDays(tanggal_checkin, tanggal_checkout);
    const db_status_pasutri = status_pasutri === 'Ya' ? 'Menikah' : 'Belum Menikah';

    const sql = `INSERT INTO rentals (
            nama, nik, status_pasutri, status_kewarganegaraan, 
            jenis_sewa, unit_number, metode_pembayaran, metode_lain, tanggal_checkin, waktu_checkin, 
            tanggal_checkout, lama_menginap, user_email
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
      nama, nik, db_status_pasutri, status_kewarganegaraan,
      jenis_sewa, unit_number, metode_pembayaran, metode_pembayaran === 'Others' ? metode_lain : null,
      tanggal_checkin, waktu_checkin, tanggal_checkout, lama_menginap, agent_email
    ];

    await conn.beginTransaction();
    const [result] = await conn.query(sql, params);
    const newRentalId = result.insertId;

    // Add creation event to logs
    const logQuery = `INSERT INTO rental_logs (action, field_changed, new_value, email, rental_id) VALUES ?`;
    const logEntries = [
      ['create', 'all', JSON.stringify(req.body), req.user.email, newRentalId]
    ];
    await conn.query(logQuery, [logEntries]);

    await conn.commit();
    res.json({ success: true, message: "Data penyewa berhasil disimpan." });

  } catch (error) {
    if (conn) await conn.rollback();
    console.error("Error saving rental:", error);
    res.status(500).json({ success: false, message: 'Gagal menyimpan data penyewa.' });
  } finally {
    if (conn) conn.release();
  }
});

// ================== ETC ==================
app.get('/api/pelanggaran-list', checkAuth, (req, res) => {
  const user = req.user;
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

  if (isAdmin(user)) {
    res.json({ success: true, data: listForAdmin });
  } else {
    res.json({ success: true, data: listForAgen });
  }
});

// Login page (served separately to avoid redirect loop)
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Fallback Route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Server Start
app.listen(port, () => {
  console.log(`✅ Server berjalan di http://localhost:${port}`);
});