const express = require("express");
const router = express.Router();
const EmissionData = require("../models/EmissionData");

// GET /api/emissions - Get emission data with optional filters
router.get("/", async (req, res) => {
  try {
    const { category, startDate, endDate, supplier } = req.query;
    
    let filter = {};
    if (category) filter.category = category;
    if (supplier) filter.supplier = supplier;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const emissions = await EmissionData.find(filter).sort({ date: -1 });
    
    const formattedEmissions = emissions.map((emission) => ({
      id: emission._id,
      category: emission.category,
      subCategory: emission.subCategory,
      activityData: emission.activityData,
      unit: emission.unit,
      emissionFactor: emission.emissionFactor,
      emissionFactorUnit: emission.emissionFactorUnit,
      emissionFactorSource: emission.emissionFactorSource,
      region: emission.region,
      co2e: emission.co2e,
      confidenceRating: emission.confidenceRating,
      sourceDocument: emission.sourceDocument,
      supplier: emission.supplier,
      date: emission.date,
    }));

    res.json(formattedEmissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/emissions - Create new emission data
router.post("/", async (req, res) => {
  try {
    const emissionData = new EmissionData(req.body);
    await emissionData.save();
    res.status(201).json(emissionData);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/emissions/:id - Update emission data
router.put("/:id", async (req, res) => {
  try {
    const emission = await EmissionData.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!emission) {
      return res.status(404).json({ error: "Emission data not found" });
    }
    
    res.json(emission);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/emissions/:id - Delete emission data
router.delete("/:id", async (req, res) => {
  try {
    const emission = await EmissionData.findByIdAndDelete(req.params.id);
    if (!emission) {
      return res.status(404).json({ error: "Emission data not found" });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
