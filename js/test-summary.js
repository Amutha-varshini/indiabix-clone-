document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const testTitle = params.get("title");
  const testName  = params.get("name");
  const isGuest   = params.get("guest");
  const container = document.getElementById("summaryContainer");

  if (!testTitle || !testName) {
    container.innerHTML = "<p style='color:red;'>Invalid test details.</p>";
    return;
  }

  try {
    let data;

    if (isGuest) {
      data = JSON.parse(localStorage.getItem("guestResult"));
      localStorage.removeItem("guestResult");
    } else {
      const res = await fetch(
        `http://localhost:5000/api/test-result?title=${encodeURIComponent(
          testTitle
        )}&name=${encodeURIComponent(testName)}`
      );
      if (!res.ok) throw new Error("Failed to fetch result");
      data = await res.json();
    }

    if (!data || !data.answers || data.answers.length === 0) {
      container.innerHTML = "<p>No result data found.</p>";
      return;
    }

    // ✅ Build result summary
    let summaryHTML = `
      <h3 style="text-align:center;">${data.testName}</h3>
      <div class="result-info">
        <p><strong>Marks:</strong> ${data.score}/${data.totalQuestions}</p>
        <p><strong>Total Questions:</strong> ${data.totalQuestions}</p>
        <p><strong>Answered:</strong> ${data.answered}</p>
        <p><strong>Unanswered:</strong> ${data.unanswered}</p>
      </div>
      <hr>
      <h4 style="text-align:center; margin-top:20px;">Test Review</h4>
    `;

    // ✅ Add each question’s review
    summaryHTML += data.answers.map((a, i) => `
      <div class="question-review" style="margin:15px 0; padding:10px; border:1px solid #ddd; border-radius:8px;">
        <p><strong>Q${i + 1}. ${a.question}</strong></p>
        ${a.explanation ? `<pre class="code-box">${a.explanation}</pre>` : ""}
        <p><strong>Your Answer:</strong> ${a.chosenAnswer || "<em>Not answered</em>"}</p>
        <p><strong>Correct Answer:</strong> ${a.correctAnswer}</p>
        <p style="color:${a.isCorrect ? "green" : "red"}; font-weight:bold;">
          ${a.isCorrect ? "✔ Correct" : "✘ Incorrect"}
        </p>
      </div>
    `).join("");

    container.innerHTML = summaryHTML;

  } catch (err) {
    console.error("Error fetching result:", err);
    container.innerHTML = "<p style='color:red;'>Failed to load summary.</p>";
  }
});