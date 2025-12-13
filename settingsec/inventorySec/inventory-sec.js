document.addEventListener("DOMContentLoaded", () => {
  const editBtn = document.getElementById("editBtn");
  const saveBtn = document.getElementById("saveBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const modal = document.getElementById("modal");

  const lowStockText = document.getElementById("lowStockText");
  const expiryAlertText = document.getElementById("expiryAlertText");
  const lowStockInput = document.getElementById("lowStock");
  const expiryDaysInput = document.getElementById("expiryDays");

  const inventoryList = document.getElementById("inventoryData");

  // Fetch dummy medicine stock data from API
  async function fetchInventory() {
    try {
      const res = await fetch("https://dummyjson.com/products?limit=3");
      const data = await res.json();
      inventoryList.innerHTML = "";
      data.products.forEach(p => {
        const li = document.createElement("li");
        li.textContent = `${p.title} — Stock: ${p.stock}`;
        inventoryList.appendChild(li);
      });
    } catch (err) {
      inventoryList.textContent = "Failed to load inventory data.";
    }
  }
  fetchInventory();

  // Open modal
  editBtn.addEventListener("click", () => {
    modal.style.display = "flex";
  });

  // Save settings
  saveBtn.addEventListener("click", () => {
    lowStockText.textContent = `Enabled (Threshold: ${lowStockInput.value})`;
    expiryAlertText.textContent = `Enabled (${expiryDaysInput.value} Days Before)`;
    modal.style.display = "none";
  });

  // Cancel
  cancelBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Close modal when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });
});
