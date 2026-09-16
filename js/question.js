document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const topic = decodeURIComponent(params.get("topic") || "");
  const subtopic = decodeURIComponent(params.get("subtopic") || "");

  const titleEl = document.getElementById("subtopicTitle");
  const breadcrumbTopic = document.getElementById("breadcrumbTopic");
  const breadcrumbSub = document.getElementById("breadcrumbSubtopic");
  const container = document.getElementById("questionsContainer");

  if (!titleEl || !breadcrumbTopic || !breadcrumbSub || !container) {
    console.error("❌ Missing some HTML elements");
    return;
  }

  if (!topic || !subtopic) {
    titleEl.textContent = "No subtopic selected";
    return;
  }

  try {
    const res = await fetch(
      `http://localhost:5000/api/questions?topic=${encodeURIComponent(topic)}&subtopic=${encodeURIComponent(subtopic)}`
    );
    if (!res.ok) throw new Error("Failed to fetch questions");
    const data = await res.json();
    const questions = data.questions || data;

    titleEl.textContent = subtopic;
    breadcrumbTopic.textContent = topic;
    breadcrumbSub.textContent = subtopic;

    if (!questions || questions.length === 0) {
      container.innerHTML = `<p>No questions added yet.</p>`;
      return;
    }

    // remember selected answers
    const selectedAnswers = Array(questions.length).fill(null);
    const questionsPerPage = 5;
    let currentPage = 1;
    const totalPages = Math.ceil(questions.length / questionsPerPage);

    function renderPage(page) {
      const start = (page - 1) * questionsPerPage;
      const end = start + questionsPerPage;
      const pageQuestions = questions.slice(start, end);

      let html = "";

      pageQuestions.forEach((q, i) => {
        const globalIndex = start + i;
        const optionLabels = ["A", "B", "C", "D"];
        const saved = selectedAnswers[globalIndex];

        html += `
          <div class="question-card">
            <h3>Q${globalIndex + 1} of ${questions.length}: ${q.question}</h3>
            <ul class="options-list">
              ${q.options
                .map((opt, idx) => `
                  <li class="option-item ${saved === opt ? "selected" : ""}"
                      data-index="${globalIndex}"
                      data-correct="${opt === q.answer}"
                      data-option="${opt}">
                    <span class="option-label">${optionLabels[idx]}.</span>
                    <span class="option-text">${opt}</span>
                  </li>`).join("")}
            </ul>
            <div class="question-actions">
              <button class="show-answer-btn">📖 View Answer & Explanation</button>
              <i class="fa-regular fa-bookmark bookmark-icon" 
                data-question="${q.question}" 
                title="Bookmark this question"></i>
            </div>
            <div class="answer-box" style="display:none;">
              <p><strong>Answer:</strong> ${q.answer}</p>
              <p><em>${q.explanation || "No explanation available."}</em></p>
            </div>
          </div>`;
      });

      html += `
        <div class="nav-buttons">
          <button id="prevPage" ${page === 1 ? "disabled" : ""}>⬅ Previous</button>
          <span>Page ${page} of ${totalPages}</span>
          <button id="nextPage" ${page === totalPages ? "disabled" : ""}>Next ➡</button>
        </div>`;

      container.innerHTML = html;

      // option click
      container.querySelectorAll(".option-item").forEach((item) => {
        item.addEventListener("click", () => {
          const parent = item.closest(".options-list");
          parent.querySelectorAll(".option-item").forEach((opt) =>
            opt.classList.remove("selected", "correct", "wrong")
          );
          item.classList.add("selected");
          const isCorrect = item.dataset.correct === "true";
          item.classList.add(isCorrect ? "correct" : "wrong");
          selectedAnswers[item.dataset.index] = item.dataset.option;
        });
      });

      // show/hide answer
      container.querySelectorAll(".show-answer-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const box = btn.nextElementSibling;
          const visible = box.style.display === "block";
          box.style.display = visible ? "none" : "block";
          btn.textContent = visible
            ? "📖 View Answer & Explanation"
            : "🔽 Hide Answer & Explanation";
        });
      });

      // navigation
      container.querySelector("#prevPage").addEventListener("click", () => {
        if (currentPage > 1) {
          currentPage--;
          renderPage(currentPage);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
      container.querySelector("#nextPage").addEventListener("click", () => {
        if (currentPage < totalPages) {
          currentPage++;
          renderPage(currentPage);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
      // --- BOOKMARK FEATURE ---
const userEmail = localStorage.getItem("userEmail");

document.querySelectorAll(".bookmark-icon").forEach(async (icon) => {
  if (!userEmail) {
    icon.style.display = "none"; // hide for guest
    return;
  }

  const questionText = icon.dataset.question;

  // 🔹 Check if this question is already bookmarked
  try {
    const res = await fetch(`http://localhost:5000/api/bookmarks?userEmail=${encodeURIComponent(userEmail)}`);
    const data = await res.json();
    const bookmarked = data.some(b => b.question === questionText);
    if (bookmarked) {
      icon.classList.remove("fa-regular");
      icon.classList.add("fa-solid", "bookmarked");
    }
  } catch (err) {
    console.error("Error checking bookmarks:", err);
  }

  // 🔹 Toggle bookmark on click
  icon.addEventListener("click", async () => {
    const isBookmarked = icon.classList.contains("bookmarked");

    if (!isBookmarked) {
      // Add
      const res = await fetch("http://localhost:5000/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: userEmail,
          question: questionText,
          category: topic,
          topic: subtopic,
        }),
      });
      if (res.ok) {
        icon.classList.remove("fa-regular");
        icon.classList.add("fa-solid", "bookmarked");
      }
    } else {
      // Remove
      const res = await fetch("http://localhost:5000/api/bookmarks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail, question: questionText }),
      });
      if (res.ok) {
        icon.classList.remove("fa-solid", "bookmarked");
        icon.classList.add("fa-regular");
      }
    }
  });
});
    }

    renderPage(currentPage);
  } catch (err) {
    console.error("❌ Error loading questions:", err);
    container.innerHTML = `<p style="color:red;">Failed to load questions.</p>`;
  }
});
