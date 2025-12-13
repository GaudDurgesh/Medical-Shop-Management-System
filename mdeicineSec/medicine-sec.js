// Medicine Management JavaScript
const API_BASE = 'http://localhost:5000/api';

let medicines = [];
let editingMedicineId = null;

// DOM Elements
const medicineTable = document.getElementById('medicineTable').getElementsByTagName('tbody')[0];
const searchInput = document.getElementById('searchInput');
const addMedicineBtn = document.getElementById('addMedicineBtn');
const medicineModal = document.getElementById('medicineModal');
const medicineForm = document.getElementById('medicineForm');
const closeBtn = document.querySelector('.closeBtn');
const modalTitle = document.getElementById('modalTitle');
const saveBtn = document.getElementById('saveBtn');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadMedicines();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    addMedicineBtn.addEventListener('click', () => openMedicineModal());
    closeBtn.addEventListener('click', () => closeMedicineModal());
    medicineForm.addEventListener('submit', handleMedicineSubmit);
    searchInput.addEventListener('input', handleSearch);
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === medicineModal) {
            closeMedicineModal();
        }
    });
}

// Load all medicines from API
async function loadMedicines() {
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE}/medicines`);
        const result = await response.json();
        
        if (result.success) {
            medicines = result.data;
            displayMedicines(medicines);
        } else {
            showError('Failed to load medicines: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error loading medicines:', error);
        showError('Failed to connect to server. Please check if the backend is running.');
    } finally {
        showLoading(false);
    }
}

// Display medicines in table (UPDATED with data-label)
function displayMedicines(medicineList) {
    medicineTable.innerHTML = '';
    
    if (medicineList.length === 0) {
        medicineTable.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px; color: #9aa7b2; font-style: italic;">No medicines found</td></tr>';
        return;
    }
    
    medicineList.forEach(medicine => {
        const row = medicineTable.insertRow();
        
        // Check if medicine is expiring soon (within 30 days)
        const expiryDate = new Date(medicine.expiry);
        const today = new Date();
        // Reset hours for consistent calculation
        expiryDate.setHours(0,0,0,0);
        today.setHours(0,0,0,0);
        const daysToExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        const isExpiringSoon = daysToExpiry <= 30 && daysToExpiry > 0;
        const isExpired = daysToExpiry <= 0;
        const isLowStock = medicine.stock <= 30;
        
        // Apply row styling based on status
        if (isExpired) {
            row.classList.add('expired-row');
        } else if (isExpiringSoon) {
            row.classList.add('expiring-row');
        } else if (isLowStock) {
            row.classList.add('low-stock-row');
        }
        
        row.innerHTML = `
            <td data-label="Name / Batch">
                <div class="medicine-name">
                    ${escapeHtml(medicine.name)}
                    ${medicine.batch_number ? `<small>Batch: ${escapeHtml(medicine.batch_number)}</small>` : ''}
                </div>
            </td>
            <td data-label="Category"><span class="category-badge">${escapeHtml(medicine.category)}</span></td>
            <td data-label="Price" class="price">₹${parseFloat(medicine.price).toFixed(2)}</td>
            <td data-label="Stock" class="stock ${isLowStock ? 'low-stock' : ''}">
                ${medicine.stock}
                ${isLowStock ? '<span class="warning-icon">⚠️</span>' : ''}
            </td>
            <td data-label="Expiry" class="expiry ${isExpired ? 'expired' : isExpiringSoon ? 'expiring' : ''}">
                ${formatDate(medicine.expiry)}
                ${isExpired ? '<span class="expired-badge">Expired</span>' : 
                  isExpiringSoon ? `<span class="expiring-badge">${daysToExpiry} days left</span>` : ''}
            </td>
            <td data-label="Actions" class="actions">
                <button class="btn-edit" onclick="editMedicine(${medicine.id})" title="Edit Medicine">
                    ✏️
                </button>
                <button class="btn-delete" onclick="deleteMedicine(${medicine.id})" title="Delete Medicine">
                    🗑️
                </button>
            </td>
        `;
    });
}

// Open medicine modal for add/edit
function openMedicineModal(medicine = null) {
    editingMedicineId = medicine ? medicine.id : null;
    modalTitle.textContent = medicine ? 'Edit Medicine' : 'Add New Medicine';
    saveBtn.textContent = medicine ? 'Update Medicine' : 'Save Medicine';
    
    const medName = document.getElementById('medName');
    const medCategory = document.getElementById('medCategory');
    const medPrice = document.getElementById('medPrice');
    const medStock = document.getElementById('medStock');
    const medExpiry = document.getElementById('medExpiry');
    const medBatch = document.getElementById('medBatch'); // new batch field
    
    if (medicine) {
        medName.value = medicine.name || '';
        medCategory.value = medicine.category || '';
        medPrice.value = medicine.price != null ? medicine.price : '';
        medStock.value = medicine.stock != null ? medicine.stock : '';
        // expiry stored as ISO or yyyy-mm-dd — set value safely
        medExpiry.value = medicine.expiry ? new Date(medicine.expiry).toISOString().split('T')[0] : '';
        medBatch.value = medicine.batch_number || ''; // prefill batch when editing
    } else {
        medicineForm.reset();
        // Set default expiry date to 1 year from now
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        medExpiry.value = nextYear.toISOString().split('T')[0];
        medBatch.value = ''; // clear batch for add
    }
    
    medicineModal.style.display = 'block';
    // Focus on first input
    setTimeout(() => medName.focus(), 100);
}

// Close medicine modal
function closeMedicineModal() {
    medicineModal.style.display = 'none';
    editingMedicineId = null;
    medicineForm.reset();
}

// Handle medicine form submission
async function handleMedicineSubmit(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('medName').value.trim(),
        category: document.getElementById('medCategory').value.trim(),
        price: parseFloat(document.getElementById('medPrice').value),
        stock: parseInt(document.getElementById('medStock').value),
        expiry: document.getElementById('medExpiry').value,
        batch_number: document.getElementById('medBatch').value.trim() // include batch_number
    };
    
    // Validation
    if (!formData.name || !formData.category || isNaN(formData.price) || isNaN(formData.stock) || !formData.expiry || !formData.batch_number) {
        showError('Please fill in all required fields (including batch number)');
        return;
    }
    
    if (formData.price <= 0) {
        showError('Price must be greater than 0');
        return;
    }
    
    if (formData.stock < 0) {
        showError('Stock cannot be negative');
        return;
    }
    
    // Check if expiry date is in the future
    const expiryDate = new Date(formData.expiry);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for accurate comparison
    
    if (expiryDate <= today) {
        const confirmResult = window.confirm('⚠️ Warning: The expiry date is in the past or today.\n\nThis medicine may be expired or expiring soon.\nAre you sure you want to continue?');
        if (!confirmResult) return;
    }
    
    // Check if expiry is very soon (within 7 days)
    const daysToExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    if (daysToExpiry > 0 && daysToExpiry <= 7) {
        const confirmSoon = window.confirm(`⚠️ Notice: This medicine expires in ${daysToExpiry} day(s).\n\nAre you sure you want to add it to inventory?`);
        if (!confirmSoon) return;
    }
    
    try {
        showLoading(true);
        
        const url = editingMedicineId 
            ? `${API_BASE}/medicines/${editingMedicineId}` 
            : `${API_BASE}/medicines`;
        
        const method = editingMedicineId ? 'PUT' : 'POST';
        
        // Send batch_number along with other fields — backend that ignores unknown fields will be fine.
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess(result.message || (editingMedicineId ? 'Medicine updated' : 'Medicine added'));
            closeMedicineModal();
            loadMedicines(); // Reload the table
        } else {
            showError(result.message || 'Failed to save medicine');
        }
    } catch (error) {
        console.error('Error saving medicine:', error);
        showError('Failed to save medicine. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Edit medicine
function editMedicine(id) {
    const medicine = medicines.find(m => m.id === id);
    if (medicine) {
        openMedicineModal(medicine);
    }
}

// Delete medicine
async function deleteMedicine(id) {
    const medicine = medicines.find(m => m.id === id);
    if (!medicine) return;
    
    const confirmDelete = confirm(`⚠️ Delete Medicine\n\nAre you sure you want to permanently delete "${medicine.name}"?\n\nThis action cannot be undone and will:\n- Remove the medicine from inventory\n- Delete all associated records\n\nClick OK to confirm deletion.`);
    if (!confirmDelete) return;
    
    try {
        showLoading(true);
        
        const response = await fetch(`${API_BASE}/medicines/${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess(result.message || 'Medicine deleted');
            loadMedicines(); // Reload the table
        } else {
            showError(result.message || 'Failed to delete medicine');
        }
    } catch (error) {
        console.error('Error deleting medicine:', error);
        showError('Failed to delete medicine. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Handle search
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    if (!searchTerm) {
        displayMedicines(medicines);
        return;
    }
    
    const filteredMedicines = medicines.filter(medicine => 
        (medicine.name && medicine.name.toLowerCase().includes(searchTerm)) ||
        (medicine.category && medicine.category.toLowerCase().includes(searchTerm)) ||
        (medicine.batch_number && medicine.batch_number.toLowerCase().includes(searchTerm)) ||
        (medicine.expiry && medicine.expiry.includes(searchTerm)) ||
        (medicine.price != null && medicine.price.toString().includes(searchTerm))
    );
    
    displayMedicines(filteredMedicines);
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showLoading(show) {
    if (show) {
        document.body.style.cursor = 'wait';
        // Add loading overlay
        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="loading-content">
                <div class="spinner"></div>
                <span>Loading medicines...</span>
            </div>
        `;
        document.body.appendChild(loadingOverlay);
    } else {
        document.body.style.cursor = 'default';
        // Remove loading overlay
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.remove();
        }
    }
}

function showError(message) {
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.innerHTML = `
        <span class="notification-icon">❌</span>
        <span class="notification-message">${escapeHtml(message)}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function showSuccess(message) {
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.innerHTML = `
        <span class="notification-icon">✅</span>
        <span class="notification-message">${escapeHtml(message)}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}

// Simple HTML escape to avoid injection issues in messages/table
function escapeHtml(unsafe) {
    if (unsafe == null) return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}