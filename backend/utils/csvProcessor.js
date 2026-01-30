const fs = require("fs");
const csv = require("csv-parser");
const EmissionData = require("../models/EmissionData");
const EmissionFactor = require("../models/EmissionFactor");

/**
 * Process CSV file and extract emission data
 */
async function processCSVFile(filePath, sourceType, fileId) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        results.push(row);
      })
      .on("end", async () => {
        try {
          const emissionEntries = await parseCSVData(results, sourceType, fileId);
          resolve(emissionEntries);
        } catch (error) {
          reject(error);
        }
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

/**
 * Parse CSV data based on source type and create emission entries
 */
async function parseCSVData(rows, sourceType, fileId) {
  const emissionEntries = [];

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
        // Try to auto-detect based on column names
        emissionData = await autoDetectAndParse(row, fileId);
      }

      if (emissionData) {
        const savedEntry = await EmissionData.create(emissionData);
        emissionEntries.push(savedEntry);
      }
    } catch (error) {
      console.error("Error parsing row:", error);
    }
  }

  return emissionEntries;
}

/**
 * Parse materials data from CSV row
 */
async function parseMaterialsData(row, fileId) {
  const materialType = row.material_type || row.Material || row.material;
  const quantity = parseFloat(row.quantity || row.Quantity || row.amount || 0);
  const unit = row.unit || row.Unit || "kg";
  const supplier = row.supplier || row.Supplier || "Unknown";
  const region = row.region || row.Region || "Global";
  const date = row.date || row.Date || new Date();

  // Find matching emission factor
  const emissionFactor = await EmissionFactor.findOne({
    category: "Materials",
    materialOrMode: { $regex: new RegExp(materialType, "i") },
  });

  if (!emissionFactor) {
    console.warn(`No emission factor found for material: ${materialType}`);
    return null;
  }

  const co2e = quantity * emissionFactor.factor;

  return {
    category: "Materials",
    subCategory: materialType,
    activityData: quantity,
    unit: unit,
    emissionFactor: emissionFactor.factor,
    emissionFactorUnit: emissionFactor.unit,
    emissionFactorSource: emissionFactor.source,
    region: region,
    co2e: co2e,
    confidenceRating: emissionFactor.confidenceRating,
    sourceDocument: fileId,
    supplier: supplier,
    date: new Date(date),
  };
}

/**
 * Parse transport data from CSV row
 */
async function parseTransportData(row, fileId) {
  const mode = row.mode || row.Mode || row.transport_mode;
  const distance = parseFloat(row.distance || row.Distance || 0);
  const unit = row.unit || row.Unit || "km";
  const weight = parseFloat(row.weight || row.Weight || 1);
  const origin = row.origin || row.Origin;
  const destination = row.destination || row.Destination;
  const date = row.date || row.Date || new Date();

  // Find matching emission factor
  const emissionFactor = await EmissionFactor.findOne({
    category: "Transport",
    materialOrMode: { $regex: new RegExp(mode, "i") },
  });

  if (!emissionFactor) {
    console.warn(`No emission factor found for transport mode: ${mode}`);
    return null;
  }

  // Calculate emissions (distance * weight * factor)
  const activityData = distance * weight;
  const co2e = activityData * emissionFactor.factor;

  return {
    category: "Transport",
    subCategory: mode,
    activityData: distance,
    unit: unit,
    emissionFactor: emissionFactor.factor,
    emissionFactorUnit: emissionFactor.unit,
    emissionFactorSource: emissionFactor.source,
    region: "Global",
    co2e: co2e,
    confidenceRating: emissionFactor.confidenceRating,
    sourceDocument: fileId,
    date: new Date(date),
  };
}

/**
 * Parse energy data from CSV row
 */
async function parseEnergyData(row, fileId) {
  const energyType = row.energy_type || row.EnergyType || row.type;
  const consumption = parseFloat(row.consumption || row.Consumption || row.amount || 0);
  const unit = row.unit || row.Unit || "kWh";
  const region = row.region || row.Region || "Global";
  const date = row.date || row.Date || new Date();

  // Find matching emission factor
  const emissionFactor = await EmissionFactor.findOne({
    category: "Energy",
    materialOrMode: { $regex: new RegExp(energyType, "i") },
  });

  if (!emissionFactor) {
    console.warn(`No emission factor found for energy type: ${energyType}`);
    return null;
  }

  const co2e = consumption * emissionFactor.factor;

  return {
    category: "Energy",
    subCategory: energyType,
    activityData: consumption,
    unit: unit,
    emissionFactor: emissionFactor.factor,
    emissionFactorUnit: emissionFactor.unit,
    emissionFactorSource: emissionFactor.source,
    region: region,
    co2e: co2e,
    confidenceRating: emissionFactor.confidenceRating,
    sourceDocument: fileId,
    date: new Date(date),
  };
}

/**
 * Auto-detect data type and parse accordingly
 */
async function autoDetectAndParse(row, fileId) {
  // Check for materials indicators
  if (row.material_type || row.Material || row.material) {
    return parseMaterialsData(row, fileId);
  }
  
  // Check for transport indicators
  if (row.mode || row.Mode || row.transport_mode) {
    return parseTransportData(row, fileId);
  }
  
  // Check for energy indicators
  if (row.energy_type || row.EnergyType) {
    return parseEnergyData(row, fileId);
  }

  return null;
}

module.exports = {
  processCSVFile,
  parseCSVData,
};
