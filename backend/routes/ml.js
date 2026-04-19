/**
 * routes/ml.js
 * ────────────
 * Proxy routes that forward requests to the Python ML microservice.
 * The ML service runs on port 8001 (configurable via ML_SERVICE_URL).
 *
 * Routes:
 *   POST /api/ml/predict        - predict missing co2e values
 *   POST /api/ml/anomalies      - detect anomalous records
 *   POST /api/ml/cluster        - cluster emission sources
 *   POST /api/ml/forecast       - time-series forecast
 *   POST /api/ml/recommendations - ML-driven recommendations
 *   POST /api/ml/confidence     - score data confidence
 *   GET  /api/ml/health         - ML service health check
 */

const express = require("express");
const router = express.Router();
const EmissionData = require("../models/EmissionData");
const {
  fallbackPredict,
  fallbackAnomalies,
  fallbackCluster,
  fallbackForecast,
  fallbackRecommendations,
  fallbackConfidence,
} = require("../utils/mlLocalEngine");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8001";
const ML_TIMEOUT_MS = parseInt(process.env.ML_TIMEOUT_MS || "15000");

// ─── Helper: proxy request to ML service ────────────────────────────────────
async function proxyToML(path, body, timeoutMs = ML_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${ML_SERVICE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`ML service error ${res.status}: ${err}`);
    }

    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function tryExternalML(path, body, timeoutMs = ML_TIMEOUT_MS) {
  try {
    const result = await proxyToML(path, body, timeoutMs);
    return { data: result, engine: "external" };
  } catch (error) {
    return { error };
  }
}

// ─── Load all emission records from DB and format for ML ─────────────────────
async function loadRecordsForML(filters = {}) {
  const records = await EmissionData.find(filters).lean();
  return records.map((r) => ({
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
  }));
}

// ─── Routes ──────────────────────────────────────────────────────────────────

/**
 * GET /api/ml/health
 */
router.get("/health", async (req, res) => {
  try {
    const mlRes = await fetch(`${ML_SERVICE_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!mlRes.ok) {
      throw new Error(`ML service health check failed: ${mlRes.status}`);
    }
    const data = await mlRes.json();
    res.json({ mlService: { ...data, mode: "external" }, nodeProxy: "ok" });
  } catch (err) {
    res.json({
      mlService: {
        status: "ok",
        service: "local-ml-fallback",
        mode: "local",
      },
      nodeProxy: "ok",
      externalService: {
        status: "unreachable",
        error: err.message,
      },
    });
  }
});

/**
 * POST /api/ml/predict
 * Body: optional { filters: { category } }
 */
router.post("/predict", async (req, res) => {
  try {
    const records = await loadRecordsForML(req.body?.filters || {});
    if (records.length === 0) {
      return res.json({ predictions: [], message: "No records found" });
    }
    const external = await tryExternalML("/predict/emissions", { records });
    if (external.data) return res.json(external.data);

    res.json({
      ...fallbackPredict(records),
      engine: "local",
      fallbackReason: external.error?.message,
    });
  } catch (err) {
    console.error("ML predict error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ml/anomalies
 * Body: optional { contamination: 0.1, filters }
 */
router.post("/anomalies", async (req, res) => {
  try {
    const records = await loadRecordsForML(req.body?.filters || {});
    if (records.length < 4) {
      return res.json({
        results: [],
        message: "Need at least 4 records for anomaly detection",
      });
    }
    const payload = {
      records,
      contamination: req.body?.contamination || 0.1,
    };

    const external = await tryExternalML("/anomalies", payload);
    if (external.data) return res.json(external.data);

    res.json({
      ...fallbackAnomalies(records, payload.contamination),
      engine: "local",
      fallbackReason: external.error?.message,
    });
  } catch (err) {
    console.error("ML anomalies error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ml/cluster
 * Body: optional { n_clusters: 4, filters }
 */
router.post("/cluster", async (req, res) => {
  try {
    const records = await loadRecordsForML(req.body?.filters || {});
    if (records.length < 2) {
      return res.json({ clusters: [], message: "Need at least 2 records to cluster" });
    }
    const payload = {
      records,
      n_clusters: req.body?.n_clusters || 4,
    };

    const external = await tryExternalML("/cluster", payload);
    if (external.data) return res.json(external.data);

    res.json({
      ...fallbackCluster(records, payload.n_clusters),
      engine: "local",
      fallbackReason: external.error?.message,
    });
  } catch (err) {
    console.error("ML cluster error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ml/forecast
 * Body: optional { months_ahead: 6, category: "Energy", filters }
 */
router.post("/forecast", async (req, res) => {
  try {
    const records = await loadRecordsForML(req.body?.filters || {});
    const payload = {
      records,
      months_ahead: req.body?.months_ahead || 6,
      category: req.body?.category || null,
    };

    const external = await tryExternalML("/forecast", payload);
    if (external.data) return res.json(external.data);

    res.json({
      ...fallbackForecast(records, payload.months_ahead, payload.category),
      engine: "local",
      fallbackReason: external.error?.message,
    });
  } catch (err) {
    console.error("ML forecast error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ml/recommendations
 * Generates ML-driven recommendations from all current records.
 */
router.post("/recommendations", async (req, res) => {
  try {
    const records = await loadRecordsForML();
    if (records.length === 0) {
      return res.json({ recommendations: [] });
    }
    const external = await tryExternalML("/recommendations", { records });
    const result = external.data || fallbackRecommendations(records);

    // Optionally save generated recommendations to MongoDB
    const Recommendation = require("../models/Recommendation");
    if (req.body?.save && result.recommendations?.length > 0) {
      await Recommendation.deleteMany({ source: "ml" });
      const docs = result.recommendations.map((r) => ({ ...r, source: "ml", isActive: true }));
      await Recommendation.insertMany(docs);
    }

    res.json({
      ...result,
      engine: external.data ? "external" : "local",
      fallbackReason: external.error?.message,
    });
  } catch (err) {
    console.error("ML recommendations error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ml/confidence
 * Scores all emission records for data confidence.
 */
router.post("/confidence", async (req, res) => {
  try {
    const records = await loadRecordsForML(req.body?.filters || {});
    if (records.length === 0) {
      return res.json({ results: [], message: "No records" });
    }
    const external = await tryExternalML("/confidence", { records });
    const result = external.data || fallbackConfidence(records);

    // Optionally update confidence ratings in DB
    if (req.body?.updateDB && result.results?.length > 0) {
      const updates = result.results.map((r) =>
        EmissionData.findByIdAndUpdate(r.id, {
          confidenceRating: r.confidenceRating,
        })
      );
      await Promise.all(updates);
    }

    res.json({
      ...result,
      engine: external.data ? "external" : "local",
      fallbackReason: external.error?.message,
    });
  } catch (err) {
    console.error("ML confidence error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
