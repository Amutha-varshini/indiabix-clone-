const mongoose = require("mongoose");

const TestListSchema = new mongoose.Schema({
  title: { type: String, required: true }, // e.g. "Online C Programming Test"
  tests: [
    {
      testName: { type: String, required: true },
      questionCount: { type: Number, required: true },
      timeLimit: { type: Number, required: true } // minutes
    }
  ]
});

module.exports = mongoose.model("TestList", TestListSchema);