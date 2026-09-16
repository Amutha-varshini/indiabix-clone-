const express = require('express');
const mongoose = require("mongoose");
const cors = require("cors");
const User = require("./models/User");
const TestList = require("./models/TestList");
const OnlineQuestion = require("./models/OnlineQuestion");
const TestResult = require("./models/TestResult");

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect("mongodb://127.0.0.1:27017/indiabix")
  .then(() => console.log("MongoDB Connected Successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Register route
app.post("/api/register", async (req, res) => {
  try {
    const { fullName, username, email, password } = req.body;

    // ✅ Check if all fields are received
    console.log("Received:", req.body);

    if (!fullName || !username || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already registered!" });
    }

    const newUser = new User({ fullName, username, email, password });
    await newUser.save();

    res.json({ success: true, message: "User registered successfully!" });
  } catch (error) {
    console.error("Error in /api/register:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Login route
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// PROFILE ROUTES 
// GET user profile by email
app.get("/api/profile/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// UPDATE profile details
app.put("/api/profile/update", async (req, res) => {
  try {
    const { email, mobile, gender, dob, city, country } = req.body;

    const user = await User.findOneAndUpdate(
      { email },
      { mobile, gender, dob, city, country },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: "Update failed", error: err.message });
  }
});

// CHANGE PASSWORD
app.put("/api/profile/change-password", async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.password !== oldPassword)
      return res.status(401).json({ message: "Old password incorrect" });

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error changing password", error: err.message });
  }
});

// ================= TOPIC API =================
const Topic = mongoose.model("Topic", new mongoose.Schema({
  category: String,
  name: String,
  subtopics: [String]
}));

// ✅ GET route for a single topic by name
// backend/server.js
app.get("/api/topics", async (req, res) => {
  try {
    const topicName = decodeURIComponent(req.query.name || "").trim();
    if (!topicName)
      return res.status(400).json({ message: "Missing topic name" });

    const topic = await Topic.findOne({ name: topicName });

    if (!topic)
      return res.status(404).json({ message: "Topic not found" });

    res.json(topic);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= QUESTION API =================
// Question Schema
const questionSchema = new mongoose.Schema({
  topic: String,
  subtopic: String,
  question: String,
  options: [String],
  answer: String,
  explanation: String,
});

const Question = mongoose.model("Question", questionSchema);

// 🔹 GET questions for a subtopic
// Utility function to safely escape special regex characters
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

app.get("/api/questions", async (req, res) => {
  try {
    const topic = decodeURIComponent(req.query.topic || "").trim();
    const subtopic = decodeURIComponent(req.query.subtopic || "").trim();

    console.log("Incoming query:", { topic, subtopic });

    if (!topic || !subtopic) {
      return res.status(400).json({ message: "Missing topic or subtopic" });
    }

    // Escape regex symbols
    const safeTopic = escapeRegex(topic);
    const safeSubtopic = escapeRegex(subtopic);

    const questions = await Question.find({
      topic: { $regex: new RegExp(`^${safeTopic}$`, "i") },
      subtopic: { $regex: new RegExp(`^${safeSubtopic}$`, "i") }
    }).lean();

    if (!questions.length) {
      console.log("No questions found for:", topic, subtopic);
      return res.status(200).json({ message: "No questions added yet", questions: [] });
    }

    res.status(200).json({ questions });
  } catch (err) {
    console.error("Error fetching questions:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- GET ALL TEST CATEGORIES ---
const Test = mongoose.model("Test", new mongoose.Schema({
  category: String,
  titles: [String]
}));

// Get all test categories
app.get("/api/tests", async (req, res) => {
  try {
    console.log("➡️ /api/tests route hit"); 
    const tests = await Test.find({});
    console.log("✅ Tests found:", tests.length);
    if (!tests || tests.length === 0)
      return res.status(404).json({ message: "No test categories found" });
    res.json(tests);
  } catch (err) {
    console.error("Error fetching tests:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Fetch list of tests for a given title
app.get("/api/test-list", async (req, res) => {
  try {
    const title = decodeURIComponent(req.query.title || "");
    console.log("🔍 Incoming title:", title);

    if (!title) return res.status(400).json({ message: "Missing title" });

    // Use Mongoose model properly
    const testList = await TestList.findOne({ title: title });

    if (!testList) {
      console.log("❌ No test list found for:", title);
      return res.status(404).json({ message: "No tests found for this title" });
    }

    console.log("✅ Found test list:", testList);
    res.json(testList);
  } catch (err) {
    console.error("🔥 Error fetching test list:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});
// =============== OnlineQuestion =============== 
app.get("/api/online-test", async (req, res) => {
  try {
    const title = decodeURIComponent(req.query.title || "").trim();
    const name = decodeURIComponent(req.query.name || "").trim();

    console.log("Incoming test query:", { title, name });

    if (!title || !name) {
      return res.status(400).json({ message: "Missing test details" });
    }

    // ✅ fetch questions from your renamed collection
    const questions = await OnlineQuestion.find({
      testTitle: title,
      testName: name,
    }).lean();

    console.log(`✅ Found ${questions.length} questions`);

    if (!questions || questions.length === 0) {
      return res.status(200).json({ questions: [] });
    }

    res.status(200).json({
      questions,
      timeLimit: 30, // default time
    });
  } catch (err) {
    console.error("❌ Error fetching questions:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});


// Save test result
app.post("/api/test-result", async (req, res) => {
  try {
    const { userEmail, testTitle, testName, totalQuestions, answered, unanswered, score, answers } = req.body;

    const newResult = new TestResult({
      userEmail,
      testTitle,
      testName,
      totalQuestions,
      answered,
      unanswered,
      score,
      answers
    });

    await newResult.save();
    res.status(201).json({ message: "Result saved successfully!" });
  } catch (err) {
    console.error("Error saving result:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// Get test result for summary
app.get("/api/test-result", async (req, res) => {
  try {
    const title = decodeURIComponent(req.query.title || "");
    const name = decodeURIComponent(req.query.name || "");

    const result = await TestResult.findOne({ testTitle: title, testName: name }).sort({ submittedAt: -1 });

    if (!result) return res.status(404).json({ message: "No result found" });

    res.json(result);
  } catch (err) {
    console.error("Error fetching result:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all tests taken by a user
app.get("/api/my-tests", async (req, res) => {
  try {
    const userEmail = req.query.userEmail;
    if (!userEmail) return res.status(400).json({ message: "Email required" });

    const tests = await TestResult.find({ userEmail }).sort({ submittedAt: -1 });
    res.json({ tests });
  } catch (err) {
    console.error("Error fetching user tests:", err);
    res.status(500).json({ message: "Server error" });
  }
});
// --- Bookmark Schema ---
const bookmarkSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  question: { type: String, required: true },
  category: { type: String },
  topic: { type: String },
  date: { type: Date, default: Date.now },
});

const Bookmark = mongoose.model("Bookmark", bookmarkSchema);

// --- Add Bookmark ---
app.post("/api/bookmarks", async (req, res) => {
  try {
    const { userEmail, question, category, topic } = req.body;
    const existing = await Bookmark.findOne({ userEmail, question });
    if (existing) {
      return res.status(400).json({ message: "Already bookmarked" });
    }
    const bookmark = new Bookmark({ userEmail, question, category, topic });
    await bookmark.save();
    res.json({ message: "Bookmarked successfully", bookmark });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Remove Bookmark ---
app.delete("/api/bookmarks", async (req, res) => {
  try {
    const { userEmail, question } = req.body;
    await Bookmark.deleteOne({ userEmail, question });
    res.json({ message: "Bookmark removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Get Bookmarks for Profile Page ---
app.get("/api/bookmarks", async (req, res) => {
  try {
    const { userEmail } = req.query;
    const bookmarks = await Bookmark.find({ userEmail }).sort({ date: -1 });
    res.json(bookmarks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.listen(5000, () => console.log("Server running on http://localhost:5000"));