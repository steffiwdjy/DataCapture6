SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- CREATE TABLE IF NOT EXISTS `Pengguna` (
--   `id` int(11) NOT NULL,
--   `kode_user` varchar(255) NOT NULL,
--   `nama` varchar(255) NOT NULL,
--   `no_unit` varchar(255) NOT NULL,
--   `alamat` varchar(255) DEFAULT NULL,
--   `no_telp` varchar(20) DEFAULT NULL,
--   `email` varchar(200) DEFAULT NULL,
--   `status` int DEFAULT '1',
--   `is_ketentuan` tinyint(1) DEFAULT '0',
--   `alasan_batal_ketentuan` varchar(255) DEFAULT NULL
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- CREATE TABLE IF NOT EXISTS `role` (
--   `id` int(11) NOT NULL,
--   `nama` varchar(100) NOT NULL,
--   `deskripsi` text DEFAULT NULL
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- INSERT INTO `role` (`id`, `nama`, `deskripsi`) VALUES
-- (1, 'ketua agen', NULL),
-- (2, 'agen', NULL),
-- (3, 'p3srs', NULL),
-- (4, 'pkj', NULL);

-- CREATE TABLE IF NOT EXISTS `pengguna_role` (
--   `user_id` int(11) NOT NULL,
--   `role_id` int(11) NOT NULL
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `violations`;
DROP TABLE IF EXISTS `rental_logs`;
DROP TABLE IF EXISTS `rentals`;
DROP TABLE IF EXISTS `units`;

CREATE TABLE IF NOT EXISTS `units` (
  `unit_number` varchar(10) NOT NULL,
  `user_email` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `tower` varchar(2) DEFAULT NULL,
  `lantai` int(11) DEFAULT NULL,
  `unit` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `rentals` (
  `id` int(11) NOT NULL,
  `nama` varchar(100) NOT NULL,
  `nik` varchar(16) NOT NULL,
  `status_pasutri` enum('Menikah','Belum Menikah') NOT NULL,
  `status_kewarganegaraan` enum('WNI','WNA') NOT NULL,
  `jenis_sewa` enum('Bulanan','Mingguan','Harian') NOT NULL,
  `unit_number` varchar(10) NOT NULL,
  `metode_pembayaran` enum('Cash','Kartu Kredit','Kartu Debit','QRIS','Others') NOT NULL,
  `metode_lain` varchar(100) DEFAULT NULL,
  `tanggal_checkin` date NOT NULL,
  `waktu_checkin` time NOT NULL,
  `tanggal_checkout` date NOT NULL,
  `waktu_checkout` time DEFAULT NULL,
  `lama_menginap` int(11) NOT NULL,
  `komentar` text DEFAULT NULL,
  `user_email` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `diedit_oleh` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `classification` enum('normal','tidak normal') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `rental_logs` (
  `id` int(11) NOT NULL,
  `rental_id` int(11) NOT NULL,
  `action` enum('create','update') NOT NULL,
  `field_changed` varchar(50) DEFAULT NULL,
  `old_value` text DEFAULT NULL,
  `new_value` text DEFAULT NULL,
  `email` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `violations` (
  `id` int(11) NOT NULL,
  `rental_id` int(11) NOT NULL,
  `photo_url` varchar(1000) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `uploaded_by` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ALTER TABLE `Pengguna`
--   ADD PRIMARY KEY (`id`),
--   ADD UNIQUE KEY `no_telp` (`no_telp`),
--   ADD UNIQUE KEY `email` (`email`);

-- ALTER TABLE `role`
--   ADD PRIMARY KEY (`id`);

    -- ALTER TABLE `pengguna_role`
    --   ADD PRIMARY KEY (`user_id`, `role_id`),
    --   ADD KEY `role_id` (`role_id`);

ALTER TABLE `units`
  ADD PRIMARY KEY (`unit_number`),
  ADD KEY `fk_units_pengguna` (`user_email`);

ALTER TABLE `rentals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_rentals_unit` (`unit_number`),
  ADD KEY `fk_rentals_pengguna` (`user_email`),
  ADD KEY `fk_rentals_editor` (`diedit_oleh`);

ALTER TABLE `rental_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_logs_rental` (`rental_id`),
  ADD KEY `fk_logs_pengguna` (`email`);

ALTER TABLE `violations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_violations_rental` (`rental_id`),
  ADD KEY `fk_violations_pengguna` (`uploaded_by`);

-- ALTER TABLE `Pengguna`
--   MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

-- ALTER TABLE `role`
--   MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

ALTER TABLE `rentals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `rental_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `violations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

-- ALTER TABLE `pengguna_role`
--   ADD CONSTRAINT `fk_pengguna_role_pengguna` FOREIGN KEY (`user_id`) REFERENCES `Pengguna` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
--   ADD CONSTRAINT `fk_pengguna_role_role` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `units`
  ADD CONSTRAINT `fk_units_pengguna` FOREIGN KEY (`user_email`) REFERENCES `Pengguna` (`email`) ON DELETE CASCADE;

ALTER TABLE `rentals`
  ADD CONSTRAINT `fk_rentals_editor` FOREIGN KEY (`diedit_oleh`) REFERENCES `Pengguna` (`email`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_rentals_unit` FOREIGN KEY (`unit_number`) REFERENCES `units` (`unit_number`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_rentals_pengguna` FOREIGN KEY (`user_email`) REFERENCES `Pengguna` (`email`) ON DELETE CASCADE;

ALTER TABLE `rental_logs`
  ADD CONSTRAINT `fk_logs_rental` FOREIGN KEY (`rental_id`) REFERENCES `rentals` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_logs_pengguna` FOREIGN KEY (`email`) REFERENCES `Pengguna` (`email`) ON DELETE CASCADE;

ALTER TABLE `violations`
  ADD CONSTRAINT `fk_violations_rental` FOREIGN KEY (`rental_id`) REFERENCES `rentals` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_violations_pengguna` FOREIGN KEY (`uploaded_by`) REFERENCES `Pengguna` (`email`) ON DELETE CASCADE;

COMMIT;
