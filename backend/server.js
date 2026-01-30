const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

dotenv.config();
const app = express();

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:8080", "http://localhost:3000"],
  credentials: true
}));
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Import routes
const fileRoutes = require("./routes/files");
const emissionRoutes = require("./routes/emissions");
const emissionFactorRoutes = require("./routes/emissionFactors");
const analyticsRoutes = require("./routes/analytics");
const recommendationRoutes = require("./routes/recommendations");
const dataLineageRoutes = require("./routes/dataLineage");

// Routes
app.get("/", (req, res) => {
  res.json({ 
    message: "Carbon Accounting API is running 🚀",
    endpoints: {
      files: "/api/files",
      emissions: "/api/emissions",
      emissionFactors: "/api/emission-factors",
      analytics: "/api/analytics",
      recommendations: "/api/recommendations",
      dataLineage: "/api/data-lineage"
    }
  });
});

// API Routes
app.use("/api/files", fileRoutes);
app.use("/api/emissions", emissionRoutes);
app.use("/api/emission-factors", emissionFactorRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/data-lineage", dataLineageRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}`);
});
