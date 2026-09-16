document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const testTitle = params.get("title");

  const titleEl = document.getElementById("testTitle");
  const breadcrumbEl = document.getElementById("breadcrumbTestTitle");
  const container = document.getElementById("testListContainer");

  if (!testTitle) {
    titleEl.textContent = "No test selected";
    return;
  }

  try {
    const res = await fetch(`http://localhost:5000/api/test-list?title=${encodeURIComponent(testTitle)}`);
    const data = await res.json();

    titleEl.textContent = testTitle;
    breadcrumbEl.textContent = testTitle;

    if (!data.tests || data.tests.length === 0) {
      container.innerHTML = `<p>No tests found for this category.</p>`;
      return;
    }

    container.innerHTML = data.tests
      .map(
        (t) => `
      <div class="test-item-block">
        <a href="online-test-start.html?title=${encodeURIComponent(testTitle)}&name=${encodeURIComponent(t.testName)}" class="test-link"><h3><i class="fas fa-clipboard-list"></i> ${t.testName}</h3></a>
        <div class="test-item-details">
          <p><span>Questions: ${t.questionCount}</span>
          <span><i class="fas fa-clock"></i> ${t.timeLimit} minutes</span></p>
          <hr>
        </div>
      </div>
      <div class="divider-line"></div>
    `
      )
      .join("");
      const cards = document.querySelectorAll(".test-item-block");
      cards.forEach((card, i) => {
        setTimeout(() => card.classList.add("show"), i * 100);
      });
  } catch (err) {
    console.error(err);
    container.innerHTML = `<p style="color:red;">Failed to load tests.</p>`;
  }
});
