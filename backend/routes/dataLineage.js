const express = require("express");
const router = express.Router();
const EmissionData = require("../models/EmissionData");

// GET /api/data-lineage - Get data lineage and traceability
router.get("/", async (req, res) => {
  try {
    const emissions = await EmissionData.find()
      .populate("sourceDocument")
      .limit(20)
      .sort({ date: -1 });
    
    const lineage = emissions.map((e, index) => ({
      id: (index + 1).toString(),
      category: e.category,
      activityData: `${e.activityData.toLocaleString()} ${e.unit}`,
      source: e.sourceDocument?.fileName || "Manual Entry",
      details: e.subCategory,
      emissionFactor: e.emissionFactor,
      emissionFactorSource: e.emissionFactorSource,
      confidenceRating: e.confidenceRating,
    }));
    
    res.json(lineage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
