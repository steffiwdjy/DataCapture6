-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 04, 2025 at 09:44 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

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
-- Table structure for table `rentals`
--

CREATE TABLE `rentals` (
  `id` int(11) NOT NULL,
  `nama` varchar(255) DEFAULT NULL,
  `tower` varchar(10) DEFAULT NULL,
  `lantai` varchar(10) DEFAULT NULL,
  `unit` varchar(10) DEFAULT NULL,
  `status_kewarganegaraan` varchar(10) DEFAULT NULL,
  `metode_pembayaran` varchar(50) DEFAULT NULL,
  `metode_lain` varchar(50) DEFAULT NULL,
  `tanggal_checkin` date DEFAULT NULL,
  `waktu_checkin` time DEFAULT NULL,
  `tanggal_checkout` date DEFAULT NULL,
  `waktu_checkout` time DEFAULT NULL,
  `lama_menginap` int(11) DEFAULT NULL,
  `komentar` text DEFAULT NULL,
  `email_agent` varchar(255) DEFAULT NULL,
  `diedit_oleh` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `rental_logs`
--

CREATE TABLE `rental_logs` (
  `id` int(11) NOT NULL,
  `rental_id` int(11) NOT NULL,
  `action` varchar(20) DEFAULT NULL,
  `field_changed` varchar(50) DEFAULT NULL,
  `old_value` text DEFAULT NULL,
  `new_value` text DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `time_stamp` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `email` varchar(255) NOT NULL,
  `password` text DEFAULT NULL,
  `nib` varchar(13) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`email`, `password`, `nib`) VALUES
('steffiwidjaya01@gmail.com', '$2a$10$o8k3V7RT0Yd2DNj5.YZVyelEBYENz/Z9OGcCPXqgOnldGmzNxr5hy', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `rentals`
--
ALTER TABLE `rentals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `email_agent` (`email_agent`),
  ADD KEY `diedit_oleh` (`diedit_oleh`);

--
-- Indexes for table `rental_logs`
--
ALTER TABLE `rental_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `rental_id` (`rental_id`),
  ADD KEY `email` (`email`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `rentals`
--
ALTER TABLE `rentals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `rental_logs`
--
ALTER TABLE `rental_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `rentals`
--
ALTER TABLE `rentals`
  ADD CONSTRAINT `rentals_ibfk_1` FOREIGN KEY (`email_agent`) REFERENCES `users` (`email`),
  ADD CONSTRAINT `rentals_ibfk_2` FOREIGN KEY (`diedit_oleh`) REFERENCES `users` (`email`);

--
-- Constraints for table `rental_logs`
--
ALTER TABLE `rental_logs`
  ADD CONSTRAINT `rental_logs_ibfk_1` FOREIGN KEY (`rental_id`) REFERENCES `rentals` (`id`),
  ADD CONSTRAINT `rental_logs_ibfk_2` FOREIGN KEY (`email`) REFERENCES `users` (`email`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
