// ================== Admin Data ==================
const adminData = {
  shopName: "My Medical Shop",
  adminName: "John Doe",
  adminEmail: "admin@example.com",
  openingDate: "2020-01-01",
  birthDate: "1985-03-15",
  contact: "+91 9876543210"
};

// ================== Helper Functions ==================
function showTab(tabId) {
  tabContents.forEach(tc => tc.classList.toggle('active', tc.id === tabId));
}

function activateButton(btn) {
  tabButtons.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function updateDisplay(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

// Populate profile info dynamically
function loadProfileData() {
  updateDisplay('#shopName', adminData.shopName);
  updateDisplay('#adminName', adminData.adminName);
  updateDisplay('#adminEmail', adminData.adminEmail);
  updateDisplay('#openingDate', adminData.openingDate);
  updateDisplay('#birthDate', adminData.birthDate);
  updateDisplay('#contact', adminData.contact);
}

// ================== Tab Switching ==================
const tabButtons = document.querySelectorAll('.settings-sidebar button');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    activateButton(btn);
    let tabId = btn.dataset.tab || (btn.id === 'store-setting' ? 'store' : null);
    if (tabId) showTab(tabId);
  });
});

// ================== Profile Edit ==================
const editBtn = document.getElementById('edit-profile-btn');
const profileForm = document.getElementById('profile-form');
const cancelBtn = document.getElementById('cancel-edit');

editBtn.addEventListener('click', () => {
  profileForm.style.display = 'block';
  editBtn.style.display = 'none';

  // Prefill form
  document.getElementById('editShopName').value = adminData.shopName;
  document.getElementById('editAdminName').value = adminData.adminName;
  document.getElementById('editAdminEmail').value = adminData.adminEmail;
  document.getElementById('editOpeningDate').value = adminData.openingDate;
  document.getElementById('editBirthDate').value = adminData.birthDate;
  document.getElementById('editContact').value = adminData.contact;
});

cancelBtn.addEventListener('click', () => {
  profileForm.style.display = 'none';
  editBtn.style.display = 'inline-block';
  profileForm.reset();
});

// Profile Form Submit
profileForm.addEventListener('submit', (e) => {
  e.preventDefault();

  adminData.shopName = document.getElementById('editShopName').value.trim() || adminData.shopName;
  adminData.adminName = document.getElementById('editAdminName').value.trim() || adminData.adminName;
  adminData.adminEmail = document.getElementById('editAdminEmail').value.trim() || adminData.adminEmail;
  adminData.openingDate = document.getElementById('editOpeningDate').value || adminData.openingDate;
  adminData.birthDate = document.getElementById('editBirthDate').value || adminData.birthDate;
  adminData.contact = document.getElementById('editContact').value.trim() || adminData.contact;

  loadProfileData();

  profileForm.style.display = 'none';
  editBtn.style.display = 'inline-block';

  alert('Profile updated successfully!');
});

// ================== Initial Setup ==================
loadProfileData();
activateButton(tabButtons[0]);
showTab(tabContents[0].id);

// ================== Navigation ==================
document.getElementById("store-setting").addEventListener("click", () => {
  window.location.href = "/settingSec/storeSection/store-sec.html";
});
document.getElementById("inventory-setting").addEventListener("click", () => {
  window.location.href = "/settingSec/inventorySec/inventory-sec.html";
});
document.getElementById("notify").addEventListener("click", () => {
  window.location.href = "/settingSec/NotifySec/notification.html";
});
document.getElementById("backup-data").addEventListener("click", () => {
  window.location.href = "/settingSec/backup&data/backup.html";
});
document.getElementById("security").addEventListener("click", () => {
  window.location.href = "/settingSec/security/security.html";
});
document.getElementById("support&help").addEventListener("click", () => {
  window.location.href = "/settingSec/support&help/support.html";
});
document.getElementById("sales-bill").addEventListener("click", () => {
  window.location.href = "/salesSec/sales-sec.html";
});
