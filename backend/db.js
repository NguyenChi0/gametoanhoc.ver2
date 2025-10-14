// db.js
require('dotenv').config();
const mysql = require('mysql2/promise');

// Tạo connection pool dùng Promise
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Chi23324',
  database: process.env.DB_NAME || 'gametoanhoc',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
