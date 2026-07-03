-- ============================================
-- MALA CONSTRUCTION DATABASE SCHEMA
-- Run this in MySQL Workbench
-- ============================================

CREATE DATABASE IF NOT EXISTS malaconstruction CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE malaconstruction;

-- ============================================
-- TABLE: sites
-- ============================================
CREATE TABLE IF NOT EXISTS sites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(500),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: users (Super Admin + Site Admins)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('superadmin', 'siteadmin') NOT NULL DEFAULT 'siteadmin',
  site_id INT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE SET NULL
);

-- ============================================
-- TABLE: materials
-- ============================================
CREATE TABLE IF NOT EXISTS materials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  site_id INT NOT NULL,
  material_type VARCHAR(100) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
  unit VARCHAR(50),
  rate DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12, 2) GENERATED ALWAYS AS (quantity * rate) STORED,
  date DATE NOT NULL,
  supplier_vendor VARCHAR(255),
  description TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- TABLE: workers
-- ============================================
CREATE TABLE IF NOT EXISTS workers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  site_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  profession VARCHAR(100) NOT NULL,
  daily_wage DECIMAL(10, 2) NOT NULL DEFAULT 0,
  days_worked INT NOT NULL DEFAULT 0,
  total_amount DECIMAL(12, 2) GENERATED ALWAYS AS (daily_wage * days_worked) STORED,
  work_period_start DATE,
  work_period_end DATE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- TABLE: expenses
-- ============================================
CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  site_id INT NOT NULL,
  expense_head VARCHAR(100) NOT NULL,
  description TEXT,
  amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  date DATE NOT NULL,
  payment_mode VARCHAR(50),
  receipt_bill VARCHAR(500),
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  approved_by INT NULL,
  approved_at TIMESTAMP NULL,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- SEED: Default Super Admin
-- Password: Admin@123 (bcrypt hash)
-- ============================================
INSERT IGNORE INTO users (name, email, password_hash, role, site_id, is_active)
VALUES (
  'Super Admin',
  'admin@malaconstruction.com',
  '$2a$10$rOzK9xYGQZq5PzDiFG.Ogu5EKWh2RJHjRIzLzn2RRQK5VJbPxg.La',
  'superadmin',
  NULL,
  1
);

-- ============================================
-- SEED: Sample Sites
-- ============================================
INSERT IGNORE INTO sites (name, location, is_active) VALUES
  ('Site A', 'Chennai, Tamil Nadu', 1),
  ('Site B', 'Coimbatore, Tamil Nadu', 1),
  ('Site C', 'Madurai, Tamil Nadu', 0);
