const modal = document.getElementById('backupModal');
const closeBtn = document.querySelector('.closeBtn');
const backupForm = document.getElementById('backupForm');
const backupTableBody = document.querySelector('#backupTable tbody');
const addBackupBtn = document.getElementById('addBackupBtn');

let backups = [
    {id: 1, name: "Weekly Sales Backup", type: "Weekly", date: "2025-10-07"},
    {id: 2, name: "Monthly Supply Backup", type: "Monthly", date: "2025-10-01"}
];
let currentId = backups.length;

// Sample medicine data (would be fetched from DB later)
let medicines = [
    {id: 1, name: "Paracetamol", quantity: 100, price: 5, expiry: "2025-10-20"},
    {id: 2, name: "Amoxicillin", quantity: 50, price: 10, expiry: "2025-11-05"},
    {id: 3, name: "Ibuprofen", quantity: 200, price: 8, expiry: "2025-10-15"}
];

// Render backup table dynamically
function renderTable() {
    backupTableBody.innerHTML = '';
    backups.forEach((bkp, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${bkp.id}</td>
            <td>${bkp.name}</td>
            <td>${bkp.type}</td>
            <td>${bkp.date}</td>
            <td>
                <button class="restore">Restore</button>
                <button class="delete">Delete</button>
            </td>
        `;
        backupTableBody.appendChild(tr);
    });
    attachRowEvents();
}

// Attach Restore and Delete events
function attachRowEvents() {
    document.querySelectorAll('.restore').forEach((btn, index) => {
        btn.onclick = () => downloadExcel(medicines, `Backup_${backups[index].name}`);
    });
    document.querySelectorAll('.delete').forEach((btn, index) => {
        btn.onclick = () => {
            if(confirm(`Delete backup "${backups[index].name}"?`)) {
                backups.splice(index, 1);
                renderTable();
            }
        };
    });
}

// Search backups
document.getElementById('search').addEventListener('input', function() {
    const filter = this.value.toLowerCase();
    document.querySelectorAll('#backupTable tbody tr').forEach((row, i) => {
        const name = backups[i].name.toLowerCase();
        row.style.display = name.includes(filter) ? '' : 'none';
    });
});

// Modal open/close
addBackupBtn.onclick = () => modal.style.display = 'block';
closeBtn.onclick = () => modal.style.display = 'none';

// Create new backup
backupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('backupName').value;
    const type = document.getElementById('backupType').value;
    const date = new Date().toISOString().split('T')[0];
    backups.push({id: ++currentId, name, type, date});
    renderTable();
    backupForm.reset();
    modal.style.display = 'none';
});

// Function to download medicines as Excel (CSV)
function downloadExcel(data, filename) {
    if(data.length === 0) return alert("No data to download!");

    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(row => Object.values(row).join(",")).join("\n");
    const csvContent = headers + "\n" + rows;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Initial render
renderTable();
