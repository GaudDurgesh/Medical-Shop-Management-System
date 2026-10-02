import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import db from "./dbConnection.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
// Express built-in body parsers (no need for body-parser package)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (adjust folder if your static files live elsewhere)
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.redirect("/loginpage/admin-login.html");
});

/* ===========================
   🔐 AUTHENTICATION APIs
   =========================== */

// Admin login
app.post("/login", (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "All fields required!" });
  }

  const sql =
    "SELECT * FROM admin WHERE username = ? AND email = ? AND password = ?";
  db.query(sql, [username, email, password], (err, result) => {
    if (err) {
      console.error("Query error:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }

    // result is an array of rows
    if (Array.isArray(result) && result.length > 0) {
      const admin = result[0];
      // For security: don't send password back in response
      if (admin.password) delete admin.password;
      res.json({ success: true, message: "Login successful", admin });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  });
});

/* ===========================
   💊 MEDICINES APIs
   =========================== */

// Get all medicines
app.get("/api/medicines", (req, res) => {
  const sql = `SELECT id, name, category, price, stock_quantity as stock, 
               expiry_date as expiry, batch_number, supplier_id, 
               DATE_FORMAT(created_at, '%Y-%m-%d') as created_date
               FROM medicines ORDER BY name`;

  db.query(sql, (err, data) => {
    if (err) {
      console.error("Error fetching medicines:", err);
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch medicines" });
    }
    res.json({ success: true, data });
  });
});

// Add new medicine
app.post("/api/medicines", (req, res) => {
  const { name, category, price, stock, expiry, batch_number, supplier_id } =
    req.body;

  if (!name || !category || !price || !stock || !expiry) {
    return res
      .status(400)
      .json({ success: false, message: "All required fields must be filled" });
  }

  const sql = `INSERT INTO medicines (name, category, price, stock_quantity, expiry_date, batch_number, supplier_id) 
               VALUES (?, ?, ?, ?, ?, ?, ?)`;

  db.query(
    sql,
    [
      name,
      category,
      price,
      stock,
      expiry,
      batch_number || null,
      supplier_id || null,
    ],
    (err, result) => {
      if (err) {
        console.error("Error adding medicine:", err);
        return res
          .status(500)
          .json({ success: false, message: "Failed to add medicine" });
      }
      res.json({
        success: true,
        message: "Medicine added successfully",
        id: result.insertId,
      });
    },
  );
});

// Update medicine
app.put("/api/medicines/:id", (req, res) => {
  const { id } = req.params;
  const { name, category, price, stock, expiry, batch_number, supplier_id } =
    req.body;

  const sql = `UPDATE medicines SET name=?, category=?, price=?, stock_quantity=?, 
               expiry_date=?, batch_number=?, supplier_id=?, updated_at=NOW() WHERE id=?`;

  db.query(
    sql,
    [name, category, price, stock, expiry, batch_number, supplier_id, id],
    (err, result) => {
      if (err) {
        console.error("Error updating medicine:", err);
        return res
          .status(500)
          .json({ success: false, message: "Failed to update medicine" });
      }

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Medicine not found" });
      }

      res.json({ success: true, message: "Medicine updated successfully" });
    },
  );
});

// Delete medicine
app.delete("/api/medicines/:id", (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM medicines WHERE id=?";
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error deleting medicine:", err);
      return res
        .status(500)
        .json({ success: false, message: "Failed to delete medicine" });
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Medicine not found" });
    }

    res.json({ success: true, message: "Medicine deleted successfully" });
  });
});

// Get low stock medicines
app.get("/api/medicines/low-stock", (req, res) => {
  const threshold = Number(req.query.threshold) || 10;
  const sql = `SELECT * FROM medicines WHERE stock_quantity <= ? ORDER BY stock_quantity ASC`;

  db.query(sql, [threshold], (err, data) => {
    if (err) {
      console.error("Error fetching low stock medicines:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch low stock medicines",
      });
    }
    res.json({ success: true, data });
  });
});

// Get expiring medicines
app.get("/api/medicines/expiring", (req, res) => {
  const days = Number(req.query.days) || 30;
  const sql = `SELECT * FROM medicines WHERE expiry_date <= DATE_ADD(NOW(), INTERVAL ? DAY) 
               AND expiry_date >= CURDATE() ORDER BY expiry_date ASC`;

  db.query(sql, [days], (err, data) => {
    if (err) {
      console.error("Error fetching expiring medicines:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch expiring medicines",
      });
    }
    res.json({ success: true, data });
  });
});

/* ===========================
   👥 EMPLOYEES APIs
   =========================== */

// Get all employees
app.get("/api/employees", (req, res) => {
  const sql = `SELECT id, employee_id, name, position, phone, email, salary, 
               DATE_FORMAT(hire_date, '%Y-%m-%d') as hire_date, status
               FROM employees ORDER BY name`;

  db.query(sql, (err, data) => {
    if (err) {
      console.error("Error fetching employees:", err);
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch employees" });
    }
    res.json({ success: true, data });
  });
});

// Add new employee
app.post("/api/employees", (req, res) => {
  const { employee_id, name, position, phone, email, salary, hire_date } =
    req.body;

  if (!employee_id || !name || !position || !phone || !email) {
    return res
      .status(400)
      .json({ success: false, message: "All required fields must be filled" });
  }

  // Check if employee_id already exists
  const checkSql = "SELECT id FROM employees WHERE employee_id = ?";
  db.query(checkSql, [employee_id], (err, existing) => {
    if (err) {
      console.error("Error checking employee ID:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    if (existing.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Employee ID already exists" });
    }

    const sql = `INSERT INTO employees (employee_id, name, position, phone, email, salary, hire_date) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.query(
      sql,
      [
        employee_id,
        name,
        position,
        phone,
        email,
        salary || null,
        hire_date || new Date(),
      ],
      (err, result) => {
        if (err) {
          console.error("Error adding employee:", err);
          return res
            .status(500)
            .json({ success: false, message: "Failed to add employee" });
        }
        res.json({
          success: true,
          message: "Employee added successfully",
          id: result.insertId,
        });
      },
    );
  });
});

// Update employee
app.put("/api/employees/:id", (req, res) => {
  const { id } = req.params;
  const { employee_id, name, position, phone, email, salary, status } =
    req.body;

  const sql = `UPDATE employees SET employee_id=?, name=?, position=?, phone=?, 
               email=?, salary=?, status=?, updated_at=NOW() WHERE id=?`;

  db.query(
    sql,
    [employee_id, name, position, phone, email, salary, status || "active", id],
    (err, result) => {
      if (err) {
        console.error("Error updating employee:", err);
        return res
          .status(500)
          .json({ success: false, message: "Failed to update employee" });
      }

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Employee not found" });
      }

      res.json({ success: true, message: "Employee updated successfully" });
    },
  );
});

// Delete employee - FIXED: Now handles both deactivation and permanent deletion
app.delete("/api/employees/:id", (req, res) => {
  const { id } = req.params;
  const { permanent } = req.query; // Check if permanent deletion is requested

  // First, get the employee to check their current status
  const checkSql = "SELECT status FROM employees WHERE id = ?";
  db.query(checkSql, [id], (err, result) => {
    if (err) {
      console.error("Error checking employee status:", err);
      return res
        .status(500)
        .json({ success: false, message: "Failed to check employee status" });
    }

    if (result.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    const employee = result[0];

    // If permanent deletion is requested OR employee is already inactive, delete permanently
    if (permanent === "true" || employee.status === "inactive") {
      const deleteSql = "DELETE FROM employees WHERE id = ?";
      db.query(deleteSql, [id], (err, result) => {
        if (err) {
          console.error("Error permanently deleting employee:", err);
          return res.status(500).json({
            success: false,
            message: "Failed to permanently delete employee",
          });
        }

        if (result.affectedRows === 0) {
          return res
            .status(404)
            .json({ success: false, message: "Employee not found" });
        }

        res.json({
          success: true,
          message: "Employee permanently deleted successfully",
        });
      });
    } else {
      // If employee is active, just deactivate them
      const deactivateSql =
        "UPDATE employees SET status='inactive', updated_at=NOW() WHERE id=?";
      db.query(deactivateSql, [id], (err, result) => {
        if (err) {
          console.error("Error deactivating employee:", err);
          return res
            .status(500)
            .json({ success: false, message: "Failed to deactivate employee" });
        }

        if (result.affectedRows === 0) {
          return res
            .status(404)
            .json({ success: false, message: "Employee not found" });
        }

        res.json({
          success: true,
          message: "Employee deactivated successfully",
        });
      });
    }
  });
});

/* ===========================
   📦 SUPPLIERS APIs
   =========================== */

// Get all suppliers
app.get("/api/suppliers", (req, res) => {
  const sql = `SELECT id, name, contact_person, phone, email, address, 
               DATE_FORMAT(created_at, '%Y-%m-%d') as created_date, status
               FROM suppliers ORDER BY name`;

  db.query(sql, (err, data) => {
    if (err) {
      console.error("Error fetching suppliers:", err);
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch suppliers" });
    }
    res.json({ success: true, data });
  });
});

// Add new supplier
app.post("/api/suppliers", (req, res) => {
  const { name, contact_person, phone, email, address } = req.body;

  if (!name || !contact_person || !phone) {
    return res.status(400).json({
      success: false,
      message: "Name, contact person, and phone are required",
    });
  }

  const sql = `INSERT INTO suppliers (name, contact_person, phone, email, address) 
               VALUES (?, ?, ?, ?, ?)`;

  db.query(
    sql,
    [name, contact_person, phone, email || null, address || null],
    (err, result) => {
      if (err) {
        console.error("Error adding supplier:", err);
        return res
          .status(500)
          .json({ success: false, message: "Failed to add supplier" });
      }
      res.json({
        success: true,
        message: "Supplier added successfully",
        id: result.insertId,
      });
    },
  );
});

// Update supplier
app.put("/api/suppliers/:id", (req, res) => {
  const { id } = req.params;
  const { name, contact_person, phone, email, address, status } = req.body;

  const sql = `UPDATE suppliers SET name=?, contact_person=?, phone=?, email=?, 
               address=?, status=?, updated_at=NOW() WHERE id=?`;

  db.query(
    sql,
    [name, contact_person, phone, email, address, status || "active", id],
    (err, result) => {
      if (err) {
        console.error("Error updating supplier:", err);
        return res
          .status(500)
          .json({ success: false, message: "Failed to update supplier" });
      }

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Supplier not found" });
      }

      res.json({ success: true, message: "Supplier updated successfully" });
    },
  );
});

// Deactivate supplier (soft delete)
app.put("/api/suppliers/:id/deactivate", (req, res) => {
  const { id } = req.params;

  const sql =
    "UPDATE suppliers SET status='inactive', updated_at=NOW() WHERE id=?";
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error deactivating supplier:", err);
      return res
        .status(500)
        .json({ success: false, message: "Failed to deactivate supplier" });
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Supplier not found" });
    }

    res.json({ success: true, message: "Supplier deactivated successfully" });
  });
});

// Permanently delete supplier (new endpoint)
app.delete("/api/suppliers/:id", (req, res) => {
  const { id } = req.params;

  // First check if supplier has any associated medicines
  const checkSql =
    "SELECT COUNT(*) as count FROM medicines WHERE supplier_id = ?";
  db.query(checkSql, [id], (err, result) => {
    if (err) {
      console.error("Error checking supplier dependencies:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to check supplier dependencies",
      });
    }

    const medicineCount = result[0].count;
    if (medicineCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete supplier. ${medicineCount} medicines are associated with this supplier. Please reassign or delete those medicines first.`,
      });
    }

    // If no dependencies, proceed with deletion
    const deleteSql = "DELETE FROM suppliers WHERE id=?";
    db.query(deleteSql, [id], (err, result) => {
      if (err) {
        console.error("Error deleting supplier:", err);
        return res
          .status(500)
          .json({ success: false, message: "Failed to delete supplier" });
      }

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Supplier not found" });
      }

      res.json({
        success: true,
        message: "Supplier permanently deleted successfully",
      });
    });
  });
});

/* ===========================
   💰 SALES APIs
   =========================== */

// Get all sales
app.get("/api/sales", (req, res) => {
  const sql = `SELECT s.id, s.invoice_number, s.customer_name, s.customer_phone, 
               s.total_amount, s.discount, s.final_amount, s.payment_method,
               DATE_FORMAT(s.sale_date, '%Y-%m-%d %H:%i') as sale_date,
               e.name as employee_name
               FROM sales s 
               LEFT JOIN employees e ON s.employee_id = e.id
               ORDER BY s.sale_date DESC`;

  db.query(sql, (err, data) => {
    if (err) {
      console.error("Error fetching sales:", err);
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch sales" });
    }
    res.json({ success: true, data });
  });
});

// Get sale details with items
app.get("/api/sales/:id", (req, res) => {
  const { id } = req.params;

  const saleSql = `SELECT s.*, e.name as employee_name 
                   FROM sales s 
                   LEFT JOIN employees e ON s.employee_id = e.id 
                   WHERE s.id = ?`;

  const itemsSql = `SELECT si.*, m.name as medicine_name, m.category 
                    FROM sale_items si 
                    JOIN medicines m ON si.medicine_id = m.id 
                    WHERE si.sale_id = ?`;

  db.query(saleSql, [id], (err, saleData) => {
    if (err) {
      console.error("Error fetching sale:", err);
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch sale" });
    }

    if (!saleData || saleData.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Sale not found" });
    }

    db.query(itemsSql, [id], (err, itemsData) => {
      if (err) {
        console.error("Error fetching sale items:", err);
        return res
          .status(500)
          .json({ success: false, message: "Failed to fetch sale items" });
      }

      res.json({
        success: true,
        sale: saleData[0],
        items: itemsData,
      });
    });
  });
});

// Create new sale
app.post("/api/sales", async (req, res) => {
  const {
    customer_name,
    customer_phone,
    items,
    discount,
    payment_method,
    employee_id,
  } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "At least one item is required" });
  }

  const invoice_number = `INV${Date.now()}`;

  let total_amount = 0;

  items.forEach((item) => {
    total_amount +=
      (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
  });

  const discount_amount = Number(discount) || 0;
  const final_amount = total_amount - discount_amount;

  let connection;

  try {
    connection = await db.promise().getConnection();

    await connection.beginTransaction();

    const saleSql = `
      INSERT INTO sales (
        invoice_number,
        customer_name,
        customer_phone,
        total_amount,
        discount,
        final_amount,
        payment_method,
        employee_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [saleResult] = await connection.query(saleSql, [
      invoice_number,
      customer_name,
      customer_phone,
      total_amount,
      discount_amount,
      final_amount,
      payment_method,
      employee_id,
    ]);

    const sale_id = saleResult.insertId;

    for (const item of items) {
      const qty = Number(item.quantity) || 0;
      const unitPrice = Number(item.unit_price) || 0;
      const totalPrice = qty * unitPrice;

      const itemSql = `
        INSERT INTO sale_items (
          sale_id,
          medicine_id,
          quantity,
          unit_price,
          total_price
        )
        VALUES (?, ?, ?, ?, ?)
      `;

      await connection.query(itemSql, [
        sale_id,
        item.medicine_id,
        qty,
        unitPrice,
        totalPrice,
      ]);

      const updateStockSql = `
        UPDATE medicines
        SET stock_quantity = stock_quantity - ?
        WHERE id = ?
      `;

      await connection.query(updateStockSql, [qty, item.medicine_id]);
    }

    await connection.commit();

    res.json({
      success: true,
      message: "Sale created successfully",
      sale_id,
      invoice_number,
    });
  } catch (err) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Rollback error:", rollbackError);
      }
    }

    console.error("Create sale error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to create sale",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

app.delete("/api/sales/:id", async (req, res) => {
  const { id } = req.params;

  let connection;

  try {
    connection = await db.promise().getConnection();

    await connection.beginTransaction();

    const [saleData] = await connection.query(
      "SELECT id FROM sales WHERE id = ?",
      [id],
    );

    if (saleData.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Sale not found",
      });
    }

    const restoreStockSql = `
      UPDATE medicines m
      JOIN (
        SELECT medicine_id, SUM(quantity) AS qty
        FROM sale_items
        WHERE sale_id = ?
        GROUP BY medicine_id
      ) si ON m.id = si.medicine_id
      SET m.stock_quantity = m.stock_quantity + si.qty
    `;

    await connection.query(restoreStockSql, [id]);

    await connection.query("DELETE FROM sale_items WHERE sale_id = ?", [id]);

    await connection.query("DELETE FROM sales WHERE id = ?", [id]);

    await connection.commit();

    res.json({
      success: true,
      message: "Sale deleted successfully",
    });
  } catch (err) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Rollback error:", rollbackError);
      }
    }

    console.error("Delete sale error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to delete sale",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

/* ===========================
   📊 DASHBOARD & ANALYTICS APIs
   =========================== */

// Get dashboard statistics
app.get("/api/dashboard/stats", (req, res) => {
  const today = new Date().toISOString().split("T")[0];

  const queries = {
    todayRevenue: `SELECT COALESCE(SUM(final_amount), 0) as revenue FROM sales WHERE DATE(sale_date) = ?`,
    totalInventoryValue: `SELECT COALESCE(SUM(price * stock_quantity), 0) as value FROM medicines WHERE status = 'active'`,
    pendingOrders: `SELECT COUNT(*) as count FROM sales WHERE payment_method = 'pending'`,
    lowStockCount: `SELECT COUNT(*) as count FROM medicines WHERE stock_quantity <= 10 AND status = 'active'`,
    expiringCount: `SELECT COUNT(*) as count FROM medicines WHERE expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) AND expiry_date >= CURDATE() AND status = 'active'`,
  };

  const stats = {};
  let completed = 0;
  const totalQueries = Object.keys(queries).length;

  Object.entries(queries).forEach(([key, sql]) => {
    const params = key === "todayRevenue" ? [today] : [];

    db.query(sql, params, (err, result) => {
      if (err) {
        console.error(`Error fetching ${key}:`, err);
        stats[key] = 0;
      } else {
        stats[key] = result[0][Object.keys(result[0])[0]];
      }

      completed++;
      if (completed === totalQueries) {
        res.json({ success: true, stats });
      }
    });
  });
});

// Get sales chart data (last 7 days)
app.get("/api/dashboard/sales-chart", (req, res) => {
  const sql = `SELECT DATE(sale_date) as date, COALESCE(SUM(final_amount), 0) as revenue 
               FROM sales 
               WHERE sale_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
               GROUP BY DATE(sale_date)
               ORDER BY date`;

  db.query(sql, (err, data) => {
    if (err) {
      console.error("Error fetching sales chart data:", err);
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch chart data" });
    }

    const result = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const dayData = data.find((d) => d.date === dateStr);
      result.push({
        date: dateStr,
        revenue: dayData ? Number(dayData.revenue) : 0,
      });
    }

    res.json({ success: true, data: result });
  });
});

// Get alerts (low stock + expiring medicines)
app.get("/api/dashboard/alerts", (req, res) => {
  const lowStockSql = `SELECT name, stock_quantity FROM medicines WHERE stock_quantity <= 10 AND status = 'active' ORDER BY stock_quantity ASC LIMIT 5`;
  const expiringSql = `SELECT name, expiry_date FROM medicines WHERE expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) AND expiry_date >= CURDATE() AND status = 'active' ORDER BY expiry_date ASC LIMIT 5`;

  db.query(lowStockSql, (err, lowStock) => {
    if (err) {
      console.error("Error fetching low stock alerts:", err);
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch alerts" });
    }

    db.query(expiringSql, (err, expiring) => {
      if (err) {
        console.error("Error fetching expiring alerts:", err);
        return res
          .status(500)
          .json({ success: false, message: "Failed to fetch alerts" });
      }

      const alerts = [];

      lowStock.forEach((item) => {
        alerts.push({
          type: "low_stock",
          message: `${item.name} - Only ${item.stock_quantity} left in stock`,
          priority: "high",
        });
      });

      expiring.forEach((item) => {
        const daysLeft = Math.ceil(
          (new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24),
        );
        alerts.push({
          type: "expiring",
          message: `${item.name} expires in ${daysLeft} days`,
          priority: daysLeft <= 7 ? "high" : "medium",
        });
      });

      res.json({ success: true, alerts });
    });
  });
});

/* ===========================
   🚀 START SERVER
   =========================== */

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Medical Shop Server running on http://localhost:${PORT}`);
  // console.log("📋 Available endpoints:");
  // console.log("   - POST /login - Admin authentication");
  // console.log("   - GET/POST/PUT/DELETE /api/medicines - Medicine management");
  // console.log("   - GET/POST/PUT/DELETE /api/employees - Employee management");
  // console.log("   - GET/POST/PUT/DELETE /api/suppliers - Supplier management");
  // console.log("   - GET/POST /api/sales - Sales management");
  // console.log("   - GET /api/dashboard/* - Dashboard analytics");
});

// Graceful shutdown (optional)
process.on("SIGINT", () => {
  console.log("Shutting down server...");
  db.end(() => {
    console.log("Database connection closed.");
    process.exit(0);
  });
});
