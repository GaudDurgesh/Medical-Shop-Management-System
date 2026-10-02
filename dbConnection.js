import mysql from "mysql2";

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: true,
  },
  ssl: {
    ca: process.env.DB_CA,
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