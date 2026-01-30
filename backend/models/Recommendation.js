const mongoose = require("mongoose");

const recommendationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["supplier", "transport", "material", "energy", "consolidation"],
      required: true,
    },
    currentEmissions: {
      type: Number,
      required: true,
    },
    potentialReduction: {
      type: Number,
      required: true,
    },
    percentageSavings: {
      type: Number,
      required: true,
    },
    costImpact: {
      type: Number,
      required: true,
    },
    implementationDifficulty: {
      type: String,
      enum: ["Low", "Medium", "High"],
      required: true,
    },
    priority: {
      type: Number,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Recommendation", recommendationSchema);
