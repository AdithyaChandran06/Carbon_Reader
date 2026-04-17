const express = require("express");
const router = express.Router();
const EmissionFactor = require("../models/EmissionFactor");

// GET /api/emission-factors - Get all emission factors
router.get("/", async (req, res) => {
  try {
    const factors = await EmissionFactor.find().sort({ category: 1 });
    
    const formattedFactors = factors.map((factor) => ({
      id: factor._id,
      category: factor.category,
      materialOrMode: factor.materialOrMode,
      region: factor.region,
      factor: factor.factor,
      unit: factor.unit,
      source: factor.source,
      confidenceRating: factor.confidenceRating,
    }));

    res.json(formattedFactors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/emission-factors - Create new emission factor
router.post("/", async (req, res) => {
  try {
    const emissionFactor = new EmissionFactor(req.body);
    await emissionFactor.save();
    res.status(201).json(emissionFactor);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
