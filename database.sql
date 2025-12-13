-- Medical Shop Database Schema
-- Run this script in your MySQL Command Line Client to create the complete database structure

CREATE DATABASE IF NOT EXISTS medical_shop_new;
USE medical_shop_new;

-- Admin table (you mentioned you already have this)
CREATE TABLE IF NOT EXISTS admin (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample admin (replace with your actual data)
INSERT IGNORE INTO admin (username, email, password, full_name) VALUES 
('Durgesh Gaud', 'xyz@gmail.com', 'ownerD45', 'Shop Administrator');

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    address TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Medicines table
CREATE TABLE IF NOT EXISTS medicines (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    expiry_date DATE NOT NULL,
    batch_number VARCHAR(50),
    supplier_id INT,
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    INDEX idx_name (name),
    INDEX idx_category (category),
    INDEX idx_expiry (expiry_date),
    INDEX idx_stock (stock_quantity)
);

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    position VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    salary DECIMAL(10,2),
    hire_date DATE DEFAULT (CURDATE()),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_employee_id (employee_id),
    INDEX idx_name (name)
);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(100),
    customer_phone VARCHAR(20),
    total_amount DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0,
    final_amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('cash', 'card', 'upi', 'pending') DEFAULT 'cash',
    employee_id INT,
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL,
    INDEX idx_invoice (invoice_number),
    INDEX idx_date (sale_date),
    INDEX idx_customer (customer_name)
);

-- Sale Items table (for detailed invoice items)
CREATE TABLE IF NOT EXISTS sale_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sale_id INT NOT NULL,
    medicine_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE RESTRICT,
    INDEX idx_sale_id (sale_id),
    INDEX idx_medicine_id (medicine_id)
);

-- Purchase Orders table (for supplier orders)
CREATE TABLE IF NOT EXISTS purchase_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'confirmed', 'received', 'cancelled') DEFAULT 'pending',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expected_delivery DATE,
    notes TEXT,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
    INDEX idx_order_number (order_number),
    INDEX idx_status (status),
    INDEX idx_date (order_date)
);

-- Purchase Order Items table
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    medicine_id INT,
    medicine_name VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE SET NULL,
    INDEX idx_order_id (order_id)
);

-- Inventory Adjustments table (for stock corrections)
CREATE TABLE IF NOT EXISTS inventory_adjustments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    medicine_id INT NOT NULL,
    adjustment_type ENUM('increase', 'decrease', 'correction') NOT NULL,
    quantity_change INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    previous_stock INT NOT NULL,
    new_stock INT NOT NULL,
    adjusted_by INT,
    adjustment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE RESTRICT,
    FOREIGN KEY (adjusted_by) REFERENCES employees(id) ON DELETE SET NULL,
    INDEX idx_medicine_id (medicine_id),
    INDEX idx_date (adjustment_date)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'warning', 'error', 'success') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_read (is_read),
    INDEX idx_date (created_at)
);

-- Sample data for testing
INSERT IGNORE INTO suppliers (name, contact_person, phone, email, address) VALUES 
('MediCorp Pharmaceuticals', 'Rajesh Kumar', '9876543210', 'rajesh@medicorp.com', 'Mumbai, Maharashtra'),
('HealthPlus Distributors', 'Priya Sharma', '9876543211', 'priya@healthplus.com', 'Delhi, India'),
('PharmaLink Solutions', 'Amit Patel', '9876543212', 'amit@pharmalink.com', 'Ahmedabad, Gujarat');

INSERT IGNORE INTO employees (employee_id, name, position, phone, email, salary) VALUES 
('EMP001', 'Ravi Kumar', 'Pharmacist', '9876543220', 'ravi@medicalshop.com', 35000),
('EMP002', 'Sunita Devi', 'Sales Assistant', '9876543221', 'sunita@medicalshop.com', 25000),
('EMP003', 'Mohan Singh', 'Store Manager', '9876543222', 'mohan@medicalshop.com', 40000);

INSERT IGNORE INTO medicines (name, category, price, stock_quantity, expiry_date, batch_number, supplier_id) VALUES 
('Paracetamol 500mg', 'Pain Relief', 2.50, 500, '2025-12-31', 'PCM001', 1),
('Amoxicillin 250mg', 'Antibiotic', 15.00, 200, '2025-08-15', 'AMX001', 1),
('Cetirizine 10mg', 'Antihistamine', 3.00, 300, '2025-10-20', 'CET001', 2),
('Omeprazole 20mg', 'Antacid', 8.50, 150, '2025-06-30', 'OME001', 2),
('Aspirin 75mg', 'Blood Thinner', 1.20, 400, '2025-11-15', 'ASP001', 3),
('Metformin 500mg', 'Diabetes', 5.00, 100, '2025-09-10', 'MET001', 3),
('Vitamin D3', 'Supplement', 12.00, 80, '2025-07-25', 'VIT001', 1),
('Cough Syrup', 'Respiratory', 45.00, 50, '2025-05-20', 'COU001', 2);

-- Create views for commonly used queries
CREATE OR REPLACE VIEW low_stock_medicines AS
SELECT m.*, s.name as supplier_name 
FROM medicines m 
LEFT JOIN suppliers s ON m.supplier_id = s.id 
WHERE m.stock_quantity <= 10 AND m.status = 'active';

CREATE OR REPLACE VIEW expiring_medicines AS
SELECT m.*, s.name as supplier_name,
       DATEDIFF(m.expiry_date, CURDATE()) as days_to_expire
FROM medicines m 
LEFT JOIN suppliers s ON m.supplier_id = s.id 
WHERE m.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 60 DAY) 
AND m.expiry_date >= CURDATE() 
AND m.status = 'active'
ORDER BY m.expiry_date;

CREATE OR REPLACE VIEW daily_sales_summary AS
SELECT DATE(sale_date) as sale_date,
       COUNT(*) as total_sales,
       SUM(final_amount) as total_revenue,
       AVG(final_amount) as avg_sale_amount
FROM sales 
GROUP BY DATE(sale_date)
ORDER BY sale_date DESC;

-- Create triggers for automatic notifications
DELIMITER //

CREATE TRIGGER after_medicine_stock_update 
AFTER UPDATE ON medicines
FOR EACH ROW
BEGIN
    -- Low stock notification
    IF NEW.stock_quantity <= 10 AND OLD.stock_quantity > 10 THEN
        INSERT INTO notifications (title, message, type) 
        VALUES ('Low Stock Alert', 
                CONCAT('Medicine "', NEW.name, '" is running low. Only ', NEW.stock_quantity, ' units left.'), 
                'warning');
    END IF;
    
    -- Out of stock notification
    IF NEW.stock_quantity = 0 AND OLD.stock_quantity > 0 THEN
        INSERT INTO notifications (title, message, type) 
        VALUES ('Out of Stock Alert', 
                CONCAT('Medicine "', NEW.name, '" is out of stock!'), 
                'error');
    END IF;
END//

CREATE TRIGGER after_sale_insert 
AFTER INSERT ON sales
FOR EACH ROW
BEGIN
    -- Daily sales milestone notification
    DECLARE daily_total DECIMAL(10,2);
    SELECT COALESCE(SUM(final_amount), 0) INTO daily_total 
    FROM sales 
    WHERE DATE(sale_date) = DATE(NEW.sale_date);
    
    IF daily_total >= 10000 THEN
        INSERT INTO notifications (title, message, type) 
        VALUES ('Sales Milestone', 
                CONCAT('Daily sales have reached ₹', daily_total, '!'), 
                'success');
    END IF;
END//

DELIMITER ;

-- Create indexes for better performance
CREATE INDEX idx_medicines_search ON medicines(name, category, batch_number);
CREATE INDEX idx_sales_date_range ON sales(sale_date, final_amount);
CREATE INDEX idx_employees_active ON employees(status, name);
CREATE INDEX idx_suppliers_active ON suppliers(status, name);

SHOW TABLES;
SELECT 'Database schema created successfully!' as Status;