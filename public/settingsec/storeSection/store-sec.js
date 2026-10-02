// Tab Switching
const tabs = document.querySelectorAll(".tab");
const contents = document.querySelectorAll(".tab-content");

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    const target = tab.getAttribute("data-tab");
    contents.forEach(c => c.id === target ? c.classList.add("active") : c.classList.remove("active"));
  });
});

// Toggle Edit Forms
document.querySelectorAll(".edit-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const form = btn.nextElementSibling;
    form.classList.add("visible");
    form.scrollIntoView({behavior:"smooth", block:"start"});
  });
});

// Cancel Buttons
document.querySelectorAll(".cancel-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const form = btn.closest(".edit-form");
    form.classList.remove("visible");
  });
});

// Save Changes
document.querySelectorAll(".edit-form").forEach(form => {
  form.addEventListener("submit", e => {
    e.preventDefault();
    const parent = form.closest(".tab-content");

    if(parent.id==="basic-info"){
      document.getElementById("disp-store-name").textContent = document.getElementById("store-name").value || "N/A";
      document.getElementById("disp-owner-name").textContent = document.getElementById("owner-name").value || "N/A";
      document.getElementById("disp-phone").textContent = document.getElementById("phone").value || "N/A";
      document.getElementById("disp-email").textContent = document.getElementById("email").value || "N/A";
      document.getElementById("disp-address").textContent = document.getElementById("address").value || "N/A";
    } else if(parent.id==="business-hours"){
      document.getElementById("disp-open-time").textContent = document.getElementById("open-time").value || "N/A";
      document.getElementById("disp-close-time").textContent = document.getElementById("close-time").value || "N/A";
      document.getElementById("disp-holidays").textContent = document.getElementById("holidays").value || "N/A";
    } else if(parent.id==="payment-options"){
      const payments = Array.from(form.querySelectorAll(".payment:checked")).map(cb=>cb.value);
      document.getElementById("disp-payments").textContent = payments.length?payments.join(", "):"None";
    } else if(parent.id==="tax-branding"){
      document.getElementById("disp-gst").textContent = document.getElementById("gst").value || "N/A";
      document.getElementById("disp-hsn").textContent = document.getElementById("hsn").value || "N/A";
      document.getElementById("disp-color").style.background = document.getElementById("color").value;
    } else if(parent.id==="license"){
      document.getElementById("disp-license-number").textContent = document.getElementById("license-number").value || "N/A";
      document.getElementById("disp-license-issue").textContent = document.getElementById("license-issue").value || "N/A";
      document.getElementById("disp-license-expiry").textContent = document.getElementById("license-expiry").value || "N/A";
    }

    form.classList.remove("visible");
    alert("✅ Changes saved successfully!");
  });
});
