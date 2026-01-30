const mongoose = require("mongoose");

const emissionFactorSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ["Materials", "Transport", "Packaging", "Energy", "Waste", "Services"],
      required: true,
    },
    materialOrMode: {
      type: String,
      required: true,
    },
    region: {
      type: String,
      required: true,
    },
    factor: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      required: true,
    },
    source: {
      type: String,
      required: true,
    },
    confidenceRating: {
      type: String,
      enum: ["High", "Medium", "Low"],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EmissionFactor", emissionFactorSchema);
