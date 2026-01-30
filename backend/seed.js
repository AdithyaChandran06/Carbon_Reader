const mongoose = require("mongoose");
const dotenv = require("dotenv");
const EmissionFactor = require("./models/EmissionFactor");

dotenv.config();

const emissionFactors = [
  { category: "Materials", materialOrMode: "Steel", region: "EU", factor: 1.80, unit: "kg CO₂e/kg", source: "Ecoinvent Database", confidenceRating: "High" },
  { category: "Materials", materialOrMode: "Aluminum", region: "EU", factor: 10.00, unit: "kg CO₂e/kg", source: "DEPA & CP", confidenceRating: "High" },
  { category: "Materials", materialOrMode: "Recycled Aluminum", region: "EU", factor: 2.00, unit: "kg CO₂e/kg", source: "Ecoinvent Database", confidenceRating: "High" },
  { category: "Materials", materialOrMode: "Plastic", region: "Global", factor: 3.50, unit: "kg CO₂e/kg", source: "GHG Protocol", confidenceRating: "Medium" },
  { category: "Materials", materialOrMode: "Cotton", region: "EU", factor: 2.10, unit: "kg CO₂e/kg", source: "Ecoinvent Database", confidenceRating: "High" },
  { category: "Transport", materialOrMode: "Full Truck", region: "Europe", factor: 0.12, unit: "kg CO₂e/ton-km", source: "Ecoinvent Database", confidenceRating: "High" },
  { category: "Transport", materialOrMode: "Ship-Average", region: "Global", factor: 0.015, unit: "kg CO₂e/ton-km", source: "IMO 2023", confidenceRating: "High" },
  { category: "Transport", materialOrMode: "Rail-Europe", region: "Europe", factor: 0.02, unit: "kg CO₂e/ton-km", source: "UIC Database", confidenceRating: "High" },
  { category: "Transport", materialOrMode: "Air Freight", region: "Global", factor: 0.80, unit: "kg CO₂e/ton-km", source: "IATA", confidenceRating: "High" },
  { category: "Energy", materialOrMode: "Grid Electricity", region: "EU", factor: 0.35, unit: "kg CO₂e/kWh", source: "EEA 2023", confidenceRating: "High" },
  { category: "Energy", materialOrMode: "Natural Gas", region: "Global", factor: 2.02, unit: "kg CO₂e/m³", source: "IPCC 2021", confidenceRating: "High" },
  { category: "Packaging", materialOrMode: "Cardboard", region: "EU", factor: 0.94, unit: "kg CO₂e/kg", source: "Ecoinvent Database", confidenceRating: "High" },
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected");

    // Clear existing emission factors
    await EmissionFactor.deleteMany({});
    console.log("🗑️  Cleared existing emission factors");

    // Insert new emission factors
    await EmissionFactor.insertMany(emissionFactors);
    console.log("✅ Seeded emission factors");

    console.log("🎉 Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
