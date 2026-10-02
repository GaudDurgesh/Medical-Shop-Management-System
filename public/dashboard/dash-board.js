// Dashboard JavaScript
const API_BASE = '/api';

let salesChart = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
    setupEventListeners();
    
    // Refresh data every 5 minutes
    setInterval(loadDashboardData, 300000);
});

// Setup event listeners
function setupEventListeners() {
    // Quick action buttons
    document.getElementById('addMedicineBtn').addEventListener('click', () => {
        window.location.href = '/mdeicineSec/medicine-sec.html';
    });
    
  document.getElementById("logout-btn")?.addEventListener("click",  () => {
    // Clear session or token
    localStorage.removeItem("authToken");
    sessionStorage.clear();

    // Redirect to login page
    window.location.href = "/loginpage/admin-login.html"; // Change to your actual login page name
  });


    document.getElementById('addEmpBtn').addEventListener('click', () => {
        window.location.href = '/empSection/emp-section.html';
    });
    
    document.getElementById('exportStock').addEventListener('click', exportStockToCSV);
    
    // Search functionality
    document.getElementById('search').addEventListener('input', handleGlobalSearch);
}

// Load all dashboard data
async function loadDashboardData() {
    try {
        await Promise.all([
            loadDashboardStats(),
            loadSalesChart(),
            loadMedicineStock(),
            loadAlerts()
        ]);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showError('Failed to load dashboard data');
    }
}

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        const response = await fetch(`${API_BASE}/dashboard/stats`);
        const result = await response.json();
        
        if (result.success) {
            const stats = result.stats;
            
            // Update dashboard cards
            document.getElementById('today-rev').textContent = formatCurrency(stats.todayRevenue);
            document.getElementById('inventory-val').textContent = formatCurrency(stats.totalInventoryValue);
            
            // Update sidebar quick stats if they exist
            const totalSalesEl = document.getElementById('total-sales');
            const lowStockCountEl = document.getElementById('low-stock-count');
            const expiringCountEl = document.getElementById('expiring-count');
            
            if (totalSalesEl) totalSalesEl.textContent = `₹${(stats.todayRevenue / 1000).toFixed(1)}k`;
            if (lowStockCountEl) lowStockCountEl.textContent = stats.lowStockCount;
            if (expiringCountEl) expiringCountEl.textContent = stats.expiringCount;
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// Load sales chart data
async function loadSalesChart() {
    try {
        const response = await fetch(`${API_BASE}/dashboard/sales-chart`);
        const result = await response.json();
        
        if (result.success) {
            renderSalesChart(result.data);
        }
    } catch (error) {
        console.error('Error loading sales chart:', error);
    }
}

// Render sales chart with dashboard theme colors
function renderSalesChart(data) {
    const ctx = document.getElementById('salesChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (salesChart) {
        salesChart.destroy();
    }
    
    const labels = data.map(item => {
        const date = new Date(item.date);
        return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    });
    
    const revenues = data.map(item => item.revenue);
    
    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Daily Revenue',
                data: revenues,
                borderColor: '#60a5fa',
                backgroundColor: 'rgba(96, 165, 250, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#6ee7b7',
                pointBorderColor: '#60a5fa',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#9aa7b2',
                        callback: function(value) {
                            return '₹' + (value / 1000).toFixed(0) + 'k';
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#9aa7b2'
                    }
                }
            },
            elements: {
                point: {
                    hoverBackgroundColor: '#6ee7b7',
                    hoverBorderColor: '#60a5fa'
                }
            }
        }
    });
}

// Load medicine stock for table
async function loadMedicineStock() {
    try {
        const response = await fetch(`${API_BASE}/medicines`);
        const result = await response.json();
        
        if (result.success) {
            displayMedicineStock(result.data.slice(0, 15)); // Show first 15 items for better performance
        }
    } catch (error) {
        console.error('Error loading medicine stock:', error);
    }
}

// Display medicine stock in table with enhanced styling
function displayMedicineStock(medicines) {
    const tableBody = document.getElementById('med-table');
    tableBody.innerHTML = '';
    
    if (medicines.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: var(--muted);">No medicines found</td></tr>';
        return;
    }
    
    medicines.forEach((medicine, index) => {
        const row = tableBody.insertRow();
        
        // Check status
        const expiryDate = new Date(medicine.expiry);
        const today = new Date();
        const daysToExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        const isExpiringSoon = daysToExpiry <= 30 && daysToExpiry > 0;
        const isExpired = daysToExpiry <= 0;
        const isLowStock = medicine.stock <= 10;
        
        // Apply enhanced row styling with dashboard colors
        if (isExpired) {
            row.classList.add('expired-row');
        } else if (isExpiringSoon) {
            row.classList.add('expiring-row');
        } else if (isLowStock) {
            row.classList.add('low-stock-row');
        }
        
        // Add alternating row colors for better readability
        if (index % 2 === 0) {
            row.classList.add('even-row');
        }
        
        row.innerHTML = `
            <td>
                <div class="medicine-name">
                    ${medicine.name}
                    <small class="medicine-category">${medicine.category}</small>
                </div>
            </td>
            <td class="batch-number">${medicine.batch_number || '-'}</td>
            <td class="stock-cell">
                <span class="stock-badge ${isLowStock ? 'low-stock-badge' : 'normal-stock-badge'}">${medicine.stock}</span>
            </td>
            <td class="expiry-cell">
                <span class="expiry-badge ${isExpired ? 'expired-badge' : isExpiringSoon ? 'expiring-badge' : 'normal-expiry-badge'}">
                    ${formatDate(medicine.expiry)}
                </span>
            </td>
            <td class="price-cell">₹${parseFloat(medicine.price).toFixed(2)}</td>
        `;
    });
}

// Load alerts
async function loadAlerts() {
    try {
        const response = await fetch(`${API_BASE}/dashboard/alerts`);
        const result = await response.json();
        
        if (result.success) {
            displayAlerts(result.alerts);
        }
    } catch (error) {
        console.error('Error loading alerts:', error);
    }
}

// Display alerts with enhanced styling
function displayAlerts(alerts) {
    const alertsList = document.getElementById('alerts');
    alertsList.innerHTML = '';
    
    if (alerts.length === 0) {
        alertsList.innerHTML = '<li class="no-alerts">✅ No alerts at this time</li>';
        return;
    }
    
    alerts.slice(0, 5).forEach(alert => { // Show only first 5 alerts
        const li = document.createElement('li');
        li.className = `alert-item ${alert.priority}`;
        
        const icon = alert.type === 'low_stock' ? '📦' : 
                    alert.type === 'expiring' ? '📅' : '⚠️';
        
        li.innerHTML = `
            <span class="alert-icon">${icon}</span>
            <span class="alert-message">${alert.message}</span>
        `;
        
        alertsList.appendChild(li);
    });
}

// Handle global search
function handleGlobalSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    if (!searchTerm) {
        return;
    }
    
    console.log('Searching for:', searchTerm);
}

// Export stock to CSV
async function exportStockToCSV() {
    try {
        const response = await fetch(`${API_BASE}/medicines`);
        const result = await response.json();
        
        if (result.success) {
            const medicines = result.data;
            
            const headers = ['Name', 'Category', 'Price', 'Stock', 'Expiry Date', 'Batch Number'];
            const csvContent = [
                headers.join(','),
                ...medicines.map(med => [
                    `"${med.name}"`,
                    `"${med.category}"`,
                    med.price,
                    med.stock,
                    med.expiry,
                    `"${med.batch_number || ''}"`
                ].join(','))
            ].join('\n');
            
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `medicine_stock_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            showSuccess('Stock data exported successfully!');
        }
    } catch (error) {
        console.error('Error exporting stock:', error);
        showError('Failed to export stock data');
    }
}

// Open new sale
function openNewSale() {
    window.location.href = '/salessec/sales-sec.html';
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN');
}

function showError(message) {
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.innerHTML = `
        <span>❌ ${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
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
        <span>✅ ${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}



// ======================
// ⚙️ Settings Popup Logic
// ======================
document.addEventListener('DOMContentLoaded', () => {
  const settingsLink = document.getElementById('settings-link');
  const settingsPopup = document.getElementById('settings-popup');

  if (settingsLink && settingsPopup) {
    settingsLink.addEventListener('click', (e) => {
      e.preventDefault();
      settingsPopup.classList.remove('hidden');
      setTimeout(() => {
        settingsPopup.classList.add('hidden');
      }, 2500); // auto close after 2.5s
    });

    // Close popup when background clicked
    settingsPopup.addEventListener('click', (e) => {
      if (e.target === settingsPopup) {
        settingsPopup.classList.add('hidden');
      }
    });
  }
});

function closeSettingsPopup() {
  const popup = document.getElementById('settings-popup');
  if (popup) popup.classList.add('hidden');
}
