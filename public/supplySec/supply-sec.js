// Supplier Management JavaScript
const API_BASE = '/api';

let suppliers = [];
let editingSupplierId = null;

// DOM Elements
const supplierTable = document.getElementById('supplierTable').getElementsByTagName('tbody')[0];
const searchInput = document.getElementById('searchInput');
const addSupplierBtn = document.getElementById('addSupplierBtn');
const supplierModal = document.getElementById('supplierModal');
const supplierForm = document.getElementById('supplierForm');
const closeBtn = document.querySelector('.closeBtn');
const modalTitle = document.getElementById('modalTitle');
const saveBtn = document.getElementById('saveBtn');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadSuppliers();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    addSupplierBtn.addEventListener('click', () => openSupplierModal());
    closeBtn.addEventListener('click', () => closeSupplierModal());
    supplierForm.addEventListener('submit', handleSupplierSubmit);
    searchInput.addEventListener('input', handleSearch);
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === supplierModal) {
            closeSupplierModal();
        }
    });
}

// Load all suppliers from API
async function loadSuppliers() {
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE}/suppliers`);
        const result = await response.json();
        
        if (result.success) {
            suppliers = result.data;
            displaySuppliers(suppliers);
        } else {
            showError('Failed to load suppliers: ' + result.message);
        }
    } catch (error) {
        console.error('Error loading suppliers:', error);
        showError('Failed to connect to server. Please check if the backend is running.');
    } finally {
        showLoading(false);
    }
}

// Display suppliers in table
function displaySuppliers(supplierList) {
    supplierTable.innerHTML = '';
    
    if (supplierList.length === 0) {
        supplierTable.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #9aa7b2;">No suppliers found</td></tr>';
        return;
    }
    
    supplierList.forEach(supplier => {
        const row = supplierTable.insertRow();
        
        // Apply row styling based on status
        if (supplier.status === 'inactive') {
            row.classList.add('inactive-row');
        }
        
        row.innerHTML = `
            <td data-label="Supplier Name">
                <div class="supplier-name">
                    ${supplier.name}
                    ${supplier.status === 'inactive' ? '<span class="inactive-badge">Inactive</span>' : ''}
                </div>
            </td>
            <td data-label="Contact Person" class="contact-person">${supplier.contact_person}</td>
            <td data-label="Phone" class="phone">
                <a href="tel:${supplier.phone}" class="phone-link">${supplier.phone}</a>
            </td>
            <td data-label="Email" class="email">
                ${supplier.email ? `<a href="mailto:${supplier.email}" class="email-link">${supplier.email}</a>` : '<span class="no-data">-</span>'}
            </td>
            <td data-label="Address" class="address">${supplier.address || '<span class="no-data">-</span>'}</td>
            <td data-label="Status" class="status">
                <span class="status-badge ${supplier.status === 'active' ? 'active' : 'inactive'}">
                    ${supplier.status}
                </span>
            </td>
            <td data-label="Actions" class="actions">
                <button class="btn-edit" onclick="editSupplier(${supplier.id})" title="Edit">
                    <span class="icon">✏️</span>
                </button>
                ${supplier.status === 'active' ? 
                    `<button class="btn-deactivate" onclick="deactivateSupplier(${supplier.id})" title="Deactivate">
                        <span class="icon">🚫</span>
                    </button>` : 
                    `<button class="btn-activate" onclick="activateSupplier(${supplier.id})" title="Activate">
                        <span class="icon">✅</span>
                    </button>`
                }
                <button class="btn-delete" onclick="deleteSupplier(${supplier.id})" title="Permanently Delete">
                    <span class="icon">🗑️</span>
                </button>
            </td>
        `;
    });
}

// Open supplier modal for add/edit
function openSupplierModal(supplier = null) {
    editingSupplierId = supplier ? supplier.id : null;
    modalTitle.textContent = supplier ? 'Edit Supplier' : 'Add Supplier';
    saveBtn.textContent = supplier ? 'Update' : 'Save';
    
    if (supplier) {
        document.getElementById('supplierName').value = supplier.name;
        document.getElementById('contactPerson').value = supplier.contact_person;
        document.getElementById('phone').value = supplier.phone;
        document.getElementById('email').value = supplier.email || '';
        document.getElementById('address').value = supplier.address || '';
        document.getElementById('status').value = supplier.status || 'active';
    } else {
        supplierForm.reset();
        document.getElementById('status').value = 'active';
    }
    
    supplierModal.style.display = 'block';
}

// Close supplier modal
function closeSupplierModal() {
    supplierModal.style.display = 'none';
    editingSupplierId = null;
    supplierForm.reset();
}

// Handle supplier form submission
async function handleSupplierSubmit(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('supplierName').value.trim(),
        contact_person: document.getElementById('contactPerson').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        email: document.getElementById('email').value.trim(),
        address: document.getElementById('address').value.trim(),
        status: document.getElementById('status').value
    };
    
    // Validation
    if (!formData.name || !formData.contact_person || !formData.phone) {
        showError('Please fill in all required fields (Name, Contact Person, Phone)');
        return;
    }
    
    // Validate phone number
    if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
        showError('Please enter a valid 10-digit phone number');
        return;
    }
    
    // Validate email if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        showError('Please enter a valid email address');
        return;
    }
    
    try {
        showLoading(true);
        
        const url = editingSupplierId 
            ? `${API_BASE}/suppliers/${editingSupplierId}` 
            : `${API_BASE}/suppliers`;
        
        const method = editingSupplierId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess(result.message);
            closeSupplierModal();
            loadSuppliers(); // Reload the table
        } else {
            showError(result.message);
        }
    } catch (error) {
        console.error('Error saving supplier:', error);
        showError('Failed to save supplier. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Edit supplier
function editSupplier(id) {
    const supplier = suppliers.find(sup => sup.id === id);
    if (supplier) {
        openSupplierModal(supplier);
    }
}

// Deactivate supplier (soft delete)
async function deactivateSupplier(id) {
    const supplier = suppliers.find(sup => sup.id === id);
    if (!supplier) return;
    
    const confirmDeactivate = confirm(`Are you sure you want to deactivate "${supplier.name}"? This will mark the supplier as inactive but keep all records.`);
    if (!confirmDeactivate) return;
    
    try {
        showLoading(true);
        
        const response = await fetch(`${API_BASE}/suppliers/${id}/deactivate`, {
            method: 'PUT'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess(result.message);
            loadSuppliers(); // Reload the table
        } else {
            showError(result.message);
        }
    } catch (error) {
        console.error('Error deactivating supplier:', error);
        showError('Failed to deactivate supplier. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Permanently delete supplier
async function deleteSupplier(id) {
    const supplier = suppliers.find(sup => sup.id === id);
    if (!supplier) return;
    
    const confirmDelete = confirm(`⚠️ PERMANENT DELETE WARNING ⚠️\n\nAre you sure you want to PERMANENTLY delete "${supplier.name}"?\n\nThis action cannot be undone and will:\n- Remove all supplier records\n- Fail if any medicines are linked to this supplier\n\nType "DELETE" to confirm:`);
    
    if (!confirmDelete) return;
    
    // Additional confirmation for permanent deletion
    const confirmation = prompt('Type "DELETE" to confirm permanent deletion:');
    if (confirmation !== 'DELETE') {
        showError('Deletion cancelled. You must type "DELETE" to confirm.');
        return;
    }
    
    try {
        showLoading(true);
        
        const response = await fetch(`${API_BASE}/suppliers/${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess(result.message);
            loadSuppliers(); // Reload the table
        } else {
            showError(result.message);
        }
    } catch (error) {
        console.error('Error deleting supplier:', error);
        showError('Failed to delete supplier. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Activate supplier
async function activateSupplier(id) {
    const supplier = suppliers.find(sup => sup.id === id);
    if (!supplier) return;
    
    try {
        showLoading(true);
        
        const response = await fetch(`${API_BASE}/suppliers/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...supplier,
                status: 'active'
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess('Supplier activated successfully');
            loadSuppliers(); // Reload the table
        } else {
            showError(result.message);
        }
    } catch (error) {
        console.error('Error activating supplier:', error);
        showError('Failed to activate supplier. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Handle search
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    if (!searchTerm) {
        displaySuppliers(suppliers);
        return;
    }
    
    const filteredSuppliers = suppliers.filter(supplier => 
        supplier.name.toLowerCase().includes(searchTerm) ||
        supplier.contact_person.toLowerCase().includes(searchTerm) ||
        supplier.phone.includes(searchTerm) ||
        (supplier.email && supplier.email.toLowerCase().includes(searchTerm)) ||
        (supplier.address && supplier.address.toLowerCase().includes(searchTerm))
    );
    
    displaySuppliers(filteredSuppliers);
}

// Utility functions (Updated to use CSS classes instead of injecting styles)
function showLoading(show) {
    if (show) {
        document.body.style.cursor = 'wait';
        // Add loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'loading-indicator';
        loadingIndicator.innerHTML = '<div class="spinner"></div><span>Loading...</span>';
        document.body.appendChild(loadingIndicator);
    } else {
        document.body.style.cursor = 'default';
        // Remove loading indicator
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }
    }
}

function showError(message) {
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.innerHTML = `
        <span class="notification-icon">❌</span>
        <span class="notification-message">${message}</span>
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
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}
