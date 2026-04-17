const mongoose = require("mongoose");
const dotenv = require("dotenv");
const EmissionData = require("./models/EmissionData");
const Recommendation = require("./models/Recommendation");
const UploadedFile = require("./models/UploadedFile");

dotenv.config();

const clearDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected");

    await EmissionData.deleteMany({});
    await Recommendation.deleteMany({});
    await UploadedFile.deleteMany({});
    console.log("🗑️  All records wiped clean!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

clearDB();
