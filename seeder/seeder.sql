SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS violations;
DROP TABLE IF EXISTS rental_logs;
DROP TABLE IF EXISTS rentals;
DROP TABLE IF EXISTS units;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password TEXT NOT NULL,
    nib VARCHAR(13) NULL,
    role ENUM('Pengelola','agen','PelakuKomersil') NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Units Table
CREATE TABLE units (
    id INT AUTO_INCREMENT PRIMARY KEY,
    unit_number VARCHAR(10) NOT NULL UNIQUE, 
    user_email VARCHAR(255) NOT NULL,
    tower VARCHAR(2),
    lantai INT,
    unit INT,
    CONSTRAINT fk_units_user FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
);

-- 3. Rentals Table
CREATE TABLE rentals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    nik VARCHAR(16) NOT NULL,
    status_pasutri ENUM('Menikah','Belum Menikah') NOT NULL,
    status_kewarganegaraan ENUM('WNI','WNA') NOT NULL,
    jenis_sewa ENUM('Bulanan','Mingguan','Harian') NOT NULL,
    
    -- NEW: Link to Unit
    unit_id INT NOT NULL, 

    metode_pembayaran ENUM('Cash','Kartu Kredit','Kartu Debit','QRIS','Others') NOT NULL,
    metode_lain VARCHAR(100) NULL,
    tanggal_checkin DATE NOT NULL,
    waktu_checkin TIME NOT NULL,
    tanggal_checkout DATE NOT NULL,
    waktu_checkout TIME NOT NULL,
    lama_menginap INT NOT NULL, 
    komentar TEXT NULL,
    user_email VARCHAR(255) NOT NULL, 
    diedit_oleh VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    classification ENUM('normal','tidak normal'),
    
    -- CONSTRAINTS
    CONSTRAINT fk_rentals_unit FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
    CONSTRAINT fk_rentals_user FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE,
    CONSTRAINT fk_rentals_editor FOREIGN KEY (diedit_oleh) REFERENCES users(email) ON DELETE SET NULL
);

-- 4. Rental Logs Table
CREATE TABLE rental_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rental_id INT NOT NULL,
    action ENUM('create','update') NOT NULL,
    field_changed VARCHAR(50) NULL,
    old_value JSON NULL,
    new_value JSON NULL,
    email VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_logs_rental FOREIGN KEY (rental_id) REFERENCES rentals(id) ON DELETE CASCADE,
    CONSTRAINT fk_logs_user FOREIGN KEY (email) REFERENCES users(email) ON DELETE CASCADE
);

-- 5. Violations Table
CREATE TABLE violations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rental_id INT NOT NULL,
    photo_url VARCHAR(1000),
    description TEXT,
    uploaded_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_violations_rental FOREIGN KEY (rental_id) REFERENCES rentals(id) ON DELETE CASCADE,
    CONSTRAINT fk_violations_user FOREIGN KEY (uploaded_by) REFERENCES users(email) ON DELETE CASCADE
);