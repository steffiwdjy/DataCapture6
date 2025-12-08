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
    role ENUM('ketua agen','agen','p3srs','pkj') NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Units Table
CREATE TABLE units (
    unit_number VARCHAR(10) NOT NULL UNIQUE PRIMARY KEY, 
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
    
    -- Link to Unit
    unit_number VARCHAR(10) NOT NULL, 

    metode_pembayaran ENUM('Cash','Kartu Kredit','Kartu Debit','QRIS','Others') NOT NULL,
    metode_lain VARCHAR(100) NULL,
    tanggal_checkin DATE NOT NULL,
    waktu_checkin TIME NOT NULL,
    tanggal_checkout DATE NOT NULL,
    waktu_checkout TIME NULL,
    lama_menginap INT NOT NULL, 
    komentar TEXT NULL,
    user_email VARCHAR(255) NOT NULL, 
    diedit_oleh VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    classification ENUM('normal','tidak normal'),
    
    -- CONSTRAINTS
    CONSTRAINT fk_rentals_unit FOREIGN KEY (unit_number) REFERENCES units(unit_number) ON DELETE CASCADE,
    CONSTRAINT fk_rentals_user FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE,
    CONSTRAINT fk_rentals_editor FOREIGN KEY (diedit_oleh) REFERENCES users(email) ON DELETE SET NULL
);

-- 4. Rental Logs Table
CREATE TABLE rental_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rental_id INT NOT NULL,
    action ENUM('create','update') NOT NULL,
    field_changed VARCHAR(50) NULL,
    -- JSON Data Types
    old_value text NULL,
    new_value text NULL,
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