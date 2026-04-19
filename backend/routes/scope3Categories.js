/**
 * routes/scope3Categories.js
 * ──────────────────────────
 * GHG Protocol Scope 3 Categories & Emission Factors
 * Reference data for companies tracking indirect value chain emissions
 *
 * Scope 3 includes 15 categories of indirect emissions:
 * 1-5: Upstream activities
 * 6-8: Use & disposal phase
 * 9-15: Downstream activities
 */

const express = require("express");
const router = express.Router();

// GHG Protocol Scope 3 Categories with typical emission factors
const SCOPE3_CATEGORIES = [
  {
    id: 1,
    name: "Purchased Goods & Materials",
    description: "Emissions from extraction, production, and transportation of purchased materials",
    typicalFactors: {
      "Steel (per kg)": 2.0,
      "Aluminum (per kg)": 8.0,
      "Plastic (per kg)": 3.5,
      "Paper (per kg)": 1.2,
      "Concrete (per kg)": 0.12,
    },
    unitOptions: ["kg", "tonnes", "units"],
  },
  {
    id: 4,
    name: "Upstream Transportation & Distribution",
    description: "Emissions from transportation of purchased products between suppliers and operations",
    typicalFactors: {
      "Truck (per km)": 0.65,
      "Rail (per km)": 0.08,
      "Ship (per km)": 0.01,
      "Air (per km)": 1.2,
    },
    unitOptions: ["km", "tonne-km", "shipments"],
  },
  {
    id: 5,
    name: "Waste Generated in Operations",
    description: "Emissions from disposal and treatment of waste generated in operations",
    typicalFactors: {
      "Landfill (per tonne)": 0.5,
      "Recycling (per tonne)": 0.1,
      "Incineration (per tonne)": 1.2,
      "Composting (per tonne)": 0.05,
    },
    unitOptions: ["tonnes", "kg"],
  },
  {
    id: 6,
    name: "Business Travel",
    description: "Emissions from transportation of employees for business purposes",
    typicalFactors: {
      "Car (per km)": 0.21,
      "Train (per km)": 0.041,
      "Flight - Domestic (per km)": 0.255,
      "Flight - International (per km)": 0.195,
    },
    unitOptions: ["km", "trips", "miles"],
  },
  {
    id: 7,
    name: "Employee Commuting",
    description: "Emissions from employee travel to and from work",
    typicalFactors: {
      "Car (per km)": 0.21,
      "Public Transport (per km)": 0.09,
      "Train (per km)": 0.041,
      "Cycling/Walking (per km)": 0.0,
    },
    unitOptions: ["km", "employee-days"],
  },
  {
    id: 9,
    name: "Downstream Transportation & Distribution",
    description: "Emissions from transportation of sold products to end consumer",
    typicalFactors: {
      "Truck (per km)": 0.65,
      "Rail (per km)": 0.08,
      "Ship (per km)": 0.01,
      "Air (per km)": 1.2,
    },
    unitOptions: ["km", "tonne-km"],
  },
  {
    id: 11,
    name: "Use of Sold Products",
    description: "Emissions from consumption/use of products sold during reporting year",
    typicalFactors: {
      "Fuel consumption (per litre)": 2.31,
      "Electricity usage (per kWh)": 0.4,
      "Gas usage (per m³)": 1.83,
    },
    unitOptions: ["litre", "kWh", "m³", "units"],
  },
];

// GET /api/scope3-categories - Get all Scope 3 categories
router.get("/", (req, res) => {
  res.json({
    success: true,
    categories: SCOPE3_CATEGORIES,
    totalCategories: SCOPE3_CATEGORIES.length,
    description: "GHG Protocol Scope 3 indirect emissions categories"
  });
});

// GET /api/scope3-categories/:id - Get specific category
router.get("/:id", (req, res) => {
  const category = SCOPE3_CATEGORIES.find(c => c.id === parseInt(req.params.id));
  if (!category) {
    return res.status(404).json({ error: "Category not found" });
  }
  res.json({ success: true, category });
});

// POST /api/scope3-categories/validate - Validate data against Scope 3 standards
router.post("/validate", async (req, res) => {
  try {
    const { category, activityData, unit } = req.body;

    if (!category || !activityData) {
      return res.status(400).json({ error: "category and activityData required" });
    }

    const categoryDef = SCOPE3_CATEGORIES.find(c => c.id === parseInt(category));
    if (!categoryDef) {
      return res.status(400).json({ error: "Invalid Scope 3 category" });
    }

    const isValidUnit = categoryDef.unitOptions.includes(unit);
    const defaultFactor = Object.values(categoryDef.typicalFactors)[0];

    res.json({
      success: true,
      isValid: isValidUnit,
      category: categoryDef.name,
      suggestedFactor: defaultFactor,
      message: isValidUnit ? "Data validates against Scope 3 standard" : "Unit not typical for this category"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
