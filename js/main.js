document.addEventListener("DOMContentLoaded", () => {

  // HAMBURGER TOGGLE
  const hamburger = document.getElementById('hamburger');
  const sidebar = document.getElementById('sidebar');
  if(hamburger && sidebar){
    hamburger.addEventListener('click', ()=>{
      sidebar.classList.toggle('open');
    });
  }

  //SEARCH
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  if (searchBtn && searchInput) {
    searchBtn.addEventListener("click", handleSearch);
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") handleSearch();
    });
  }
  function handleSearch() {
    const query = searchInput.value.trim();
    if (!query) {
      alert("Please enter a topic name!");
      return;
    }
    window.location.href = `topic.html?name=${encodeURIComponent(query)}`;
  }

  // DARK MODE TOGGLE
  const darkModeToggle = document.getElementById('darkModeToggle');
  if(darkModeToggle){
    darkModeToggle.addEventListener('click', ()=>{
      document.body.classList.toggle('dark-mode');
      localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    });
    if(localStorage.getItem('darkMode')==='true'){
      document.body.classList.add('dark-mode');
    }
  }

  // SHARE BUTTON
  const shareButton = document.getElementById('shareButton');
  if(shareButton){
    shareButton.addEventListener('click', async ()=>{
      const shareData = {title:'IndiaBIX Clone', text:'Check this out!', url:window.location.href};
      try{
        await navigator.share(shareData);
      }catch{
        alert('Sharing not supported on this browser.');
      }
    });
  }

  //PASSWORD VALIDATION
  function validatePassword(password) {
  // Minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number, 1 special character
  const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return pattern.test(password);
  }

// REGISTER FORM (MongoDB integration)
const registerForm = document.getElementById("registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fullName = document.getElementById("fullName").value.trim();
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    console.log("Sending to backend:", { fullName, username, email, password });

    try {
      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, username, email, password }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Registered successfully!");
        window.location.href = "login.html";
      } else {
        alert("Registration failed: " + data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Server connection error!");
    }
  });
}


// LOGIN FORM
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      alert("Please enter both email and password!");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("loggedInUser", JSON.stringify(data.user));
        alert(`Welcome, ${data.user.fullName}!`);
        addActivity("Logged in");
        window.location.href= "profile.html";
      } else {
        alert(data.message || "Invalid credentials!");
      }
    } catch (err) {
      console.error(err);
      alert("Server error.");
    }
  });
}

// ================= PROFILE PAGE (MongoDB Connected) =================
if (window.location.pathname.includes("profile.html")) {
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!user) {
    alert("You must log in first!");
    window.location.href = "login.html";
  } else {
    document.getElementById("profileName").textContent = user.fullName;
    document.getElementById("usernameDisplay").textContent = user.username;
  }

  const apiBase = "http://localhost:5000/api";

  // Load user details from MongoDB
  async function loadProfile() {
    const res = await fetch(`${apiBase}/profile/${user.email}`);
    const data = await res.json();
    if (data.email) {
      document.getElementById("mobile").value = data.mobile || "";
      document.getElementById("gender").value = data.gender || "";
      document.getElementById("dob").value = data.dob || "";
      document.getElementById("city").value = data.city || "";
      document.getElementById("country").value = data.country || "";
    }
  }

  loadProfile();

  // --- Update profile ---
  const personalForm = document.getElementById("personalDetailsForm");
  personalForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const updatedData = {
      email: user.email,
      mobile: document.getElementById("mobile").value,
      gender: document.getElementById("gender").value,
      dob: document.getElementById("dob").value,
      city: document.getElementById("city").value,
      country: document.getElementById("country").value,
    };
    const res = await fetch(`${apiBase}/profile/update`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData),
    });
    const result = await res.json();
    if (result.success) alert("Profile updated successfully!");
    addActivity("Updated personal details");
  });

  // --- Change password ---
  const passwordForm = document.getElementById("changePasswordForm");
  passwordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      email: user.email,
      oldPassword: document.getElementById("oldPassword").value,
      newPassword: document.getElementById("newPassword").value,
    };
    const res = await fetch(`${apiBase}/profile/change-password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    alert(result.message);
    addActivity("Changed password");
  });

  // --- Logout ---
  document.getElementById("logoutBtn").addEventListener("click", () => {
    addActivity("Logged out");
    localStorage.removeItem("loggedInUser");
    window.location.href = "login.html";
  });
}
// ===================== RECENT ACTIVITIES =====================
function addActivity(action) {
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!loggedInUser) return;

  // Get existing activities from localStorage
  const activities = JSON.parse(localStorage.getItem("activities")) || [];

  // Add new activity with timestamp
  activities.push({
    user: loggedInUser.email,
    action: action,
    time: new Date().toLocaleString(),
  });

  // Save back to localStorage
  localStorage.setItem("activities", JSON.stringify(activities));

  // Refresh activities display (if on profile page)
  renderActivities();
}

function renderActivities() {
  const container = document.getElementById("recentActivities");
  if (!container) return;

  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!loggedInUser) return;

  const activities = JSON.parse(localStorage.getItem("activities")) || [];
  const userActivities = activities.filter(a => a.user === loggedInUser.email);

  container.innerHTML = "<h3>Recent Activities</h3>";

  if (userActivities.length === 0) {
    container.innerHTML += "<p>No recent activities yet.</p>";
    return;
  }

  userActivities.slice().reverse().forEach(a => {
    const div = document.createElement("div");
    div.classList.add("activity-item");
    div.innerHTML = `<strong>${a.action}</strong> <span style="color:gray;">(${a.time})</span>`;
    container.appendChild(div);
  });
}
if (document.getElementById("recentActivities")) {
  renderActivities();
}
// =============== OnlineTestStart ================
const params = new URLSearchParams(window.location.search);
const title = params.get("title");
const name = params.get("name");
document.getElementById("testTitle").textContent = name;
document.getElementById("breadcrumbTitle").textContent = title;
document.getElementById("totalQuestions").textContent = 20;
document.getElementById("timeLimit").textContent = 30;
document.getElementById("startTestBtn").addEventListener("click", () => {
  window.location.href = `online-test-questions.html?title=${encodeURIComponent(title)}&name=${encodeURIComponent(name)}`;
});
// --- Make entire cards clickable ---
document.querySelectorAll(".card").forEach(card => {
  card.addEventListener("click", e => {
    const target = e.target;
    // Prevent double navigation if clicked on <a> directly
    if (target.tagName.toLowerCase() === "a") return;

    const link = card.getAttribute("data-link");
    if (link) {
      window.location.href = link;
    }
  });

  // Add hover effect
  card.style.cursor = "pointer";
});

});