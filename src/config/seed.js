const { pool } = require('./db');

async function seedDatabase() {
  try {
    console.log('Checking database seeding...');

    // 1. Seed Site Admins if not existing
    const [admins] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "siteadmin"');
    if (admins[0].count === 0) {
      console.log('🌱 Seeding site admins...');
      const hash = '$2a$10$rOzK9xYGQZq5PzDiFG.Ogu5EKWh2RJHjRIzLzn2RRQK5VJbPxg.La'; // bcrypt hash for 'Admin@123'
      await pool.query(
        `INSERT IGNORE INTO users (name, email, password_hash, role, site_id, is_active) VALUES
         ('Site A Admin', 'admina@malaconstruction.com', ?, 'siteadmin', 1, 1),
         ('Site B Admin', 'adminb@malaconstruction.com', ?, 'siteadmin', 2, 1)`,
        [hash, hash]
      );
    }

    // 2. Seed Materials if empty
    const [materialsCount] = await pool.query('SELECT COUNT(*) as count FROM materials');
    if (materialsCount[0].count === 0) {
      console.log('🌱 Seeding sample materials...');
      // Site A Materials
      await pool.query(`
        INSERT INTO materials (site_id, material_type, quantity, unit, rate, date, supplier_vendor, description, created_by) VALUES
        (1, 'Cement', 150.00, 'Bags', 420.00, CURDATE(), 'UltraTech Dealers', 'Initial foundation work', 1),
        (1, 'Steel', 5.50, 'Tonnes', 62000.00, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'Tata Steel Distributors', 'Pillar reinforcement bars', 1),
        (1, 'Sand', 3.00, 'Loads', 12000.00, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'Local Sand Quarry', 'Fine sand for plastering', 1),
        (1, 'Bricks', 5000.00, 'Pieces', 8.50, DATE_SUB(CURDATE(), INTERVAL 10 DAY), 'Jaya Brick Kiln', 'Red clay bricks', 1),
        -- Site B Materials
        (2, 'Cement', 100.00, 'Bags', 430.00, CURDATE(), 'ACC Cement Agency', 'Wall masonry', 1),
        (2, 'Aggregates', 4.00, 'Loads', 8500.00, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'Blue Metal Crusher', 'Coarse aggregate 20mm', 1)
      `);
    }

    // 3. Seed Workers if empty
    const [workersCount] = await pool.query('SELECT COUNT(*) as count FROM workers');
    if (workersCount[0].count === 0) {
      console.log('🌱 Seeding sample workers...');
      await pool.query(`
        INSERT INTO workers (site_id, name, profession, daily_wage, days_worked, work_period_start, work_period_end, created_by) VALUES
        -- Site A Workers
        (1, 'Ravi Kumar', 'Mason / Bricklayer', 900.00, 12, DATE_SUB(CURDATE(), INTERVAL 15 DAY), CURDATE(), 1),
        (1, 'Suresh Singh', 'Carpenter', 850.00, 8, DATE_SUB(CURDATE(), INTERVAL 12 DAY), DATE_SUB(CURDATE(), INTERVAL 4 DAY), 1),
        (1, 'Madan Lal', 'Helper', 600.00, 15, DATE_SUB(CURDATE(), INTERVAL 18 DAY), CURDATE(), 1),
        (1, 'Kiran Das', 'Steel Fixer', 850.00, 10, DATE_SUB(CURDATE(), INTERVAL 14 DAY), DATE_SUB(CURDATE(), INTERVAL 4 DAY), 1),
        -- Site B Workers
        (2, 'Balaji Rao', 'Mason / Bricklayer', 950.00, 10, DATE_SUB(CURDATE(), INTERVAL 12 DAY), CURDATE(), 1),
        (2, 'Arumugam P.', 'Helper', 600.00, 12, DATE_SUB(CURDATE(), INTERVAL 14 DAY), CURDATE(), 1)
      `);
    }

    // 4. Seed Expenses if empty
    const [expensesCount] = await pool.query('SELECT COUNT(*) as count FROM expenses');
    if (expensesCount[0].count === 0) {
      console.log('🌱 Seeding sample expenses...');
      await pool.query(`
        INSERT INTO expenses (site_id, expense_head, description, amount, date, payment_mode, receipt_bill, status, approved_by, approved_at, created_by) VALUES
        -- Site A Expenses
        (1, 'Fuel', 'Diesel for generator', 4500.00, CURDATE(), 'Cash', 'PETRO-5432', 'approved', 1, CURRENT_TIMESTAMP, 1),
        (1, 'Equipment', 'Mixer machine rental', 8000.00, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'Bank Transfer', 'TXN-87654', 'approved', 1, CURRENT_TIMESTAMP, 1),
        (1, 'Food', 'Worker tea and snacks', 1200.00, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'UPI', 'UPI-982347', 'pending', NULL, NULL, 1),
        (1, 'Transport', 'Debris clearing tractor', 3500.00, DATE_SUB(CURDATE(), INTERVAL 6 DAY), 'Cash', 'RECEIPT-99', 'approved', 1, CURRENT_TIMESTAMP, 1),
        -- Site B Expenses
        (2, 'Utilities', 'Temporary electricity connection charges', 6200.00, DATE_SUB(CURDATE(), INTERVAL 4 DAY), 'Bank Transfer', 'EB-CHG-902', 'approved', 1, CURRENT_TIMESTAMP, 1),
        (2, 'Tools', 'Hand drilling machine and bits', 2800.00, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'UPI', 'AMZ-889', 'pending', NULL, NULL, 1)
      `);
    }

    console.log('✅ Seeding checks completed successfully.');
  } catch (err) {
    console.error('❌ Database seeding error:', err.message);
  }
}

module.exports = { seedDatabase };
