/**
 * utils/csvProcessor.js  (UPGRADED)
 * Changes:
 *  1. After parsing, calls ML /confidence endpoint to score each record
 *  2. Falls back to "Medium" if ML service is down
 *  3. Tries live Climatiq factor first, falls back to local DB
 */

const fs = require("fs");
const csv = require("csv-parser");
const EmissionData = require("../models/EmissionData");
const EmissionFactor = require("../models/EmissionFactor");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8001";

// ── Try to fetch a live emission factor, fall back to local ──────────────────
async function resolveEmissionFactor(category, materialOrMode, region = "GLOBAL") {
  // 1. Try live Climatiq via our own backend route (avoids CORS)
  try {
    const res = await fetch(
      `http://localhost:${process.env.PORT || 5000}/api/live-factors/search?activity=${encodeURIComponent(materialOrMode)}&region=${region}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.factor?.factor) return data.factor;
    }
  } catch (_) { /* fall through */ }

  // 2. Fall back to local DB
  const local = await EmissionFactor.findOne({
    category,
    materialOrMode: { $regex: new RegExp(materialOrMode, "i") },
  });

  return local || null;
}

// ── Score confidence via ML service ──────────────────────────────────────────
async function scoreConfidence(records) {
  try {
    const res = await fetch(`${ML_SERVICE_URL}/confidence`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    // Build a map id -> confidenceRating
    const map = {};
    for (const r of data.results || []) {
      map[r.id] = r.confidenceRating;
    }
    return map;
  } catch (_) {
    return null; // ML offline → use "Medium"
  }
}

async function processCSVFile(filePath, sourceType, fileId) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => results.push(row))
      .on("end", async () => {
        try {
          const entries = await parseCSVData(results, sourceType, fileId);
          resolve(entries);
        } catch (error) {
          reject(error);
        }
      })
      .on("error", reject);
  });
}

async function parseCSVData(rows, sourceType, fileId) {
  const emissionEntries = [];
  const pendingRecords = []; // for ML confidence scoring

  for (const row of rows) {
    try {
      let emissionData;
      if (sourceType === "Materials" || row.material_type) {
        emissionData = await parseMaterialsData(row, fileId);
      } else if (sourceType === "Transport" || row.mode) {
        emissionData = await parseTransportData(row, fileId);
      } else if (sourceType === "Energy" || row.energy_type) {
        emissionData = await parseEnergyData(row, fileId);
      } else {
        emissionData = await autoDetectAndParse(row, fileId);
      }

      if (emissionData) {
        pendingRecords.push({
          id: `temp_${pendingRecords.length}`,
          ...emissionData,
        });
        emissionEntries.push(emissionData);
      }
    } catch (error) {
      console.error("Error parsing row:", error);
    }
  }

  // Score confidence for all parsed records
  const confidenceMap = await scoreConfidence(pendingRecords);

  // Save to DB with ML confidence ratings
  const saved = [];
  for (let i = 0; i < emissionEntries.length; i++) {
    const data = emissionEntries[i];
    if (confidenceMap) {
      data.confidenceRating = confidenceMap[`temp_${i}`] || "Medium";
    }
    const savedEntry = await EmissionData.create(data);
    saved.push(savedEntry);
  }

  return saved;
}

async function parseMaterialsData(row, fileId) {
  const materialType = row.material_type || row.Material || row.material;
  const quantity = parseFloat(row.quantity || row.Quantity || row.amount || 0);
  const unit = row.unit || row.Unit || "kg";
  const supplier = row.supplier || row.Supplier || "Unknown";
  const region = row.region || row.Region || "Global";
  const date = row.date || row.Date || new Date();

  const factor = await resolveEmissionFactor("Materials", materialType, region);
  if (!factor) {
    console.warn(`No emission factor found for material: ${materialType}`);
    return null;
  }

  return {
    category: "Materials",
    subCategory: materialType,
    activityData: quantity,
    unit,
    emissionFactor: factor.factor,
    emissionFactorUnit: factor.unit,
    emissionFactorSource: factor.source,
    region,
    co2e: quantity * factor.factor,
    confidenceRating: "Medium", // will be overridden by ML
    sourceDocument: fileId,
    supplier,
    date: new Date(date),
  };
}

async function parseTransportData(row, fileId) {
  const mode = row.mode || row.Mode || row.transport_mode;
  const distance = parseFloat(row.distance || row.Distance || 0);
  const unit = row.unit || row.Unit || "km";
  const weight = parseFloat(row.weight || row.Weight || 1);
  const date = row.date || row.Date || new Date();

  const factor = await resolveEmissionFactor("Transport", mode);
  if (!factor) {
    console.warn(`No emission factor found for transport mode: ${mode}`);
    return null;
  }

  return {
    category: "Transport",
    subCategory: mode,
    activityData: distance,
    unit,
    emissionFactor: factor.factor,
    emissionFactorUnit: factor.unit,
    emissionFactorSource: factor.source,
    confidenceRating: "Medium",
    region: row.region || "Global",
    co2e: distance * weight * factor.factor,
    sourceDocument: fileId,
    date: new Date(date),
  };
}

async function parseEnergyData(row, fileId) {
  const energyType = row.energy_type || row.EnergyType || row.type;
  const consumption = parseFloat(row.consumption || row.Consumption || row.amount || 0);
  const unit = row.unit || row.Unit || "kWh";
  const region = row.region || row.Region || "Global";
  const date = row.date || row.Date || new Date();

  const factor = await resolveEmissionFactor("Energy", energyType, region);
  if (!factor) {
    console.warn(`No emission factor found for energy type: ${energyType}`);
    return null;
  }

  return {
    category: "Energy",
    subCategory: energyType,
    activityData: consumption,
    unit,
    emissionFactor: factor.factor,
    emissionFactorUnit: factor.unit,
    emissionFactorSource: factor.source,
    region,
    co2e: consumption * factor.factor,
    confidenceRating: "Medium",
    sourceDocument: fileId,
    date: new Date(date),
  };
}

async function autoDetectAndParse(row, fileId) {
  if (row.material_type || row.Material || row.material) return parseMaterialsData(row, fileId);
  if (row.mode || row.Mode || row.transport_mode) return parseTransportData(row, fileId);
  if (row.energy_type || row.EnergyType) return parseEnergyData(row, fileId);
  return null;
}

module.exports = { processCSVFile, parseCSVData };
