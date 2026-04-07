/**
 * server.js  (UPGRADED)
 * ─────────────────────
 * Added routes:
 *   /api/ml/*           - ML microservice proxy
 *   /api/live-factors/* - Live API emission factors (Climatiq, Carbon Interface)
 */

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

dotenv.config();
const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:8080",
    "http://localhost:3000",
  ],
  credentials: true,
}));
app.use(express.json());

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ─── Routes ──────────────────────────────────────────────────────────────────
const fileRoutes           = require("./routes/files");
const emissionRoutes       = require("./routes/emissions");
const emissionFactorRoutes = require("./routes/emissionFactors");
const analyticsRoutes      = require("./routes/analytics");
const recommendationRoutes = require("./routes/recommendations");
const dataLineageRoutes    = require("./routes/dataLineage");

// NEW: ML microservice proxy
const mlRoutes             = require("./routes/ml");
// NEW: Live emission factor APIs
const liveFactorRoutes     = require("./routes/liveFactors");

// Health check
app.get("/api", (req, res) => {
  res.json({
    message: "Carbon Accounting API is running 🚀",
    endpoints: {
      files:          "/api/files",
      emissions:      "/api/emissions",
      emissionFactors:"/api/emission-factors",
      analytics:      "/api/analytics",
      recommendations:"/api/recommendations",
      dataLineage:    "/api/data-lineage",
      ml:             "/api/ml",             // NEW
      liveFactors:    "/api/live-factors",   // NEW
    },
  });
});

app.use("/api/files",            fileRoutes);
app.use("/api/emissions",        emissionRoutes);
app.use("/api/emission-factors", emissionFactorRoutes);
app.use("/api/analytics",        analyticsRoutes);
app.use("/api/recommendations",  recommendationRoutes);
app.use("/api/data-lineage",     dataLineageRoutes);
app.use("/api/ml",               mlRoutes);          // NEW
app.use("/api/live-factors",     liveFactorRoutes);  // NEW

// Serve frontend
const frontendDist = path.join(__dirname, "../frontend/dist");
app.use(express.static(frontendDist));
app.get(/^(.*)$/, (req, res) => {
  res.sendFile(path.join(frontendDist, "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API at http://localhost:${PORT}/api`);
  console.log(`🤖 ML service expected at ${process.env.ML_SERVICE_URL || "http://localhost:8001"}`);
});
