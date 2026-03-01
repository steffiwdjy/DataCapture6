-- phpMyAdmin SQL Dump
-- version 5.1.1deb5ubuntu1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Waktu pembuatan: 01 Mar 2026 pada 14.26
-- Versi server: 8.0.44-0ubuntu0.22.04.1
-- Versi PHP: 8.4.15

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

--
-- Database: `srusun-webmember`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `Pengguna`
--

CREATE TABLE `Pengguna` (
  `pengguna_id` int NOT NULL,
  `kode_user` varchar(255) NOT NULL,
  `nama` varchar(255) NOT NULL,
  `no_unit` varchar(255) NOT NULL,
  `alamat` varchar(255) DEFAULT NULL,
  `no_telp` varchar(20) DEFAULT NULL,
  `email` varchar(200) DEFAULT NULL,
  `status` int DEFAULT '1',
  `is_ketentuan` tinyint(1) DEFAULT '0',
  `alasan_batal_ketentuan` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `Pengguna`
--

INSERT INTO `Pengguna` (`pengguna_id`, `kode_user`, `nama`, `no_unit`, `alamat`, `no_telp`, `email`, `status`, `is_ketentuan`, `alasan_batal_ketentuan`) VALUES
(1, 'ADMIN', 'Administrator', '000', 'Office', NULL, 'rafibintang26.rb@gmail.com', 1, 1, NULL),
(2, 'ADMIN', 'Melika Candra', 'B2027', 'Jl. Cipedes Tengah No.35', '6287825683722', 'melika.cwm@gmail.com', 1, 1, NULL),
(3, 'Gede Karya C0603', 'Gede Karya ', 'C0603', 'Jl. Cipedes Tengah No. 35', '6287823283500', 'gdkarya@gmail.com', 1, 1, NULL);

-- --------------------------------------------------------

--
-- Struktur dari tabel `pengguna_role`
--

CREATE TABLE `pengguna_role` (
  `pengguna_id` int NOT NULL,
  `role_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `pengguna_role`
--

INSERT INTO `pengguna_role` (`pengguna_id`, `role_id`) VALUES
(3, 1),
(3, 3),
(1, 5),
(2, 5);

-- --------------------------------------------------------

--
-- Struktur dari tabel `Role`
--

CREATE TABLE `Role` (
  `role_id` int NOT NULL,
  `nama` varchar(255) NOT NULL,
  `deskripsi` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `Role`
--

INSERT INTO `Role` (`role_id`, `nama`, `deskripsi`) VALUES
(1, 'Pengurus', NULL),
(2, 'Pengelola', NULL),
(3, 'Pemilik Unit', NULL),
(4, 'Pelaku Komersil', NULL),
(5, 'Admin', NULL);

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `Pengguna`
--
ALTER TABLE `Pengguna`
  ADD PRIMARY KEY (`pengguna_id`),
  ADD UNIQUE KEY `no_telp` (`no_telp`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indeks untuk tabel `pengguna_role`
--
ALTER TABLE `pengguna_role`
  ADD PRIMARY KEY (`pengguna_id`,`role_id`),
  ADD KEY `role_id` (`role_id`);

--
-- Indeks untuk tabel `Role`
--
ALTER TABLE `Role`
  ADD PRIMARY KEY (`role_id`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `Pengguna`
--
ALTER TABLE `Pengguna`
  MODIFY `pengguna_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT untuk tabel `Role`
--
ALTER TABLE `Role`
  MODIFY `role_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `pengguna_role`
--
ALTER TABLE `pengguna_role`
  ADD CONSTRAINT `pengguna_role_ibfk_1` FOREIGN KEY (`pengguna_id`) REFERENCES `Pengguna` (`pengguna_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `pengguna_role_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `Role` (`role_id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;
