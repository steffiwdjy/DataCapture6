-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 16 Okt 2025 pada 18.50
-- Versi server: 10.4.32-MariaDB
-- Versi PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `hotel_booking`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `agents`
--

CREATE TABLE `agents` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `rentals`
--

CREATE TABLE `rentals` (
  `id` int(11) NOT NULL,
  `nama` varchar(255) NOT NULL,
  `nik` varchar(20) DEFAULT NULL,
  `status_pasutri` enum('Menikah','Belum Menikah') DEFAULT NULL,
  `tower` varchar(10) DEFAULT NULL,
  `lantai` varchar(10) DEFAULT NULL,
  `unit` varchar(10) DEFAULT NULL,
  `status_kewarganegaraan` varchar(10) DEFAULT NULL,
  `jenis_sewa` enum('Harian','Mingguan','Bulanan') DEFAULT NULL,
  `metode_pembayaran` varchar(50) DEFAULT NULL,
  `metode_lain` varchar(50) DEFAULT NULL,
  `tanggal_checkin` date DEFAULT NULL,
  `waktu_checkin` time DEFAULT NULL,
  `tanggal_checkout` date DEFAULT NULL,
  `waktu_checkout` time DEFAULT NULL,
  `lama_menginap` int(11) DEFAULT NULL,
  `komentar` text DEFAULT NULL,
  `email_agent` varchar(255) DEFAULT NULL,
  `diedit_oleh` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `rental_logs`
--

CREATE TABLE `rental_logs` (
  `id` int(11) NOT NULL,
  `rental_id` int(11) DEFAULT NULL,
  `action` varchar(20) DEFAULT NULL,
  `field_changed` varchar(50) DEFAULT NULL,
  `old_value` text DEFAULT NULL,
  `new_value` text DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `time_stamp` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `units`
--

CREATE TABLE `units` (
  `id` int(11) NOT NULL,
  `unit_number` varchar(50) NOT NULL,
  `agent_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `users`
--

CREATE TABLE `users` (
  `email` varchar(255) NOT NULL,
  `password` text NOT NULL,
  `nib` varchar(13) DEFAULT NULL,
  `role` enum('ketua agen','p3srs','pkj','agen') NOT NULL DEFAULT 'agen',
  `agent_id` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `users`
--

INSERT INTO `users` (`email`, `password`, `nib`, `role`, `agent_id`, `created_at`) VALUES
('ketua_agen@gmail.com', '$2a$12$43IrtmmkEU6QXiJP9AVlc.5SQVLTSrG6kWTDg0Y0EyJBzdMX/KWru', '', 'ketua agen', NULL, '2025-10-04 18:25:32'),
('p3srs@gmail.com', '$2a$12$pd0wjRxHx9NzMAtGznOlre7oAZKrJgGsKMabk8VEkmSwA0vOGt6Xy', '', 'p3srs', NULL, '2025-10-04 18:40:28'),
('pkj@gmail.com', '$2a$12$1N5x3qJ0ojNC7hz7HOh2RujSBLrpI/WrM4Z05dLDsn97Hl1qUpzhq', '', 'pkj', NULL, '2025-10-04 18:40:28');

-- --------------------------------------------------------

--
-- Struktur dari tabel `violations`
--

CREATE TABLE `violations` (
  `id` int(11) NOT NULL,
  `rental_id` int(11) NOT NULL,
  `photo_url` varchar(255) DEFAULT NULL,
  `description` text NOT NULL,
  `uploaded_by` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `agents`
--
ALTER TABLE `agents`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indeks untuk tabel `rentals`
--
ALTER TABLE `rentals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `email_agent` (`email_agent`);

--
-- Indeks untuk tabel `rental_logs`
--
ALTER TABLE `rental_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `rental_id` (`rental_id`),
  ADD KEY `email` (`email`);

--
-- Indeks untuk tabel `units`
--
ALTER TABLE `units`
  ADD PRIMARY KEY (`id`),
  ADD KEY `agent_id` (`agent_id`);

--
-- Indeks untuk tabel `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`email`);

--
-- Indeks untuk tabel `violations`
--
ALTER TABLE `violations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `rental_id` (`rental_id`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `agents`
--
ALTER TABLE `agents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT untuk tabel `rentals`
--
ALTER TABLE `rentals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT untuk tabel `rental_logs`
--
ALTER TABLE `rental_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT untuk tabel `units`
--
ALTER TABLE `units`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT untuk tabel `violations`
--
ALTER TABLE `violations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `rentals`
--
ALTER TABLE `rentals`
  ADD CONSTRAINT `rentals_ibfk_1` FOREIGN KEY (`email_agent`) REFERENCES `users` (`email`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `rental_logs`
--
ALTER TABLE `rental_logs`
  ADD CONSTRAINT `rental_logs_ibfk_1` FOREIGN KEY (`rental_id`) REFERENCES `rentals` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `rental_logs_ibfk_2` FOREIGN KEY (`email`) REFERENCES `users` (`email`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `units`
--
ALTER TABLE `units`
  ADD CONSTRAINT `units_ibfk_1` FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `violations`
--
ALTER TABLE `violations`
  ADD CONSTRAINT `violations_ibfk_1` FOREIGN KEY (`rental_id`) REFERENCES `rentals` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
