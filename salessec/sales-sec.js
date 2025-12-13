// Sales Management JavaScript
const API_BASE = 'http://localhost:5000/api';

let sales = [];
let medicines = [];
let employees = [];
let currentSaleItems = [];

// DOM Elements
const salesTable = document.getElementById('salesTable').getElementsByTagName('tbody')[0];
const searchInput = document.getElementById('searchInput');
const newSaleBtn = document.getElementById('newSaleBtn');
const saleModal = document.getElementById('saleModal');
const saleForm = document.getElementById('saleForm');
const closeBtn = document.querySelector('.closeBtn');
const addItemBtn = document.getElementById('addItemBtn');
const saleItemsContainer = document.getElementById('saleItems');
const discountInput = document.getElementById('discount');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadInitialData();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    newSaleBtn.addEventListener('click', () => openSaleModal());
    closeBtn.addEventListener('click', () => closeSaleModal());
    saleForm.addEventListener('submit', handleSaleSubmit);
    searchInput.addEventListener('input', handleSearch);
    addItemBtn.addEventListener('click', addSaleItem);
    window.addEventListener('click', (e) => { if (e.target === saleModal) closeSaleModal(); });

    // close with Esc
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && saleModal.getAttribute('aria-hidden') === 'false') {
            closeSaleModal();
        }
    });

    // discount input update
    if (discountInput) discountInput.addEventListener('input', updateSaleTotal);
}

// Load initial data
async function loadInitialData() {
    try {
        showLoading(true);
        await Promise.all([ loadSales(), loadMedicines(), loadEmployees() ]);
    } catch (error) {
        console.error('Error loading initial data:', error);
        showError('Failed to load data');
    } finally {
        showLoading(false);
    }
}

// Load all sales from API
async function loadSales() {
    try {
        const response = await fetch(`${API_BASE}/sales`);
        const result = await response.json();

        if (result.success) {
            sales = result.data;
            displaySales(sales);
        } else {
            showError('Failed to load sales: ' + (result.message || 'unknown'));
        }
    } catch (error) {
        console.error('Error loading sales:', error);
        showError('Failed to connect to server. Please check if the backend is running.');
    }
}

// Load medicines for dropdown
async function loadMedicines() {
    try {
        const response = await fetch(`${API_BASE}/medicines`);
        const result = await response.json();

        if (result.success) {
            // only medicines in stock
            medicines = result.data.filter(med => Number(med.stock) > 0);
        } else {
            medicines = [];
        }
    } catch (error) {
        console.error('Error loading medicines:', error);
        medicines = [];
    }
}

// Load employees for dropdown
async function loadEmployees() {
    try {
        const response = await fetch(`${API_BASE}/employees`);
        const result = await response.json();

        if (result.success) {
            employees = result.data.filter(emp => emp.status === 'active');
        } else {
            employees = [];
        }
    } catch (error) {
        console.error('Error loading employees:', error);
        employees = [];
    }
}

// Display sales in table (UPDATED with data-label)
function displaySales(salesList) {
    salesTable.innerHTML = '';

    if (!salesList || salesList.length === 0) {
        salesTable.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px;">No sales found</td></tr>';
        return;
    }

    salesList.forEach(sale => {
        const row = salesTable.insertRow();

        row.innerHTML = `
            <td data-label="Invoice">
                <div class="invoice-number">${sale.invoice_number}
                  <small>${formatDateTime(sale.sale_date)}</small>
                </div>
            </td>
            <td data-label="Customer">${sale.customer_name || 'Walk-in Customer'}</td>
            <td data-label="Phone" class="phone">${sale.customer_phone ? `<a href="tel:${sale.customer_phone}" class="phone-link">${sale.customer_phone}</a>` : '-'}</td>
            <td data-label="Amount" class="amount">₹${parseFloat(sale.final_amount || 0).toFixed(2)}</td>
            <td data-label="Payment"><span class="payment-badge ${sale.payment_method}">${formatPaymentMethod(sale.payment_method)}</span></td>
            <td data-label="Employee">${sale.employee_name || '-'}</td>
            <td data-label="Actions" class="actions">
                <button class="btn-view" onclick="viewSale(${sale.id})" title="View Details">👁️</button>
                <button class="btn-print" onclick="printInvoice(${sale.id})" title="Print Invoice">🖨️</button>
            </td>
        `;
    });
}

// Open sale modal for new sale
function openSaleModal() {
    saleForm.reset();
    currentSaleItems = [];
    updateSaleItemsDisplay();
    populateEmployeeDropdown();
    saleModal.setAttribute('aria-hidden', 'false');
    saleModal.style.display = 'block';
    // focus first input after short delay
    setTimeout(() => {
        const first = saleItemsContainer.querySelector('select, input');
        if (first) first.focus();
    }, 60);
}

// Close sale modal
function closeSaleModal() {
    saleModal.setAttribute('aria-hidden', 'true');
    saleModal.style.display = 'none';
    currentSaleItems = [];
    saleForm.reset();
}

// Populate employee dropdown
function populateEmployeeDropdown() {
    const employeeSelect = document.getElementById('employeeId');
    employeeSelect.innerHTML = '<option value="">Select Employee (Optional)</option>';

    employees.forEach(emp => {
        const option = document.createElement('option');
        option.value = emp.id;
        option.textContent = `${emp.name} (${emp.employee_id || ''})`;
        employeeSelect.appendChild(option);
    });
}

// Add sale item
function addSaleItem() {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'sale-item';

    // build medicine options
    let medOptions = '';
    if (!medicines || medicines.length === 0) {
        medOptions = `<option value="">No medicines available</option>`;
    } else {
        medOptions = `<option value="">Select Medicine</option>` + medicines.map(med =>
            `<option value="${med.id}" data-price="${med.price}" data-stock="${med.stock}">${escapeHtml(med.name)} - ₹${med.price} (Stock: ${med.stock})</option>`
        ).join('');
    }

    itemDiv.innerHTML = `
        <select class="medicine-select" onchange="updateItemPrice(this)" ${!medicines || medicines.length === 0 ? 'disabled' : 'required'}>${medOptions}</select>
        <input type="number" class="quantity-input" placeholder="Qty" min="1" onchange="updateItemTotal(this)" ${!medicines || medicines.length === 0 ? 'disabled' : 'required'}>
        <input type="number" class="price-input" placeholder="Unit Price" step="0.01" min="0" onchange="updateItemTotal(this)" ${!medicines || medicines.length === 0 ? 'disabled' : 'required'}>
        <div class="item-total">₹0.00</div>
        <button type="button" class="btn-remove" onclick="removeItem(this)" title="Remove item">×</button>
    `;

    saleItemsContainer.appendChild(itemDiv);
    // ensure the container scrolls to the bottom for user ease
    saleItemsContainer.scrollTop = saleItemsContainer.scrollHeight;
}

// Update item price when medicine is selected
function updateItemPrice(select) {
    const option = select.selectedOptions[0];
    const priceInput = select.parentElement.querySelector('.price-input');
    const qty = select.parentElement.querySelector('.quantity-input');

    if (option && option.dataset.price) {
        priceInput.value = parseFloat(option.dataset.price).toFixed(2);
        // set default qty to 1 if empty
        if (!qty.value) qty.value = 1;
        updateItemTotal(priceInput);
    } else {
        // reset
        priceInput.value = '';
        updateItemTotal(priceInput);
    }
}

// Update item total
function updateItemTotal(input) {
    const itemDiv = input.parentElement;
    const quantity = parseFloat(itemDiv.querySelector('.quantity-input').value) || 0;
    const price = parseFloat(itemDiv.querySelector('.price-input').value) || 0;
    const total = quantity * price;

    const totalDiv = itemDiv.querySelector('.item-total');
    totalDiv.textContent = `₹${total.toFixed(2)}`;
    updateSaleTotal();
}

// Remove sale item
function removeItem(button) {
    const parent = button.parentElement;
    if (parent) parent.remove();
    updateSaleTotal();
}

// Update sale total
function updateSaleTotal() {
    const items = document.querySelectorAll('.sale-item');
    let subtotal = 0;

    items.forEach(item => {
        const totalText = item.querySelector('.item-total').textContent || '₹0';
        const total = parseFloat(totalText.replace('₹', '')) || 0;
        subtotal += total;
    });

    const discount = parseFloat(document.getElementById('discount').value) || 0;
    const finalAmount = Math.max(0, subtotal - discount);

    document.getElementById('subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('finalAmount').textContent = `₹${finalAmount.toFixed(2)}`;
}

// Update sale items display (starts with one row)
function updateSaleItemsDisplay() {
    saleItemsContainer.innerHTML = '';
    addSaleItem(); // add one item by default
}

// Handle sale form submission
async function handleSaleSubmit(e) {
    e.preventDefault();

    const items = [];
    const saleItems = document.querySelectorAll('.sale-item');

    // Validate and collect items
    for (let itemDiv of saleItems) {
        const medicineSelect = itemDiv.querySelector('.medicine-select');
        const quantityInput = itemDiv.querySelector('.quantity-input');
        const priceInput = itemDiv.querySelector('.price-input');

        if (!medicineSelect || !quantityInput || !priceInput) continue;

        if (medicineSelect.disabled) {
            showError('No medicines available to add.');
            return;
        }

        if (!medicineSelect.value || !quantityInput.value || !priceInput.value) {
            showError('Please fill in all item details');
            return;
        }

        const medicine = medicines.find(m => m.id == medicineSelect.value);
        const quantity = parseInt(quantityInput.value);

        if (!medicine) {
            showError('Selected medicine not found');
            return;
        }

        if (quantity > medicine.stock) {
            showError(`Not enough stock for ${medicine.name}. Available: ${medicine.stock}`);
            return;
        }

        items.push({
            medicine_id: parseInt(medicineSelect.value),
            quantity: quantity,
            unit_price: parseFloat(priceInput.value)
        });
    }

    if (items.length === 0) {
        showError('Please add at least one item');
        return;
    }

    const formData = {
        customer_name: document.getElementById('customerName').value.trim(),
        customer_phone: document.getElementById('customerPhone').value.trim(),
        items: items,
        discount: parseFloat(document.getElementById('discount').value) || 0,
        payment_method: document.getElementById('paymentMethod').value,
        employee_id: document.getElementById('employeeId').value || null
    };

    // Validate phone if provided
    if (formData.customer_phone && !/^\d{10}$/.test(formData.customer_phone.replace(/\D/g, ''))) {
        showError('Please enter a valid 10-digit phone number');
        return;
    }

    try {
        showLoading(true);

        const response = await fetch(`${API_BASE}/sales`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
            showSuccess(`Sale created successfully! Invoice: ${result.invoice_number}`);
            closeSaleModal();
            await loadSales();    // reload table
            await loadMedicines(); // reload medicines to update stock
        } else {
            showError(result.message || 'Failed to create sale');
        }
    } catch (error) {
        console.error('Error creating sale:', error);
        showError('Failed to create sale. Please try again.');
    } finally {
        showLoading(false);
    }
}

// View sale details
async function viewSale(id) {
    try {
        const response = await fetch(`${API_BASE}/sales/${id}`);
        const result = await response.json();

        if (result.success) {
            showSaleDetails(result.sale, result.items);
        } else {
            showError('Failed to load sale details');
        }
    } catch (error) {
        console.error('Error loading sale details:', error);
        showError('Failed to load sale details');
    }
}

// Show sale details in modal/popup
function showSaleDetails(sale, items) {
    const detailsHtml = `
        <div class="sale-details-modal modal" aria-hidden="false">
            <div class="modal-content large sale-details-content">
                <button class="closeBtn" onclick="document.querySelector('.sale-details-modal').remove()" aria-label="Close details">&times;</button>
                <h3>Invoice: ${escapeHtml(sale.invoice_number)}</h3>
                <div class="sale-info">
                    <p><strong>Date:</strong> ${formatDateTime(sale.sale_date)}</p>
                    <p><strong>Customer:</strong> ${escapeHtml(sale.customer_name || 'Walk-in Customer')}</p>
                    <p><strong>Phone:</strong> ${escapeHtml(sale.customer_phone || '-')}</p>
                    <p><strong>Employee:</strong> ${escapeHtml(sale.employee_name || '-')}</p>
                    <p><strong>Payment:</strong> ${formatPaymentMethod(sale.payment_method)}</p>
                </div>
                <h4 style="margin-top: 15px; color: #60a5fa; font-size: 1.1rem;">Items Sold</h4>
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Medicine</th>
                            <th>Qty</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(item => `
                            <tr>
                                <td>${escapeHtml(item.medicine_name)}</td>
                                <td>${item.quantity}</td>
                                <td>₹${parseFloat(item.unit_price).toFixed(2)}</td>
                                <td>₹${parseFloat(item.total_price).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="sale-totals" style="margin-top: 20px; text-align: right; border-top: 1px dashed rgba(255, 255, 255, 0.1);">
                    <p style="margin-top: 10px;"><strong>Subtotal:</strong> ₹${parseFloat(sale.total_amount).toFixed(2)}</p>
                    <p><strong>Discount:</strong> ₹${parseFloat(sale.discount).toFixed(2)}</p>
                    <p style="font-size: 1.2rem; color: #60e3a0;"><strong>Final Amount:</strong> ₹${parseFloat(sale.final_amount).toFixed(2)}</p>
                </div>
            </div>
        </div>
    `;

    const detailsDiv = document.createElement('div');
    detailsDiv.innerHTML = detailsHtml;
    // Append the modal directly to the body
    document.body.appendChild(detailsDiv.firstChild); 
}

// Print invoice (placeholder)
function printInvoice(id) {
    window.open(`/api/sales/${id}/invoice`, '_blank');
    showSuccess('Invoice sent to printer');
}

// Handle search
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();

    if (!searchTerm) {
        displaySales(sales);
        return;
    }

    const filteredSales = sales.filter(sale =>
        (sale.invoice_number && sale.invoice_number.toLowerCase().includes(searchTerm)) ||
        (sale.customer_name && sale.customer_name.toLowerCase().includes(searchTerm)) ||
        (sale.customer_phone && sale.customer_phone.includes(searchTerm)) ||
        (sale.employee_name && sale.employee_name.toLowerCase().includes(searchTerm))
    );

    displaySales(filteredSales);
}

// Utility functions
function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN') + ' ' + date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatPaymentMethod(method) {
    const methods = { 'cash': 'Cash', 'card': 'Card', 'upi': 'UPI', 'pending': 'Pending' };
    return methods[method] || (method || '-');
}

function showLoading(show) {
    if (show) document.body.style.cursor = 'wait'; else document.body.style.cursor = 'default';
}

function showError(message) {
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.innerHTML = `<span>❌ ${escapeHtml(message)}</span><button onclick="this.parentElement.remove()">×</button>`;
    document.body.appendChild(notification);
    setTimeout(() => { if (notification.parentElement) notification.remove(); }, 5000);
}

function showSuccess(message) {
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.innerHTML = `<span>✅ ${escapeHtml(message)}</span><button onclick="this.parentElement.remove()">×</button>`;
    document.body.appendChild(notification);
    setTimeout(() => { if (notification.parentElement) notification.remove(); }, 3000);
}

// Helper: escape HTML to avoid injecting markup from backend
function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
}