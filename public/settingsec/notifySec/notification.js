const modal = document.getElementById('medModal');
const closeBtn = document.querySelector('.closeBtn');
const medForm = document.getElementById('medForm');
const medTableBody = document.querySelector('#medTable tbody');
let currentRow = null;

// Sample data (can later be fetched from database)
let medicines = [
    {id: 1, name: "Paracetamol", expiry: "2025-10-20"},
    {id: 2, name: "Amoxicillin", expiry: "2025-11-05"},
    {id: 3, name: "Ibuprofen", expiry: "2025-10-15"}
];

// Function to render table dynamically
function renderTable() {
    medTableBody.innerHTML = '';
    medicines.forEach(med => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${med.id}</td>
            <td>${med.name}</td>
            <td>${med.expiry}</td>
            <td></td>
            <td>
                <button class="edit">Edit</button>
                <button class="delete">Delete</button>
            </td>
        `;
        medTableBody.appendChild(tr);
    });
    updateStatus();
    attachRowEvents();
}

// Function to update status based on expiry date
function updateStatus() {
    const today = new Date();
    document.querySelectorAll('#medTable tbody tr').forEach((row, index) => {
        const expiry = new Date(medicines[index].expiry);
        const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
        row.cells[3].innerText = diffDays <= 30 ? 'Expiring Soon' : 'Safe';
        row.cells[3].style.color = diffDays <= 30 ? '#f87171' : '#34d399';
        row.cells[3].style.fontWeight = '600';
    });
}

// Attach Edit and Delete events for all rows
function attachRowEvents() {
    document.querySelectorAll('.edit').forEach((btn, index) => {
        btn.onclick = () => {
            currentRow = index;
            document.getElementById('medName').value = medicines[index].name;
            document.getElementById('expiryDate').value = medicines[index].expiry;
            modal.style.display = 'block';
        };
    });

    document.querySelectorAll('.delete').forEach((btn, index) => {
        btn.onclick = () => {
            medicines.splice(index, 1);
            renderTable();
        };
    });
}

// Search functionality
document.getElementById('search').addEventListener('input', function() {
    const filter = this.value.toLowerCase();
    document.querySelectorAll('#medTable tbody tr').forEach((row, i) => {
        const name = medicines[i].name.toLowerCase();
        row.style.display = name.includes(filter) ? '' : 'none';
    });
});

// Modal close
closeBtn.onclick = () => modal.style.display = 'none';

// Save changes from modal
medForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if(currentRow !== null) {
        medicines[currentRow].name = document.getElementById('medName').value;
        medicines[currentRow].expiry = document.getElementById('expiryDate').value;
        renderTable();
        modal.style.display = 'none';
    }
});

// Initial render
renderTable();
