-- =============================================================================
-- AgriSathi (Kisan Saathi) - MySQL Database Schema
-- Compatible with MySQL 8.0+ and MariaDB 10.5+
-- =============================================================================

CREATE DATABASE IF NOT EXISTS agrisathi
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE agrisathi;

-- 1. Users Table (Farmers & Administrators)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(150) NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('farmer', 'admin') NOT NULL DEFAULT 'farmer',
  village VARCHAR(100) NOT NULL DEFAULT '',
  district VARCHAR(100) NOT NULL DEFAULT '',
  state VARCHAR(100) NOT NULL DEFAULT 'Maharashtra',
  crop VARCHAR(100) NOT NULL DEFAULT 'Onion',
  farm_size VARCHAR(50) NOT NULL DEFAULT '2 acres',
  tenure VARCHAR(100) NOT NULL DEFAULT 'Owner cultivator',
  member_id VARCHAR(50) NOT NULL UNIQUE,
  crop_type VARCHAR(100) NULL DEFAULT '',
  sowing_date VARCHAR(50) NULL DEFAULT '',
  crop_image MEDIUMTEXT NULL,
  land_image MEDIUMTEXT NULL,
  land_unit VARCHAR(50) NULL DEFAULT 'acres',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_phone (phone),
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Farms Table (Field plots, soil and irrigation info)
CREATE TABLE IF NOT EXISTS farms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  farm_name VARCHAR(150) NOT NULL DEFAULT 'Primary Field',
  latitude DECIMAL(10, 7) NOT NULL DEFAULT 20.087,
  longitude DECIMAL(10, 7) NOT NULL DEFAULT 73.950,
  crop VARCHAR(100) NOT NULL DEFAULT 'Onion',
  acres DECIMAL(6, 2) NOT NULL DEFAULT 2.0,
  soil_type VARCHAR(100) NOT NULL DEFAULT 'Black soil (Regur)',
  irrigation_type VARCHAR(100) NOT NULL DEFAULT 'Drip irrigation',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_farm (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Agricultural Advisories Table (History of queries & recommendations)
CREATE TABLE IF NOT EXISTS advisories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  category ENUM('soil', 'weather', 'pest', 'seed', 'fertilizer', 'resources', 'practice', 'irrigation', 'general') NOT NULL,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  provider VARCHAR(50) NOT NULL DEFAULT 'system',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_category (category),
  INDEX idx_user_advisory (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Password Reset Tokens Table (Single-use expiring tokens)
CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token_hash),
  INDEX idx_user_reset (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
