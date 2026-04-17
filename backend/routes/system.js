const express = require("express");
const router = express.Router();
const EmissionData = require("../models/EmissionData");
const Recommendation = require("../models/Recommendation");
const UploadedFile = require("../models/UploadedFile");

// POST /api/system/clear-db - Wipes the database
router.post("/clear-db", async (req, res) => {
  try {
    await EmissionData.deleteMany({});
    await Recommendation.deleteMany({});
    await UploadedFile.deleteMany({});
    res.json({ message: "All records wiped clean" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
