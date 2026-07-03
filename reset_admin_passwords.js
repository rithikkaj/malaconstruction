const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const PASSWORD = process.env.ADMIN_RESET_PASSWORD || 'Admin@123';
const USERS = [
  { email: 'admin@malaconstruction.com' },
  { email: 'admina@malaconstruction.com' },
  { email: 'adminb@malaconstruction.com' },
];

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Rithikka@2005',
    database: process.env.DB_NAME || 'malaconstruction',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+05:30',
  });

  const hash = await bcrypt.hash(PASSWORD, 10);

  for (const u of USERS) {
    const [result] = await pool.query(
      'UPDATE users SET password_hash = ? WHERE email = ?',
      [hash, u.email]
    );

    // mysql2 returns an OkPacket for UPDATE with affectedRows
    const affected = result?.affectedRows ?? 0;
    console.log(`${u.email} -> updated rows: ${affected}`);
  }

  await pool.end();
  console.log('Done. You can now login with:');
  console.log(`Password: ${PASSWORD}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

