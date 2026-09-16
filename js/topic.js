document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const topicName = params.get("name"); // e.g. "C Programming" or "C++ Programming"

  console.log("Topic from URL:", topicName); // 🔍 Check in browser console

  const topicTitleEl = document.getElementById("topicTitle");
  const breadcrumbEl = document.getElementById("topicNameBreadcrumb");
  const subtopicsContainer = document.getElementById("subtopicsContainer");
  const filterInput = document.getElementById("filterInput");

  if (!topicName) {
    topicTitleEl.textContent = "No topic selected";
    return;
  }

  try {
    const res = await fetch(`http://localhost:5000/api/topics?name=${encodeURIComponent(topicName)}`);
    const topic = await res.json();
    console.log("Fetched topic:", topic); // ✅ Log response

    if (!topic || !topic.subtopics) throw new Error("Topic not found");

    topicTitleEl.textContent = topic.name;
    breadcrumbEl.textContent = topic.name;
    renderSubtopics(topic.subtopics, topic.name);

    filterInput.addEventListener("input", () => {
      const filtered = topic.subtopics.filter(sub =>
        sub.toLowerCase().includes(filterInput.value.toLowerCase())
      );
      renderSubtopics(filtered);
    });
  } catch (err) {
    console.error(err);
    topicTitleEl.textContent = "Error loading topic";
    subtopicsContainer.innerHTML = "<p style='color:red'>Could not load subtopics.</p>";
  }
  function renderSubtopics(list) {
  if (!list || list.length === 0) {
    subtopicsContainer.innerHTML = "<p>No subtopics found.</p>";
    return;
  }

  subtopicsContainer.innerHTML = list
    .map(sub =>
      `<div class="subtopic-item">
         <i class="fas fa-file-alt"></i>
         <a href="question.html?topic=${encodeURIComponent(topicName)}&subtopic=${encodeURIComponent(sub)}" class="subtopic-link">${sub}</a>
       </div>`
    )
    .join("");
  }
  // --- TAKE TEST REDIRECT ---
const takeTestBtn = document.getElementById("takeTestBtn");
if (takeTestBtn && topic) {
  takeTestBtn.addEventListener("click", () => {
    const encodedTitle = encodeURIComponent(`Online ${topic} Test`);
    window.location.href = `test-list.html?title=${encodedTitle}`;
  });
}

});