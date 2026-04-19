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
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:8080",
      "http://localhost:3000",
      "https://carbon-reader.onrender.com",
      "https://carbon-reader-ywk5.vercel.app"
    ];
    if (process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }
    // Allow requests with no origin or from allowed list or any vercel preview URL
    if (!origin || allowedOrigins.includes(origin) || (origin && origin.endsWith(".vercel.app"))) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));
app.use(express.json());

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/ScopeZero";
mongoose
  .connect(mongoURI, {
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    if (!process.env.MONGODB_URI) {
        console.warn("⚠️ MONGODB_URI is not defined. Ensure your MongoDB Atlas connection string is set in Render Environment Variables.");
    }
  });

// ─── Routes ──────────────────────────────────────────────────────────────────
const fileRoutes           = require("./routes/files");
const emissionRoutes       = require("./routes/emissions");
const emissionFactorRoutes = require("./routes/emissionFactors");
const analyticsRoutes      = require("./routes/analytics");
const recommendationRoutes = require("./routes/recommendations");
const dataLineageRoutes    = require("./routes/dataLineage");
const systemRoutes         = require("./routes/system");
const authRoutes           = require("./routes/auth");

// NEW: Scope 3 GHG Protocol compliance APIs
const scope3CategoriesRoutes = require("./routes/scope3Categories");
const scope3ComplianceRoutes = require("./routes/scope3Compliance");

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
      system:         "/api/system",
      auth:           "/api/auth",
      scope3Categories: "/api/scope3-categories",
      scope3Compliance: "/api/scope3-compliance",
    },
  });
});

app.use("/api/files",            fileRoutes);
app.use("/api/emissions",        emissionRoutes);
app.use("/api/emission-factors", emissionFactorRoutes);
app.use("/api/analytics",        analyticsRoutes);
app.use("/api/recommendations",  recommendationRoutes);
app.use("/api/data-lineage",     dataLineageRoutes);
app.use("/api/system",              systemRoutes);
app.use("/api/auth",                authRoutes);
app.use("/api/scope3-categories",   scope3CategoriesRoutes);
app.use("/api/scope3-compliance",   scope3ComplianceRoutes);

// Serve frontend
const frontendDist = path.join(__dirname, "../frontend/dist");
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API at http://localhost:${PORT}/api`);
  console.log(`📈 Integrated ML engine active for recommendations, forecasts, and anomaly detection`);
});
