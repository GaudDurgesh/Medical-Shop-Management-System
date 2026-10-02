import mysql from "mysql2";

const caCertificate = process.env.DB_CA
  ? process.env.DB_CA.replace(/\\n/g, "\n").trim()
  : undefined;

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  ssl: {
    ca: caCertificate,
    rejectUnauthorized: true,
  },
});

db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message || err);
  } else {
    console.log("✅ MySQL connected successfully!");
  }
});

export default db;