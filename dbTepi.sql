-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 01 Mar 2026 pada 15.13
-- Versi server: 10.4.32-MariaDB
-- Versi PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

--
-- Database: `hotel_booking_2`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `rentals`
--

CREATE TABLE `rentals` (
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
  `user_email` varchar(255) NOT NULL,
  `diedit_oleh` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `classification` enum('normal','tidak normal') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `rental_logs`
--

CREATE TABLE `rental_logs` (
  `id` int(11) NOT NULL,
  `rental_id` int(11) NOT NULL,
  `action` enum('create','update') NOT NULL,
  `field_changed` varchar(50) DEFAULT NULL,
  `old_value` text DEFAULT NULL,
  `new_value` text DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `units`
--

CREATE TABLE `units` (
  `unit_number` varchar(10) NOT NULL,
  `user_email` varchar(255) NOT NULL,
  `tower` varchar(2) DEFAULT NULL,
  `lantai` int(11) DEFAULT NULL,
  `unit` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` text NOT NULL,
  `nib` varchar(13) DEFAULT NULL,
  `role` enum('ketua agen','agen','p3srs','pkj') NOT NULL,
  `name` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `violations`
--

CREATE TABLE `violations` (
  `id` int(11) NOT NULL,
  `rental_id` int(11) NOT NULL,
  `photo_url` varchar(1000) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `uploaded_by` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `rentals`
--
ALTER TABLE `rentals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_rentals_unit` (`unit_number`),
  ADD KEY `fk_rentals_user` (`user_email`),
  ADD KEY `fk_rentals_editor` (`diedit_oleh`);

--
-- Indeks untuk tabel `rental_logs`
--
ALTER TABLE `rental_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_logs_rental` (`rental_id`),
  ADD KEY `fk_logs_user` (`email`);

--
-- Indeks untuk tabel `units`
--
ALTER TABLE `units`
  ADD PRIMARY KEY (`unit_number`),
  ADD KEY `fk_units_user` (`user_email`);

--
-- Indeks untuk tabel `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indeks untuk tabel `violations`
--
ALTER TABLE `violations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_violations_rental` (`rental_id`),
  ADD KEY `fk_violations_user` (`uploaded_by`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `rentals`
--
ALTER TABLE `rentals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `rental_logs`
--
ALTER TABLE `rental_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `violations`
--
ALTER TABLE `violations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `rentals`
--
ALTER TABLE `rentals`
  ADD CONSTRAINT `fk_rentals_editor` FOREIGN KEY (`diedit_oleh`) REFERENCES `users` (`email`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_rentals_unit` FOREIGN KEY (`unit_number`) REFERENCES `units` (`unit_number`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_rentals_user` FOREIGN KEY (`user_email`) REFERENCES `users` (`email`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `rental_logs`
--
ALTER TABLE `rental_logs`
  ADD CONSTRAINT `fk_logs_rental` FOREIGN KEY (`rental_id`) REFERENCES `rentals` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_logs_user` FOREIGN KEY (`email`) REFERENCES `users` (`email`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `units`
--
ALTER TABLE `units`
  ADD CONSTRAINT `fk_units_user` FOREIGN KEY (`user_email`) REFERENCES `users` (`email`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `violations`
--
ALTER TABLE `violations`
  ADD CONSTRAINT `fk_violations_rental` FOREIGN KEY (`rental_id`) REFERENCES `rentals` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_violations_user` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`email`) ON DELETE CASCADE;
COMMIT;
