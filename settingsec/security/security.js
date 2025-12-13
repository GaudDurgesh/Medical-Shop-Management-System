// ------------------- Password Management -------------------

// Simulated current password (replace with backend validation later)
let currentPassword = "Durgesh@Owner";

const oldPasswordForm = document.getElementById('oldPasswordForm');
const oldPasswordInput = document.getElementById('oldPassword');
const oldPasswordMessage = document.getElementById('oldPasswordMessage');

const passwordForm = document.getElementById('passwordForm');
const newPasswordInput = document.getElementById('newPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');
const passwordMessage = document.getElementById('passwordMessage');
const passwordSubmitBtn = passwordForm.querySelector('button');

// Step 1: Verify old password
oldPasswordForm.addEventListener('submit', (e) => {
    e.preventDefault();

    if(oldPasswordInput.value === currentPassword) {
        oldPasswordMessage.textContent = "✅ Old password verified. You can now change your password.";
        oldPasswordMessage.style.color = "#22c55e";
        oldPasswordMessage.classList.remove("shake");

        // Enable new password fields
        newPasswordInput.disabled = false;
        confirmPasswordInput.disabled = false;
        passwordSubmitBtn.disabled = false;
    } else {
        oldPasswordMessage.textContent = "❌ Old password is incorrect!";
        oldPasswordMessage.style.color = "#ef4444";

        // Shake animation
        oldPasswordMessage.classList.remove("shake");
        void oldPasswordMessage.offsetWidth; // Trigger reflow
        oldPasswordMessage.classList.add("shake");

        // Keep new password fields disabled
        newPasswordInput.disabled = true;
        confirmPasswordInput.disabled = true;
        passwordSubmitBtn.disabled = true;
    }
});

// Step 2: Update password
passwordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newPwd = newPasswordInput.value;
    const confirmPwd = confirmPasswordInput.value;

    // Password strength validation
    const strengthRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
    if(newPwd !== confirmPwd) {
        passwordMessage.textContent = "Passwords do not match!";
        passwordMessage.style.color = "#ef4444";
        return;
    }
    if(!strengthRegex.test(newPwd)) {
        passwordMessage.textContent = "Password must be 8+ chars, include uppercase, number, and special char!";
        passwordMessage.style.color = "#ef4444";
        return;
    }

    currentPassword = newPwd; // Simulated password update
    passwordMessage.textContent = "Password updated successfully!";
    passwordMessage.style.color = "#22c55e";

    // Reset fields
    newPasswordInput.value = confirmPasswordInput.value = "";
    newPasswordInput.disabled = true;
    confirmPasswordInput.disabled = true;
    passwordSubmitBtn.disabled = true;
    oldPasswordInput.value = "";
    oldPasswordMessage.textContent = "";
});

// ------------------- Two-Factor Authentication -------------------
const twoFA = document.getElementById('twoFA');
const twoFAStatus = document.getElementById('twoFAStatus');

twoFA.addEventListener('change', () => {
    if(twoFA.checked) {
        twoFAStatus.textContent = "Enabled";
        twoFAStatus.style.color = "#34d399";
    } else {
        twoFAStatus.textContent = "Disabled";
        twoFAStatus.style.color = "#f87171";
    }
});

// ------------------- Failed Login Attempts -------------------
const loginAttemptsTableBody = document.querySelector('#loginAttemptsTable tbody');
let failedAttempts = [
    {user:"admin", ip:"192.168.1.10", time:"2025-10-07 10:23"},
    {user:"john", ip:"192.168.1.25", time:"2025-10-07 11:05"}
];

function renderFailedAttempts() {
    loginAttemptsTableBody.innerHTML = "";
    failedAttempts.forEach(attempt => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${attempt.user}</td><td>${attempt.ip}</td><td>${attempt.time}</td>`;
        loginAttemptsTableBody.appendChild(tr);
    });
}
renderFailedAttempts();
