/**
 * routes/liveFactors.js
 * ─────────────────────
 * Fetches real-time emission factors from:
 *   1. Climatiq API  (https://www.climatiq.io)  — primary
 *   2. Carbon Interface API (https://www.carboninterface.com) — electricity only
 *   3. Electricity Maps / CO2signal (https://www.electricitymaps.com) — grid carbon intensity
 *
 * Falls back to local MongoDB factors if all live calls fail.
 *
 * ENV variables needed (.env):
 *   CLIMATIQ_API_KEY=your_key
 *   CARBON_INTERFACE_API_KEY=your_key
 *   ELECTRICITY_MAPS_API_KEY=your_key
 */

const express = require("express");
const router = express.Router();
const EmissionFactor = require("../models/EmissionFactor");

const CLIMATIQ_BASE = "https://beta3.api.climatiq.io";
const CARBON_IF_BASE = "https://www.carboninterface.com/api/v1";
const ELEC_MAPS_BASE = "https://api.electricitymap.org/v3";

// ─── Helper: fetch with timeout ──────────────────────────────────────────────
async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Climatiq: search emission factors ───────────────────────────────────────
async function fetchClimatiqFactor(activity, region = "GLOBAL") {
  const key = process.env.CLIMATIQ_API_KEY;
  if (!key) return null;

  try {
    const res = await fetchWithTimeout(
      `${CLIMATIQ_BASE}/search?query=${encodeURIComponent(activity)}&region=${region}&results_per_page=1`,
      {
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    const result = data.results?.[0];
    if (!result) return null;

    return {
      materialOrMode: result.name || activity,
      factor: result.factor || null,
      unit: result.factor_calculation_unit || "kg CO2e/unit",
      source: "Climatiq",
      region: region,
      activityId: result.activity_id,
      yearReleased: result.year_released,
      confidenceRating: "High",
    };
  } catch (err) {
    console.warn("Climatiq fetch failed:", err.message);
    return null;
  }
}

// ─── Climatiq: calculate emissions for a specific activity ───────────────────
async function calculateClimatiq(activityId, parameters) {
  const key = process.env.CLIMATIQ_API_KEY;
  if (!key) return null;

  try {
    const res = await fetchWithTimeout(`${CLIMATIQ_BASE}/estimate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        emission_factor: { activity_id: activityId },
        parameters,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return {
      co2e: data.co2e,
      co2e_unit: data.co2e_unit,
      co2e_calculation_method: data.co2e_calculation_method,
      constituent_gases: data.constituent_gases,
    };
  } catch (err) {
    console.warn("Climatiq calculate failed:", err.message);
    return null;
  }
}

// ─── Carbon Interface: electricity estimate ──────────────────────────────────
async function fetchCarbonInterfaceElectricity(kwh, country = "us") {
  const key = process.env.CARBON_INTERFACE_API_KEY;
  if (!key) return null;

  try {
    const res = await fetchWithTimeout(
      `${CARBON_IF_BASE}/estimates`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "electricity",
          electricity_unit: "kwh",
          electricity_value: kwh,
          country: country.toLowerCase(),
        }),
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    return {
      co2e: data.data?.attributes?.carbon_kg,
      unit: "kg CO2e",
      source: "Carbon Interface",
      country,
    };
  } catch (err) {
    console.warn("Carbon Interface fetch failed:", err.message);
    return null;
  }
}

// ─── Electricity Maps: grid carbon intensity by zone ─────────────────────────
async function fetchGridIntensity(zone = "IN-SO") {
  const key = process.env.ELECTRICITY_MAPS_API_KEY;
  // Also try free CO2Signal endpoint
  const co2signalKey = process.env.CO2SIGNAL_API_KEY;

  if (key) {
    try {
      const res = await fetchWithTimeout(
        `${ELEC_MAPS_BASE}/carbon-intensity/latest?zone=${zone}`,
        {
          headers: { "auth-token": key },
        }
      );
      if (!res.ok) return null;
      const data = await res.json();
      return {
        zone,
        carbonIntensity: data.carbonIntensity,
        unit: "gCO2eq/kWh",
        datetime: data.datetime,
        source: "Electricity Maps",
      };
    } catch (err) {
      console.warn("Electricity Maps fetch failed:", err.message);
    }
  }

  if (co2signalKey) {
    try {
      const res = await fetchWithTimeout(
        `https://api.co2signal.com/v1/latest?countryCode=${zone}`,
        { headers: { "auth-token": co2signalKey } }
      );
      if (!res.ok) return null;
      const data = await res.json();
      return {
        zone,
        carbonIntensity: data.data?.carbonIntensity,
        unit: "gCO2eq/kWh",
        source: "CO2Signal",
      };
    } catch (err) {
      console.warn("CO2Signal fetch failed:", err.message);
    }
  }

  return null;
}

// ─── Routes ──────────────────────────────────────────────────────────────────

/**
 * GET /api/live-factors/search?activity=steel&region=GB
 * Search Climatiq for a live emission factor.
 */
router.get("/search", async (req, res) => {
  const { activity, region = "GLOBAL" } = req.query;
  if (!activity) return res.status(400).json({ error: "activity query param required" });

  const live = await fetchClimatiqFactor(activity, region);

  if (live) {
    return res.json({ source: "live", factor: live });
  }

  // Fallback: local DB
  const local = await EmissionFactor.findOne({
    materialOrMode: { $regex: new RegExp(activity, "i") },
  });

  if (local) {
    return res.json({
      source: "local",
      factor: {
        materialOrMode: local.materialOrMode,
        factor: local.factor,
        unit: local.unit,
        source: local.source,
        region: local.region,
        confidenceRating: local.confidenceRating,
      },
    });
  }

  res.status(404).json({ error: "No emission factor found", activity, region });
});

/**
 * POST /api/live-factors/calculate
 * Body: { activityId, parameters }
 * Calculates emissions via Climatiq for a specific activity ID.
 */
router.post("/calculate", async (req, res) => {
  const { activityId, parameters } = req.body;
  if (!activityId || !parameters) {
    return res.status(400).json({ error: "activityId and parameters required" });
  }

  const result = await calculateClimatiq(activityId, parameters);
  if (!result) {
    return res.status(502).json({ error: "Climatiq calculation failed or API key missing" });
  }

  res.json(result);
});

/**
 * POST /api/live-factors/electricity
 * Body: { kwh, country }
 * Returns CO2e for electricity consumption.
 */
router.post("/electricity", async (req, res) => {
  const { kwh = 1000, country = "gb" } = req.body;

  const result = await fetchCarbonInterfaceElectricity(kwh, country);
  if (result) return res.json(result);

  // Fallback to local factor
  const local = await EmissionFactor.findOne({ category: "Energy", materialOrMode: /Grid/i });
  if (local) {
    return res.json({
      co2e: kwh * local.factor,
      unit: "kg CO2e",
      source: "local_fallback",
      factor: local.factor,
    });
  }

  res.status(502).json({ error: "Electricity CO2 calculation failed" });
});

/**
 * GET /api/live-factors/grid-intensity?zone=IN-SO
 * Returns current grid carbon intensity for a zone.
 * Zone examples: IN-SO (South India), GB, DE, US-CAL-CISO
 */
router.get("/grid-intensity", async (req, res) => {
  const { zone = "IN-SO" } = req.query;
  const result = await fetchGridIntensity(zone);

  if (result) return res.json(result);

  // Return reasonable default for India South
  res.json({
    zone,
    carbonIntensity: 713,
    unit: "gCO2eq/kWh",
    source: "default_estimate",
    note: "Live API unavailable. Using India grid average estimate.",
  });
});

/**
 * GET /api/live-factors/status
 * Check which live API keys are configured.
 */
router.get("/status", (req, res) => {
  res.json({
    climatiq: !!process.env.CLIMATIQ_API_KEY,
    carbonInterface: !!process.env.CARBON_INTERFACE_API_KEY,
    electricityMaps: !!process.env.ELECTRICITY_MAPS_API_KEY,
    co2signal: !!process.env.CO2SIGNAL_API_KEY,
  });
});

module.exports = router;
module.exports.fetchClimatiqFactor = fetchClimatiqFactor;
module.exports.fetchGridIntensity = fetchGridIntensity;
