import mysql from "mysql2";

const caCertificate = process.env.DB_CA
  ? process.env.DB_CA.replace(/\\n/g, "\n").trim()
  : undefined;

const db = mysql.createPool({
  host: process.env.DB_HOST?.trim(),
  port: Number(process.env.DB_PORT?.trim()),
  user: process.env.DB_USER?.trim(),
  password: process.env.DB_PASSWORD?.trim(),
  database: process.env.DB_NAME?.trim(),

  ssl: {
    ca: caCertificate,
    rejectUnauthorized: true,
  },

  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  enableKeepAlive: true,
});

db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Database pool connection failed:", err.message || err);
  } else {
    console.log("✅ MySQL pool connected successfully!");
    connection.release();
  }
});

export default db;