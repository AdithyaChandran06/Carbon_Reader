const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const UploadedFile = require("../models/UploadedFile");
const EmissionData = require("../models/EmissionData");
const Recommendation = require("../models/Recommendation");
const { processCSVFile } = require("../utils/csvProcessor");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8001";
const ML_TIMEOUT_MS = parseInt(process.env.ML_TIMEOUT_MS || "15000");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /csv|pdf|xlsx|xls/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      return cb(null, true);
    }
    cb(new Error("Only CSV, PDF, and Excel files are allowed"));
  },
});

// POST /api/files/upload - Upload a file
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const uploadedFile = new UploadedFile({
      fileName: req.file.originalname,
      sourceType: req.body.sourceType || "Other",
      status: "Processing",
      filePath: req.file.path,
    });

    await uploadedFile.save();

    // Process the file asynchronously
    processFileAsync(uploadedFile, req.file.path);

    res.status(201).json({
      id: uploadedFile._id,
      fileName: uploadedFile.fileName,
      sourceType: uploadedFile.sourceType,
      status: uploadedFile.status,
      uploadDate: uploadedFile.uploadDate,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Async function to process files
async function processFileAsync(uploadedFile, filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    
    if (ext === ".csv") {
      // Process CSV file
      const emissionEntries = await processCSVFile(
        filePath,
        uploadedFile.sourceType,
        uploadedFile._id
      );

      await refreshRecommendationsFromML();
      
      console.log(`✅ Processed ${emissionEntries.length} emission entries from ${uploadedFile.fileName}`);
      
      uploadedFile.status = "Processed";
      uploadedFile.recordCount = emissionEntries.length;
      await uploadedFile.save();
    } else {
      // For PDF and Excel files, mark as processed for now
      // You can add PDF/Excel processing later
      uploadedFile.status = "Processed";
      await uploadedFile.save();
    }
  } catch (error) {
    console.error("Error processing file:", error);
    uploadedFile.status = "Error";
    uploadedFile.errorMessage = error.message;
    await uploadedFile.save();
  }
}

async function refreshRecommendationsFromML() {
  const records = await EmissionData.find().lean();

  if (records.length === 0) {
    await Recommendation.deleteMany({ isActive: true });
    return;
  }

  const payload = {
    records: records.map((r) => ({
      id: r._id.toString(),
      category: r.category,
      subCategory: r.subCategory,
      activityData: r.activityData,
      unit: r.unit,
      emissionFactor: r.emissionFactor,
      region: r.region,
      co2e: r.co2e,
      supplier: r.supplier,
      date: r.date ? r.date.toISOString() : null,
    })),
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ML_TIMEOUT_MS);

  try {
    const mlResponse = await fetch(`${ML_SERVICE_URL}/recommendations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!mlResponse.ok) {
      const text = await mlResponse.text();
      throw new Error(`ML recommendation generation failed: ${mlResponse.status} ${text}`);
    }

    const result = await mlResponse.json();
    const mlRecs = Array.isArray(result?.recommendations) ? result.recommendations : [];

    const validTypes = new Set(["supplier", "transport", "material", "energy", "consolidation"]);
    const validPriority = new Set(["High", "Medium", "Low"]);
    const validDifficulty = new Set(["Low", "Medium", "High"]);

    const mappedRecommendations = mlRecs.map((rec) => ({
      title: rec.title || "ML Recommendation",
      description: rec.description || "Automatically generated from uploaded data.",
      type: validTypes.has(rec.type) ? rec.type : "energy",
      currentEmissions: Number(rec.currentEmissions) || 0,
      potentialReduction: Number(rec.potentialReduction) || 0,
      percentageSavings: Number(rec.percentageSavings) || 0,
      costImpact: Number(rec.costImpact) || 0,
      implementationDifficulty: validDifficulty.has(rec.implementationDifficulty)
        ? rec.implementationDifficulty
        : "Medium",
      priority: validPriority.has(rec.priority) ? rec.priority : "Medium",
      isActive: true,
    }));

    await Recommendation.deleteMany({ isActive: true });
    if (mappedRecommendations.length > 0) {
      await Recommendation.insertMany(mappedRecommendations);
    }

    console.log(`🤖 Refreshed ${mappedRecommendations.length} ML recommendations`);
  } catch (error) {
    console.warn("⚠️ Unable to refresh ML recommendations after upload:", error.message);
  } finally {
    clearTimeout(timer);
  }
}

// GET /api/files - Get all uploaded files
router.get("/", async (req, res) => {
  try {
    const files = await UploadedFile.find().sort({ uploadDate: -1 });
    
    const formattedFiles = files.map((file) => ({
      id: file._id,
      fileName: file.fileName,
      sourceType: file.sourceType,
      status: file.status,
      uploadDate: file.uploadDate.toLocaleDateString("en-US"),
      errorMessage: file.errorMessage,
      recordCount: file.recordCount,
    }));

    res.json(formattedFiles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/files/:id - Delete a file
router.delete("/:id", async (req, res) => {
  try {
    const file = await UploadedFile.findByIdAndDelete(req.params.id);
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
