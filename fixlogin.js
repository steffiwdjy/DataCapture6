const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');
const start = code.indexOf("app.post('/api/login',");
const end = code.indexOf("app.post('/api/logout',");

if (start > -1 && end > -1) {
  const newLogin = `app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Email tidak ditemukan.' });
    }
    const user = rows[0];
    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Password salah.' });
    }
    const roles = [user.role];
    const payload = { id: user.id, email: user.email, nama: user.name, nib: user.nib, roles };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
    res.json({ success: true, token, user: payload });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

app.post('/api/register', async (req, res) => {
  const { name, email, password, nib } = req.body;
  if (!email || !password || !nib || !name) {
    return res.status(400).json({ success: false, message: 'Semua kolom harus diisi.' });
  }
  if (nib.length !== 13) {
    return res.status(400).json({ success: false, message: 'NIB harus 13 digit.' });
  }
  try {
    const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email sudah terdaftar.' });
    }
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (email, password, nib, role, name) VALUES (?, ?, ?, ?, ?)', [email, hashedPassword, nib, 'agen', name]);
    res.json({ success: true, message: 'Registrasi berhasil, silakan login.' });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

`;
  code = code.slice(0, start) + newLogin + code.slice(end);
  fs.writeFileSync('app.js', code);
  console.log('Replaced');
} else {
  console.log('Not found');
}