document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorMsg = document.getElementById("errorMsg");
  const successMsg = document.getElementById("successMsg");

  // Clear previous messages
  errorMsg.style.display = "none";
  successMsg.style.display = "none";

  try {
    const response = await fetch("http://localhost:5000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await response.json();

    if (data.success) {
      successMsg.innerText = "✅ Login Successful! Redirecting...";
      successMsg.style.display = "block";

      // Redirect after 2 seconds
      setTimeout(() => {
        window.location.href = "../dashboard/dash-board.html";
      }, 2000);
    } else {
      errorMsg.innerText = "❌ " + (data.message || "Invalid username or password!");
      errorMsg.style.display = "block";
    }
  } catch (error) {
    console.error("Error:", error);
    errorMsg.innerText = "⚠️ Server not reachable. Please check backend.";
    errorMsg.style.display = "block";
  }
});
