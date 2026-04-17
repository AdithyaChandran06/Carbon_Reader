const mongoose = require("mongoose");
const dotenv = require("dotenv");
const EmissionData = require("./models/EmissionData");
const Recommendation = require("./models/Recommendation");

dotenv.config();

const sampleEmissionData = [
  {
    category: "Materials",
    subCategory: "Steel",
    activityData: 200000,
    unit: "kg",
    emissionFactor: 1.80,
    emissionFactorUnit: "kg CO₂e/kg",
    emissionFactorSource: "Ecoinvent",
    region: "EU",
    co2e: 3600,
    confidenceRating: "High",
    supplier: "Supplier A",
    date: new Date("2024-01-15"),
  },
  {
    category: "Materials",
    subCategory: "Aluminum",
    activityData: 50000,
    unit: "kg",
    emissionFactor: 10.00,
    emissionFactorUnit: "kg CO₂e/kg",
    emissionFactorSource: "DEPA",
    region: "EU",
    co2e: 500,
    confidenceRating: "High",
    supplier: "Supplier B",
    date: new Date("2024-02-20"),
  },
  {
    category: "Transport",
    subCategory: "Full Truck",
    activityData: 5000,
    unit: "km",
    emissionFactor: 0.12,
    emissionFactorUnit: "kg CO₂e/ton-km",
    emissionFactorSource: "Ecoinvent",
    region: "Europe",
    co2e: 600,
    confidenceRating: "High",
    date: new Date("2024-01-10"),
  },
  {
    category: "Packaging",
    subCategory: "Cardboard",
    activityData: 15000,
    unit: "kg",
    emissionFactor: 0.94,
    emissionFactorUnit: "kg CO₂e/kg",
    emissionFactorSource: "Ecoinvent",
    region: "EU",
    co2e: 141,
    confidenceRating: "Medium",
    date: new Date("2024-03-01"),
  },
  {
    category: "Energy",
    subCategory: "Grid Electricity",
    activityData: 338000,
    unit: "kWh",
    emissionFactor: 0.35,
    emissionFactorUnit: "kg CO₂e/kWh",
    emissionFactorSource: "EEA",
    region: "EU",
    co2e: 1183,
    confidenceRating: "High",
    date: new Date("2024-03-15"),
  },
];

const sampleRecommendations = [
  {
    title: "Switch to Renewable Energy",
    description: "Transition to 100% renewable electricity for operations",
    type: "energy",
    currentEmissions: 1183,
    potentialReduction: 1065,
    percentageSavings: 90,
    costImpact: 25000,
    implementationDifficulty: "Medium",
    priority: 1,
  },
  {
    title: "Use Recycled Aluminum",
    description: "Cut aluminum emissions by 80% using recycled materials",
    type: "material",
    currentEmissions: 500,
    potentialReduction: 400,
    percentageSavings: 80,
    costImpact: 15000,
    implementationDifficulty: "Medium",
    priority: 2,
  },
  {
    title: "Shift Air to Ship Transport",
    description: "Reduce freight emissions by switching transport mode",
    type: "transport",
    currentEmissions: 600,
    potentialReduction: 150,
    percentageSavings: 25,
    costImpact: -5000,
    implementationDifficulty: "Low",
    priority: 3,
  },
];

const seedSampleData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected");

    // Clear existing data
    await EmissionData.deleteMany({});
    await Recommendation.deleteMany({});
    console.log("🗑️  Cleared existing data");

    // Insert sample emission data
    await EmissionData.insertMany(sampleEmissionData);
    console.log("✅ Seeded emission data");

    // Insert sample recommendations
    await Recommendation.insertMany(sampleRecommendations);
    console.log("✅ Seeded recommendations");

    console.log("🎉 Sample data seeded successfully!");
    console.log("\n📊 You can now view:");
    console.log("  - Dashboard with real metrics");
    console.log("  - Recommendations");
    console.log("  - Analytics and charts");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding sample data:", error);
    process.exit(1);
  }
};

seedSampleData();
