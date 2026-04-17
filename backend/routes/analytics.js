const express = require("express");
const router = express.Router();
const EmissionData = require("../models/EmissionData");
const Recommendation = require("../models/Recommendation");

// GET /api/analytics/summary - Get dashboard summary metrics
router.get("/summary", async (req, res) => {
  try {
    const emissions = await EmissionData.find();
    
    // Calculate total emissions
    const totalEmissions = emissions.reduce((sum, e) => sum + e.co2e, 0);
    
    // Find top hotspot
    const categoryTotals = {};
    emissions.forEach((e) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.co2e;
    });
    
    const topHotspot = Object.keys(categoryTotals).reduce(
      (a, b) => (categoryTotals[a] > categoryTotals[b] ? a : b),
      "N/A"
    );
    
    const topHotspotEmissions = categoryTotals[topHotspot] || 0;
    
    // Get recommendations count
    const recommendations = await Recommendation.find({ isActive: true });
    const potentialReduction = recommendations.reduce(
      (sum, r) => sum + r.potentialReduction,
      0
    );
    
    res.json({
      totalEmissions: Math.round(totalEmissions),
      topHotspot,
      topHotspotEmissions: Math.round(topHotspotEmissions),
      potentialReduction: Math.round(potentialReduction),
      improvementSuggestions: recommendations.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/category-breakdown - Get emissions by category
router.get("/category-breakdown", async (req, res) => {
  try {
    const emissions = await EmissionData.find();
    
    const categoryTotals = {};
    const totalEmissions = emissions.reduce((sum, e) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.co2e;
      return sum + e.co2e;
    }, 0);
    
    const colors = {
      Materials: "hsl(152, 60%, 45%)",
      Transport: "hsl(175, 55%, 45%)",
      Packaging: "hsl(45, 93%, 50%)",
      Energy: "hsl(200, 70%, 50%)",
      Waste: "hsl(30, 70%, 50%)",
      Services: "hsl(280, 60%, 50%)",
    };
    
    const breakdown = Object.keys(categoryTotals).map((category) => ({
      name: category,
      value: Math.round((categoryTotals[category] / totalEmissions) * 100),
      emissions: Math.round(categoryTotals[category]),
      color: colors[category] || "hsl(220, 60%, 50%)",
    }));
    
    res.json(breakdown);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/suppliers - Get supplier analysis
router.get("/suppliers", async (req, res) => {
  try {
    const emissions = await EmissionData.find({ supplier: { $exists: true, $ne: null } });
    
    const supplierData = {};
    const totalEmissions = emissions.reduce((sum, e) => sum + e.co2e, 0);
    
    emissions.forEach((e) => {
      if (!supplierData[e.supplier]) {
        supplierData[e.supplier] = {
          name: e.supplier,
          region: e.region,
          totalEmissions: 0,
          materials: new Set(),
        };
      }
      supplierData[e.supplier].totalEmissions += e.co2e;
      supplierData[e.supplier].materials.add(e.subCategory);
    });
    
    const suppliers = Object.values(supplierData)
      .map((s, index) => ({
        id: (index + 1).toString(),
        name: s.name,
        region: s.region,
        totalEmissions: Math.round(s.totalEmissions),
        contribution: Math.round((s.totalEmissions / totalEmissions) * 100),
        materials: Array.from(s.materials),
      }))
      .sort((a, b) => b.totalEmissions - a.totalEmissions);
    
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/transport-modes - Get transport mode analysis
router.get("/transport-modes", async (req, res) => {
  try {
    const transportEmissions = await EmissionData.find({ category: "Transport" });
    
    const modeTotals = {};
    transportEmissions.forEach((e) => {
      modeTotals[e.subCategory] = (modeTotals[e.subCategory] || 0) + e.co2e;
    });
    
    const transportModes = Object.keys(modeTotals).map((mode) => ({
      mode,
      emissions: Math.round(modeTotals[mode]),
    }));
    
    res.json(transportModes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/material-hotspots - Get material hotspot analysis
router.get("/material-hotspots", async (req, res) => {
  try {
    const materialEmissions = await EmissionData.find({ category: "Materials" });
    
    const materialTotals = {};
    const totalMaterialEmissions = materialEmissions.reduce((sum, e) => {
      materialTotals[e.subCategory] = (materialTotals[e.subCategory] || 0) + e.co2e;
      return sum + e.co2e;
    }, 0);
    
    const hotspots = Object.keys(materialTotals).map((material) => ({
      material,
      emissions: Math.round(materialTotals[material]),
      percentage: Math.round((materialTotals[material] / totalMaterialEmissions) * 100),
    }))
    .sort((a, b) => b.emissions - a.emissions);
    
    res.json(hotspots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
