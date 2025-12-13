// emp-section.js — full, robust, salary-enabled, supplier-styled logic
const API_BASE = 'http://localhost:5000/api';

let employees = [];
let editingEmployeeId = null;

// DOM refs
const employeeTable = document.getElementById('employeeTable').getElementsByTagName('tbody')[0];
const searchInput = document.getElementById('searchInput');
const addEmployeeBtn = document.getElementById('addEmployeeBtn');
const employeeModal = document.getElementById('employeeModal');
const employeeForm = document.getElementById('employeeForm');
const closeBtn = document.querySelector('.closeBtn');
const modalTitle = document.getElementById('modalTitle');
const saveBtn = document.getElementById('saveBtn');

// init
document.addEventListener('DOMContentLoaded', () => {
  loadEmployees();
  setupEventListeners();
});

function setupEventListeners() {
  addEmployeeBtn.addEventListener('click', () => openEmployeeModal());
  closeBtn.addEventListener('click', () => closeEmployeeModal());
  employeeForm.addEventListener('submit', handleEmployeeSubmit);
  searchInput.addEventListener('input', handleSearch);

  // close modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === employeeModal) closeEmployeeModal();
  });
}

/* ------------------------------
   Load employees from backend
   ------------------------------ */
async function loadEmployees() {
  try {
    showLoading(true);
    const res = await fetch(`${API_BASE}/employees`);
    const result = await res.json();
    if (result && result.success) {
      employees = result.data || [];
      displayEmployees(employees);
    } else {
      showError('Failed to load employees: ' + (result?.message || 'Unknown error'));
    }
  } catch (err) {
    console.error('Error loading employees:', err);
    showError('Failed to connect to server. Please check if backend is running.');
  } finally {
    showLoading(false);
  }
}

/* ------------------------------
   Render table (Updated with data-label for mobile view)
   ------------------------------ */
function displayEmployees(list) {
  employeeTable.innerHTML = '';

  if (!list || list.length === 0) {
    employeeTable.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px; color:#9aa7b2;">No employees found</td></tr>';
    return;
  }

  list.forEach(emp => {
    const row = employeeTable.insertRow();

    if (emp.status === 'inactive') row.classList.add('inactive-row');

    row.innerHTML = `
      <td data-label="ID">
        <div class="employee-id">
          ${escapeHtml(emp.employee_id || '-')}
          ${emp.status === 'inactive' ? '<span class="inactive-badge">Deactivated</span>' : ''}
        </div>
      </td>
      <td data-label="Name / Joined">
        <div class="employee-name ${emp.status === 'inactive' ? 'inactive-text' : ''}">
          ${escapeHtml(emp.name || '-')}
          ${emp.hire_date ? `<small style="display:block;color:#9aa7b2;font-weight:500;margin-top:4px;">Joined: ${formatDate(emp.hire_date)}</small>` : ''}
        </div>
      </td>
      <td data-label="Position"><span class="${emp.status === 'inactive' ? 'inactive-position' : ''}">${escapeHtml(emp.position || '-')}</span></td>
      <td data-label="Phone" class="${emp.status === 'inactive' ? 'inactive-text' : ''}"><a href="tel:${escapeHtml(emp.phone || '')}" class="phone-link ${emp.status === 'inactive' ? 'inactive-link' : ''}">${escapeHtml(emp.phone || '-')}</a></td>
      <td data-label="Email" class="${emp.status === 'inactive' ? 'inactive-text' : ''}">${emp.email ? `<a href="mailto:${escapeHtml(emp.email)}" class="email-link ${emp.status === 'inactive' ? 'inactive-link' : ''}">${escapeHtml(emp.email)}</a>` : '<span class="no-data">-</span>'}</td>
      <td data-label="Status">
        <span class="status-badge ${emp.status === 'active' ? 'active' : 'inactive'}">${escapeHtml(emp.status || 'active')}</span>
      </td>
      <td data-label="Actions" class="actions">
        <button class="btn-edit" onclick="editEmployee(${emp.id})" title="Edit">✏️</button>
        <button class="btn-delete" onclick="handleDeleteClick(${emp.id})" title="${emp.status === 'active' ? 'Deactivate' : 'Permanently Delete'}">
          ${emp.status === 'active' ? '🚫' : '🗑️'}
        </button>
        ${emp.status === 'inactive' ? `<button class="btn-activate" onclick="activateEmployee(${emp.id})" title="Activate">✅</button>` : ''}
      </td>
    `;
  });
}

/* ------------------------------
   Open / Close modal
   ------------------------------ */
function openEmployeeModal(employee = null) {
  editingEmployeeId = employee ? employee.id : null;
  modalTitle.textContent = employee ? 'Edit Employee' : 'Add Employee';
  saveBtn.textContent = employee ? 'Update' : 'Save';

  if (employee) {
    // prefill (including salary) — salary exists in DB but we never show it on table
    document.getElementById('employeeId').value = employee.employee_id || '';
    document.getElementById('name').value = employee.name || '';
    document.getElementById('position').value = employee.position || '';
    document.getElementById('phone').value = employee.phone || '';
    document.getElementById('email').value = employee.email || '';
    document.getElementById('salary').value = (employee.salary !== undefined && employee.salary !== null) ? employee.salary : '';
    document.getElementById('hireDate').value = employee.hire_date || '';
    document.getElementById('statusSelect').value = employee.status || 'active';
    document.getElementById('employeeId').disabled = true;
  } else {
    employeeForm.reset();
    document.getElementById('employeeId').disabled = false;
    generateNextEmployeeId();
    document.getElementById('statusSelect').value = 'active';
  }

  employeeModal.style.display = 'block';
}

function closeEmployeeModal() {
  employeeModal.style.display = 'none';
  editingEmployeeId = null;
  employeeForm.reset();
  document.getElementById('employeeId').disabled = false;
}

/* ------------------------------
   Auto-generate next EMP ID
   ------------------------------ */
function generateNextEmployeeId() {
  try {
    const existing = employees.map(e => {
      const m = (e.employee_id || '').match(/EMP(\d+)/);
      return m ? parseInt(m[1], 10) : 0;
    });
    const next = Math.max(...existing, 0) + 1;
    document.getElementById('employeeId').value = `EMP${String(next).padStart(3, '0')}`;
  } catch (err) {
    document.getElementById('employeeId').value = 'EMP001';
  }
}

/* ------------------------------
   Submit (create/update) — includes salary
   ------------------------------ */
async function handleEmployeeSubmit(e) {
  e.preventDefault();

  // gather and validate
  const empIdVal = document.getElementById('employeeId').value.trim();
  const nameVal = document.getElementById('name').value.trim();
  const positionVal = document.getElementById('position').value.trim();
  const phoneVal = document.getElementById('phone').value.trim();
  const emailVal = document.getElementById('email').value.trim();
  const salaryRaw = document.getElementById('salary').value;
  const hireDateVal = document.getElementById('hireDate').value || null;
  const statusVal = document.getElementById('statusSelect').value || 'active';

  // validations
  if (!empIdVal || !nameVal || !positionVal || !phoneVal) {
    showError('Please fill required fields: Employee ID, Name, Position, Phone');
    return;
  }
  if (!/^EMP\d{3}$/.test(empIdVal)) {
    showError('Employee ID must be in format EMP001');
    return;
  }
  if (!/^\d{10}$/.test(phoneVal.replace(/\D/g, ''))) {
    showError('Please enter a valid 10-digit phone number');
    return;
  }
  if (emailVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
    showError('Please enter a valid email address');
    return;
  }

  // salary optional, but if provided must be non-negative number
  let salaryVal = null;
  if (salaryRaw !== '' && salaryRaw !== null && salaryRaw !== undefined) {
    const parsed = Number(salaryRaw);
    if (Number.isNaN(parsed) || parsed < 0) {
      showError('Salary must be a non-negative number');
      return;
    }
    salaryVal = parsed;
  }

  const payload = {
    employee_id: empIdVal,
    name: nameVal,
    position: positionVal,
    phone: phoneVal,
    email: emailVal || null,
    salary: salaryVal,            // can be null
    hire_date: hireDateVal,
    status: statusVal
  };

  try {
    showLoading(true);
    const url = editingEmployeeId ? `${API_BASE}/employees/${editingEmployeeId}` : `${API_BASE}/employees`;
    const method = editingEmployeeId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    if (result && result.success) {
      showSuccess(result.message || (editingEmployeeId ? 'Employee updated' : 'Employee added'));
      closeEmployeeModal();
      await loadEmployees();
    } else {
      showError(result?.message || 'Operation failed');
    }
  } catch (err) {
    console.error('Error saving employee:', err);
    showError('Failed to save employee. Please try again.');
  } finally {
    showLoading(false);
  }
}

/* ------------------------------
   Edit helper — open modal with prefilled data
   ------------------------------ */
function editEmployee(id) {
  const emp = employees.find(e => e.id === id);
  if (emp) openEmployeeModal(emp);
}

/* ------------------------------
   Delete / Deactivate logic
   Backend behavior (per server.js):
   - DELETE /api/employees/:id  -> if active => set status=inactive
   - DELETE /api/employees/:id?permanent=true -> permanent deletion
   ------------------------------ */
function handleDeleteClick(id) {
  const emp = employees.find(e => e.id === id);
  if (!emp) return;

  if (emp.status === 'active') {
    const confirmDeactivate = confirm(`Are you sure you want to deactivate "${emp.name}"? This will mark them inactive but keep their data.`);
    if (!confirmDeactivate) return;
    performDelete(id, false);
  } else {
    const confirmPerm = confirm(`"${emp.name}" is already deactivated.\nDo you want to permanently delete this employee? This cannot be undone.`);
    if (!confirmPerm) return;

    const typed = prompt('Type "DELETE" to confirm permanent deletion:');
    if (typed !== 'DELETE') {
      showError('Permanent deletion cancelled. You must type "DELETE" to confirm.');
      return;
    }
    performDelete(id, true);
  }
}

async function performDelete(id, permanent = false) {
  try {
    showLoading(true);
    const url = permanent ? `${API_BASE}/employees/${id}?permanent=true` : `${API_BASE}/employees/${id}`;
    const res = await fetch(url, { method: 'DELETE' });
    const result = await res.json();
    if (result && result.success) {
      showSuccess(result.message || (permanent ? 'Employee permanently deleted' : 'Employee deactivated'));
      await loadEmployees();
    } else {
      showError(result?.message || 'Delete operation failed');
    }
  } catch (err) {
    console.error('Error deleting employee:', err);
    showError('Failed to delete employee. Please try again.');
  } finally {
    showLoading(false);
  }
}

/* ------------------------------
   Activate employee (PUT update status)
   ------------------------------ */
async function activateEmployee(id) {
  const emp = employees.find(e => e.id === id);
  if (!emp) return;
  const confirmAct = confirm(`Reactivate "${emp.name}"?`);
  if (!confirmAct) return;

  try {
    showLoading(true);
    // Send only the fields backend expects; include salary too if present in emp
    const payload = { ...emp, status: 'active' };
    const res = await fetch(`${API_BASE}/employees/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result && result.success) {
      showSuccess('Employee activated successfully');
      await loadEmployees();
    } else {
      showError(result?.message || 'Activation failed');
    }
  } catch (err) {
    console.error('Error activating employee:', err);
    showError('Failed to activate employee. Please try again.');
  } finally {
    showLoading(false);
  }
}

/* ------------------------------
   Search/filter
   ------------------------------ */
function handleSearch(e) {
  const term = (e.target.value || '').toLowerCase();
  if (!term) {
    displayEmployees(employees);
    return;
  }

  const filtered = employees.filter(emp =>
    (emp.employee_id || '').toLowerCase().includes(term) ||
    (emp.name || '').toLowerCase().includes(term) ||
    (emp.position || '').toLowerCase().includes(term) ||
    (emp.phone || '').toLowerCase().includes(term) ||
    (emp.email || '').toLowerCase().includes(term)
  );

  displayEmployees(filtered);
}

/* ------------------------------
   Utilities: formatting, loading, notifications
   ------------------------------ */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-IN');
}

function showLoading(show) {
  if (show) {
    document.body.style.cursor = 'wait';
    if (!document.getElementById('loading-indicator')) {
      const loadingIndicator = document.createElement('div');
      loadingIndicator.id = 'loading-indicator';
      loadingIndicator.innerHTML = '<div class="spinner"></div><span>Loading...</span>';
      document.body.appendChild(loadingIndicator);
    }
  } else {
    document.body.style.cursor = 'default';
    const ld = document.getElementById('loading-indicator');
    if (ld) ld.remove();
  }
}

function showError(message) {
  createNotification('error', message);
}

function showSuccess(message) {
  createNotification('success', message);
}

function createNotification(type, message) {
  const notification = document.createElement('div');
  notification.className = 'notification ' + (type === 'error' ? 'error' : 'success');
  notification.innerHTML = `
    <span class="notification-icon">${type === 'error' ? '❌' : '✅'}</span>
    <span class="notification-message">${escapeHtml(message)}</span>
    <button class="notification-close" title="Close">×</button>
  `;
  document.body.appendChild(notification);

  const closeBtn = notification.querySelector('.notification-close');
  if (closeBtn) closeBtn.addEventListener('click', () => notification.remove());

  setTimeout(() => {
    if (notification.parentElement) notification.remove();
  }, type === 'error' ? 6000 : 3000);
}

/* Helper to avoid XSS when injecting values */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}