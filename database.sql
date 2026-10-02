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
('Satyam Singh', 'satyam@gmail.com', 'satyam45', 'Satyam Singh');

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
('Shree Sai Pharma Distributors', 'Amit Kulkarni', '9876543101', 'amit@shreesaipharma.in', 'Andheri East, Mumbai, Maharashtra'),
('MediCare Wholesale Agency', 'Neha Patil', '9876543102', 'neha@medicarewholesale.in', 'Shivajinagar, Pune, Maharashtra'),
('Aarogya Medical Suppliers', 'Rohit Deshmukh', '9876543103', 'rohit@aarogyasuppliers.in', 'Thane West, Maharashtra');

INSERT IGNORE INTO employees (employee_id, name, position, phone, email, salary) VALUES 
('EMP001', 'Aman Verma', 'Pharmacist', '9823014501', 'aman.verma@medicalshop.in', 32000),
('EMP002', 'Priya Patil', 'Sales Assistant', '9823014502', 'priya.patil@medicalshop.in', 24000);

INSERT IGNORE INTO medicines (name, category, price, stock_quantity, expiry_date, batch_number, supplier_id) VALUES 
('Paracetamol 500mg', 'Pain Relief', 25.00, 180, '2028-03-31', 'PCM2601', 1),
('Dolo 650mg', 'Fever', 32.00, 140, '2028-01-31', 'DOL2602', 1),
('Amoxicillin 250mg', 'Antibiotic', 85.00, 70, '2027-11-30', 'AMX2603', 2),
('Azithromycin 500mg', 'Antibiotic', 110.00, 55, '2028-02-29', 'AZI2604', 2),
('Cetirizine 10mg', 'Antihistamine', 28.00, 120, '2027-12-31', 'CET2605', 1),
('Pantoprazole 40mg', 'Antacid', 68.00, 95, '2028-04-30', 'PAN2606', 3),
('Metformin 500mg', 'Diabetes', 48.00, 110, '2028-05-31', 'MET2607', 3),
('Vitamin D3 60000 IU', 'Vitamin / Supplement', 95.00, 65, '2028-06-30', 'VIT2608', 1),
('Cough Syrup 100ml', 'Cough / Cold', 82.00, 45, '2027-10-31', 'COU2609', 2),
('ORS Powder Sachet', 'ORS', 20.00, 160, '2028-07-31', 'ORS2610', 3),
('Povidone Iodine Solution 100ml', 'First Aid', 78.00, 35, '2028-03-31', 'PVI2611', 3),
('Digital Thermometer', 'First Aid', 145.00, 8, '2029-12-31', 'THM2612', 2);

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