import mysql from "mysql2";

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Test",     // <-- update if your MySQL password is different
  database: "medical_shop_new",
  // port: 3306           // uncomment & change if you use a non-standard port
});

db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message || err);
    console.error("Please check:");
    console.error("1. MySQL server is running");
    console.error("2. Database 'medical_shop_new' exists");
    console.error("3. Username and password are correct");
    console.error("4. Host and port are accessible");
    // exit process? (optional)
    // process.exit(1);
  } else {
    console.log("✅ MySQL connected successfully!");
  }
});

export default db;
