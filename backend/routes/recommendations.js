const express = require("express");
const router = express.Router();
const Recommendation = require("../models/Recommendation");

// GET /api/recommendations - Get all recommendations
router.get("/", async (req, res) => {
  try {
    const recommendations = await Recommendation.find({ isActive: true })
      .sort({ priority: 1 });
    
    const formattedRecommendations = recommendations.map((rec) => ({
      id: rec._id,
      title: rec.title,
      description: rec.description,
      type: rec.type,
      currentEmissions: rec.currentEmissions,
      potentialReduction: rec.potentialReduction,
      percentageSavings: rec.percentageSavings,
      costImpact: rec.costImpact,
      implementationDifficulty: rec.implementationDifficulty,
      priority: rec.priority,
    }));
    
    res.json(formattedRecommendations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/recommendations/generate - Generate new recommendations
router.post("/generate", async (req, res) => {
  try {
    // Simple recommendation generation logic
    // You can enhance this with more sophisticated algorithms
    
    const EmissionData = require("../models/EmissionData");
    const emissions = await EmissionData.find();
    
    const newRecommendations = [];
    
    // Example: Recommend renewable energy if using grid electricity
    const energyEmissions = emissions.filter(e => 
      e.category === "Energy" && e.subCategory.includes("Grid")
    );
    
    if (energyEmissions.length > 0) {
      const totalEnergyEmissions = energyEmissions.reduce((sum, e) => sum + e.co2e, 0);
      
      newRecommendations.push({
        title: "Switch to Renewable Energy",
        description: "Transition to 100% renewable electricity for operations",
        type: "energy",
        currentEmissions: totalEnergyEmissions,
        potentialReduction: totalEnergyEmissions * 0.9,
        percentageSavings: 90,
        costImpact: 25000,
        implementationDifficulty: "Medium",
        priority: newRecommendations.length + 1,
      });
    }
    
    // Save generated recommendations
    for (const recData of newRecommendations) {
      const recommendation = new Recommendation(recData);
      await recommendation.save();
    }
    
    res.status(201).json(newRecommendations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
