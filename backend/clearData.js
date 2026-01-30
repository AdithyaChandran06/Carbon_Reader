const mongoose = require('mongoose');
const EmissionData = require('./models/EmissionData');
const Recommendation = require('./models/Recommendation');
const UploadedFile = require('./models/UploadedFile');
const EmissionFactor = require('./models/EmissionFactor');
require('dotenv').config();

async function clearAllData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carbon-accounting');
    console.log('✅ Connected to MongoDB');

    // Clear all collections
    await EmissionData.deleteMany({});
    await Recommendation.deleteMany({});
    await UploadedFile.deleteMany({});
    
    console.log('✅ All emission data, recommendations, and uploaded files cleared');
    console.log('ℹ️  Emission factors retained for processing new uploads');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

clearAllData();
