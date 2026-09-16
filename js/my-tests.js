document.addEventListener("DOMContentLoaded", async () => {
  const userEmail = localStorage.getItem("userEmail");
  const tableBody = document.getElementById("testsTableBody");
  const entriesSelect = document.getElementById("entriesSelect");
  const searchInput = document.getElementById("testSearch");
  const pageInfo = document.getElementById("pageInfo");
  const prevBtn = document.getElementById("prevPageBtn");
  const nextBtn = document.getElementById("nextPageBtn");

  if (!userEmail) {
    tableBody.innerHTML = `<tr><td colspan="6" style="color:red;text-align:center;">Please log in to view your test results.</td></tr>`;
    return;
  }

  try {
    const res = await fetch(`http://localhost:5000/api/my-tests?userEmail=${encodeURIComponent(userEmail)}`);
    if (!res.ok) throw new Error("Failed to fetch test results");

    const data = await res.json();
    let tests = data.tests || [];

    let currentPage = 1;
    let entriesPerPage = parseInt(entriesSelect.value);

    function renderTable() {
      const searchTerm = searchInput.value.toLowerCase();
      const filtered = tests.filter(
        (t) =>
          t.testTitle.toLowerCase().includes(searchTerm) ||
          t.testName.toLowerCase().includes(searchTerm)
      );

      const totalPages = Math.ceil(filtered.length / entriesPerPage);
      const start = (currentPage - 1) * entriesPerPage;
      const end = start + entriesPerPage;
      const visibleTests = filtered.slice(start, end);

      tableBody.innerHTML = visibleTests.length
        ? visibleTests
            .map(
              (t, i) => `
          <tr>
            <td>${start + i + 1}</td>
            <td>${t.testTitle}</td>
            <td>${t.testName}</td>
            <td>${t.score}</td>
            <td>${t.totalQuestions}</td>
            <td>${new Date(t.submittedAt).toLocaleDateString()}</td>
          </tr>`
            )
            .join("")
        : `<tr><td colspan="6" style="text-align:center;">No results found.</td></tr>`;

      pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
      prevBtn.disabled = currentPage === 1;
      nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    }

    // events
    entriesSelect.addEventListener("change", () => {
      entriesPerPage = parseInt(entriesSelect.value);
      currentPage = 1;
      renderTable();
    });

    searchInput.addEventListener("keyup", () => {
      currentPage = 1;
      renderTable();
    });

    prevBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        renderTable();
      }
    });

    nextBtn.addEventListener("click", () => {
      currentPage++;
      renderTable();
    });

    renderTable();
  } catch (err) {
    console.error("Error loading user tests:", err);
    tableBody.innerHTML = `<tr><td colspan="6" style="color:red;text-align:center;">Failed to load test results.</td></tr>`;
  }
});
