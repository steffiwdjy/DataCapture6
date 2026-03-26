const crypto = require("crypto");

// Fungsi untuk menghasilkan OTP berdasarkan identifier pengguna (email atau noTelp)
function generateOtp(identifier) {
  const secret = "jarrdin-secret-key"; // Gunakan string rahasia untuk menambah keamanan
  const currentTime = Date.now(); // Dapatkan waktu saat ini dalam milidetik

  // Gabungkan identifier (email/noTelp) dengan secret dan waktu saat ini untuk membuat string unik
  const dataToHash = `${identifier}${secret}${currentTime}`;

  // Buat hash menggunakan algoritma SHA-256 untuk menghasilkan string acak berdasarkan data di atas
  const hash = crypto.createHash("sha256").update(dataToHash).digest("hex");

  // Ekstrak 6 digit pertama dari hasil hash sebagai OTP
  const otp = parseInt(hash.substring(0, 6), 16) % 1000000;

  // Tambahkan nol di depan jika OTP kurang dari 6 digit agar selalu 6 digit
  return otp.toString().padStart(6, "0");
}

module.exports = { generateOtp };
