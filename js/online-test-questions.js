document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const testTitle = params.get("title");
  const testName = params.get("name");

  // ✅ grab elements
  const titleEl = document.getElementById("testTitle");
  const breadcrumbEl = document.getElementById("testBreadcrumb");
  const questionsContainer = document.getElementById("testQuestions");
  const timerEl = document.getElementById("timer");
  const submitBtn = document.getElementById("submitBtn");

  // ✅ check if elements exist (prevent null errors)
  if (!titleEl || !breadcrumbEl || !questionsContainer) {
    console.error("❌ Missing some HTML elements. Check element IDs in HTML file.");
    return;
  }

  if (!testTitle || !testName) {
    titleEl.textContent = "Invalid test details";
    return;
  }

  try {
    // ✅ fetch questions
    const res = await fetch(
      `http://localhost:5000/api/online-test?title=${encodeURIComponent(
        testTitle
      )}&name=${encodeURIComponent(testName)}`
    );

    if (!res.ok) throw new Error("Failed to fetch questions");

    const data = await res.json();
    console.log("Fetched test data:", data);

    // ✅ update titles and breadcrumb
    titleEl.textContent = testName;
    breadcrumbEl.textContent = testName;

    const questions = data.questions || [];
    const timeLimit = data.timeLimit || 30; // default 30 mins

    // ✅ check for empty list
    if (questions.length === 0) {
      questionsContainer.innerHTML = "<p>No questions available for this test.</p>";
      return;
    }

    // ✅ render questions
    questionsContainer.innerHTML = questions
      .map(
        (q, i) => `
        <div class="question-card">
          <h3>Q${i + 1}. ${q.questionText}</h3>
          ${
            q.codeSnippet
              ? `<pre class="code-box">${q.codeSnippet}</pre>`
              : ""
          }
          <ul>
            ${q.options
              .map(
                (opt, index) => `
                <li>
                  <label>
                    <input type="radio" name="question${i}" value="${opt}">
                    ${String.fromCharCode(65 + index)}. ${opt}
                  </label>
                </li>`
              )
              .join("")}
          </ul>
        </div>
        <hr>`
      )
      .join("");

    // ✅ timer logic
    let timeLeft = timeLimit * 60;
    function updateTimer() {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      timerEl.textContent = `Time Left: ${String(minutes).padStart(
        2,
        "0"
      )}:${String(seconds).padStart(2, "0")}`;

      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        alert("⏱️ Time's up! Submitting your test...");
        handleSubmit();
      } else {
        timeLeft--;
      }
    }

    const timerInterval = setInterval(updateTimer, 1000);
    updateTimer();

    // ✅ handle submit
    submitBtn.addEventListener("click", handleSubmit);
    function handleSubmit() {
  clearInterval(timerInterval);

  const answers = [];
  let correctCount = 0;

  // Loop through each question
  questions.forEach((q, i) => {
    const selected = document.querySelector(`input[name="question${i}"]:checked`);
    const chosenAnswer = selected ? selected.value : null;
    const isCorrect = chosenAnswer === q.correctAnswer;
    if (isCorrect) correctCount++;

    answers.push({
      question: q.questionText,
      chosenAnswer,
      correctAnswer: q.correctAnswer,
      isCorrect,
      explanation: q.explanation || "No explanation provided."
    });
  }); // ✅ <--- this closing parenthesis was missing!

  const resultData = {
    testTitle,
    testName,
    totalQuestions: questions.length,
    answered: answers.filter(a => a.chosenAnswer).length,
    unanswered: answers.filter(a => !a.chosenAnswer).length,
    score: correctCount,
    answers,
  };

  const userEmail = localStorage.getItem("userEmail");
  const fullName  = localStorage.getItem("fullName");

  if (userEmail) {
    resultData.userEmail = userEmail;
    resultData.fullName  = fullName;

    fetch("http://localhost:5000/api/test-result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resultData),
    })
      .then(res => res.json())
      .then(() => {
        window.location.href = `test-summary.html?title=${encodeURIComponent(
          testTitle
        )}&name=${encodeURIComponent(testName)}`;
      })
      .catch(err => {
        console.error("Error submitting result:", err);
        window.location.href = `test-summary.html?title=${encodeURIComponent(
          testTitle
        )}&name=${encodeURIComponent(testName)}`;
      });
  } else {
    localStorage.setItem("guestResult", JSON.stringify(resultData));
    window.location.href = `test-summary.html?title=${encodeURIComponent(
      testTitle
    )}&name=${encodeURIComponent(testName)}&guest=true`;
  }
} 
  } catch (err) {
    console.error("Error loading questions:", err);
    questionsContainer.innerHTML = `<p style="color:red;">Failed to load questions.</p>`;
  }
});
