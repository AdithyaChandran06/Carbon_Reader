/**
 * routes/recommendations.js (REWORKED)
 * ═══════════════════════════════════════════════════════════════════════════
 * Unified recommendations API using integrated ML recommendation engine.
 * 
 * This replaces the old system of storing static recommendations in MongoDB.
 * Now recommendations are DYNAMICALLY generated based on actual emission data
 * patterns, making them always relevant and data-driven.
 */

const express = require("express");
const router = express.Router();
const {
  generateRecommendations,
  generateForecast,
  detectAnomalies,
} = require("../ml/recommendationEngine");

/**
 * GET /api/recommendations
 * Generates recommendations based on emission data patterns.
 */
router.get("/", async (req, res) => {
  try {
    const result = await generateRecommendations();
    
    // Format for frontend compatibility
    const formattedResult = {
      success: true,
      recommendations: result.recommendations.map((rec) => ({
        rank: rec.rank,
        title: rec.title,
        description: rec.description,
        type: rec.type,
        category: rec.category,
        currentEmissions: rec.currentEmissions,
        potentialReduction: rec.potentialReduction,
        percentageSavings: rec.percentageSavings,
        costImpact: rec.costImpact,
        implementationDifficulty: rec.implementationDifficulty,
        priority: rec.priority,
        mlConfidence: rec.mlConfidence,
        evidence: rec.evidence,
      })),
      totalPotentialReduction: result.totalPotentialReduction,
      summaryStats: result.summaryStats,
      engine: "integrated-ml",
      generatedAt: new Date(),
    };

    res.json(formattedResult);
  } catch (error) {
    console.error("Recommendations error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      engine: "integrated-ml",
    });
  }
});

/**
 * GET /api/recommendations/forecast
 * Time-series forecast of future emissions.
 */
router.get("/forecast", async (req, res) => {
  try {
    const { months = 6, category } = req.query;
    const result = await generateForecast(parseInt(months), category);

    res.json({
      success: true,
      data: result,
      engine: "integrated-ml",
    });
  } catch (error) {
    console.error("Forecast error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/recommendations/anomalies
 * Detects anomalous emission records.
 */
router.get("/anomalies", async (req, res) => {
  try {
    const { contamination = 0.1 } = req.query;
    const result = await detectAnomalies(parseFloat(contamination));

    res.json({
      success: true,
      data: result,
      engine: "integrated-ml",
    });
  } catch (error) {
    console.error("Anomalies error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/recommendations/health
 * Health check for ML engine.
 */
router.get("/health", (req, res) => {
  res.json({
    success: true,
    engine: "integrated-ml",
    status: "ok",
    message: "Integrated ML recommendation engine is operational",
  });
});

module.exports = router;
