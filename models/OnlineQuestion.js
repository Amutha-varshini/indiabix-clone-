const mongoose = require("mongoose");

const OnlineQuestionSchema = new mongoose.Schema({
  testTitle: String,
  testName: String,
  questionText: String,   // ✅ matches DB field
  codeSnippet: String,    // ✅ for code block
  options: [String],
  correctAnswer: String,
});

module.exports = mongoose.model("OnlineQuestion", OnlineQuestionSchema);
