document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("testCategoriesContainer");

  try {
    const res = await fetch("http://localhost:5000/api/tests");
    const data = await res.json();
    console.log("Fetched categories:", data);
    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = `<p>No test categories found.</p>`;
      return;
    }

    container.innerHTML = data
      .map(
        (cat) => `
      <div class="test-category-card">
        <div class="test-category-header" onclick="toggleTests('${cat._id}')">
          <h3><i class="fas fa-list"></i> ${cat.category}</h3>
          <i class="fas fa-chevron-down"></i>
        </div>
        <div class="test-list" id="list-${cat._id}">
          ${cat.titles
            .map(
                (t) =>
                    `<div class="test-item">
                        <i class="fas fa-file-alt"></i>
                        <a href="test-list.html?title=${encodeURIComponent(t)}">${t}</a>
                    </div>`
            )
            .join("")}

        </div>
      </div>
      <div class="category-divider"></div>
    `
      )
      .join("");
  } catch (err) {
    console.error(err);
    container.innerHTML = `<p style="color:red">Failed to load test categories.</p>`;
  }
});

// toggle visibility
function toggleTests(id) {
  const list = document.getElementById(`list-${id}`);
  if (list) {
    list.classList.toggle("visible");
  }
}
