const mongoose = require("mongoose");

const emissionDataSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ["Materials", "Transport", "Packaging", "Energy", "Waste", "Services"],
      required: true,
    },
    subCategory: {
      type: String,
      required: true,
    },
    activityData: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      required: true,
    },
    emissionFactor: {
      type: Number,
      required: true,
    },
    emissionFactorUnit: {
      type: String,
      required: true,
    },
    emissionFactorSource: {
      type: String,
      required: true,
    },
    region: {
      type: String,
      required: true,
    },
    co2e: {
      type: Number,
      required: true,
    },
    confidenceRating: {
      type: String,
      enum: ["High", "Medium", "Low"],
      required: true,
    },
    sourceDocument: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UploadedFile",
    },
    supplier: {
      type: String,
    },
    date: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EmissionData", emissionDataSchema);
