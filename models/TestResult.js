const mongoose = require("mongoose");

const TestResultSchema = new mongoose.Schema({
  userEmail: { type: String, required: false }, 
  fullName: { type: String },
  testTitle: String,
  testName: String,
  totalQuestions: Number,
  answered: Number,
  unanswered: Number,
  score: Number,
  answers: [
    {
      question: String,
      chosenAnswer: String,
      correctAnswer: String,
      isCorrect: Boolean,
    },
  ],
  submittedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("TestResult", TestResultSchema);