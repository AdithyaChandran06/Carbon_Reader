const mongoose = require('mongoose');
const EmissionFactor = require('./models/EmissionFactor');
require('dotenv').config();

const additionalFactors = [
  // Materials
  { category: 'Materials', materialOrMode: 'Copper', unit: 'kg', factor: 3.2, source: 'Industry Standard' },
  { category: 'Materials', materialOrMode: 'Rubber', unit: 'kg', factor: 1.8, source: 'Industry Standard' },
  { category: 'Materials', materialOrMode: 'Wood', unit: 'kg', factor: 0.4, source: 'Industry Standard' },
  { category: 'Materials', materialOrMode: 'Glass', unit: 'kg', factor: 0.9, source: 'Industry Standard' },
  { category: 'Materials', materialOrMode: 'Cement', unit: 'kg', factor: 0.9, source: 'Industry Standard' },
  { category: 'Materials', materialOrMode: 'Paper', unit: 'kg', factor: 1.1, source: 'Industry Standard' },
  { category: 'Materials', materialOrMode: 'Chemicals', unit: 'kg', factor: 2.5, source: 'Industry Standard' },
];

async function addMissingFactors() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carbon-accounting');
    console.log('✅ Connected to MongoDB');

    for (const factor of additionalFactors) {
      await EmissionFactor.findOneAndUpdate(
        { category: factor.category, materialOrMode: factor.materialOrMode },
        factor,
        { upsert: true, new: true }
      );
      console.log(`✅ Added/Updated: ${factor.materialOrMode}`);
    }

    console.log(`\n✅ ${additionalFactors.length} emission factors added/updated`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addMissingFactors();
